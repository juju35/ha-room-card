import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const rc = load();
const { cards } = rc;
// Arrays made inside the sandbox belong to another realm: copy them for deepStrictEqual.
const ids = (list) => [...list].map((x) => (typeof x === "string" ? x : x.id));

// A tile stand-in recording its listeners, to fire pointer events by hand.
const fakeTile = () => {
  const on = {};
  return {
    on,
    classList: { add() {}, remove() {} },
    setPointerCapture() {},
    addEventListener(type, fn) {
      on[type] = fn;
    },
    fire(type, ev = {}) {
      on[type]?.({ button: 0, clientX: 0, clientY: 0, preventDefault() {}, ...ev });
    },
  };
};

// A plugs card with one bound tile; `renders` counts the renders after setup.
const pressSetup = () => {
  const card = new cards["room-switch-card"]();
  card.setConfig({ area: "kitchen" });
  card.hass = makeHass();
  const t = { card, tile: fakeTile(), calls: [], renders: 0 };
  card._render = () => t.renders++;
  card._bindPress(t.tile, { onTap: () => t.calls.push("tap"), onHold: () => t.calls.push("hold") });
  return t;
};

test("an update during a press does not re-render, so the tap toggles instead of opening more-info", async () => {
  const t = pressSetup();
  const { card, tile, calls } = t;
  tile.fire("pointerdown");
  card.hass = makeHass(); // power sensor tick in the middle of the press
  assert.equal(t.renders, 0, "render deferred while pressing");
  tile.fire("pointerup");
  assert.deepEqual(calls, ["tap"]);
  assert.equal(t.renders, 1, "deferred update rendered after the press");

  await new Promise((r) => setTimeout(r, rc.RC_HOLD_MS + 50));
  assert.deepEqual(calls, ["tap"], "no hold fired after the tap");
  card.hass = makeHass();
  assert.equal(t.renders, 2, "renders normally again");
});

test("a hold still opens more-info and releases the render lock", async () => {
  const t = pressSetup();
  const { card, tile, calls } = t;
  tile.fire("pointerdown");
  card.hass = makeHass();
  await new Promise((r) => setTimeout(r, rc.RC_HOLD_MS + 50));
  assert.deepEqual(calls, ["hold"]);
  assert.equal(t.renders, 1);
  assert.equal(card._pressing, false);
});

test("room discovery is cached on the registries, not on hass.states", () => {
  const card = new cards["room-switch-card"]();
  card.setConfig({ area: "kitchen" });
  const h = makeHass();
  card.hass = h;
  const first = card._areaIds();
  card.hass = { ...h, states: { ...h.states } }; // a state change: same registries
  assert.equal(card._areaIds(), first);
  card.hass = { ...h, entities: { ...h.entities } }; // registry change
  assert.notEqual(card._areaIds(), first);
  assert.deepEqual(ids(card._items), ["switch.coffee_plug"]);
});

test("the Overview counts what the sensors card shows (diagnostic door sensors included)", () => {
  const sensors = new cards["room-sensors-card"]();
  sensors.setConfig({ area: "kitchen" });
  sensors.hass = makeHass();
  const overview = new cards["room-overview-card"]();
  overview._config = { ...cards["room-overview-card"].defaults };
  overview._hass = makeHass();
  const [room] = overview._collect();
  assert.deepEqual(ids(room.sensors).sort(), ids(sensors._items).sort());
  assert.ok(ids(room.sensors).includes("binary_sensor.diag_door"));
  assert.equal(room.open, 1); // the diagnostic door sensor is open
  assert.deepEqual(ids(room.lights), ["light.ceiling"]);
  assert.deepEqual(ids(room.plugs), ["switch.coffee_plug"]);
});

test("the Overview passes its language to the room details", () => {
  const overview = new cards["room-overview-card"]();
  const panel = fakeNode();
  overview.shadowRoot = { ...fakeNode(), querySelector: (s) => (s === ".panel" ? panel : null) };
  overview._config = { ...cards["room-overview-card"].defaults, language: "en" };
  overview._hass = makeHass();
  overview._rooms = overview._collect();
  overview._openArea = "kitchen";
  overview._fillPanel();
  assert.ok(panel.children.length > 0);
  for (const el of panel.children) assert.equal(el._config.language, "en");
});
