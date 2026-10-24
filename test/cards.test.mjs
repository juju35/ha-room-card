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

test("the Overview's plugs_off_button reaches the Plugs card of the room details", () => {
  const plugsCard = (options) => {
    const overview = new cards["room-overview-card"]();
    const panel = fakeNode();
    overview.shadowRoot = { ...fakeNode(), querySelector: (s) => (s === ".panel" ? panel : null) };
    overview._config = { ...cards["room-overview-card"].defaults, ...options };
    overview._hass = makeHass();
    overview._rooms = overview._collect();
    overview._openArea = "kitchen";
    overview._fillPanel();
    return panel.children.find((el) => el._config.type === "custom:room-switch-card");
  };
  assert.equal(plugsCard({})._config.all_off_button, false);
  assert.equal(plugsCard({ plugs_off_button: true })._config.all_off_button, true);
});

test("holding Enter on a tile toggles once, not on every key repeat", () => {
  const t = pressSetup();
  const key = (repeat) => t.tile.fire("keydown", { key: "Enter", repeat });
  key(false);
  key(true);
  key(true);
  assert.deepEqual(t.calls, ["tap"]);
});

test("a failing service call does not leave an unhandled rejection", async () => {
  const rejections = [];
  const onRejection = (e) => rejections.push(e);
  process.on("unhandledRejection", onRejection);
  await rc.rcCall({ callService: () => Promise.reject(new Error("read-only")) }, "homeassistant", "toggle", {});
  await new Promise((r) => setTimeout(r, 10));
  process.off("unhandledRejection", onRejection);
  assert.equal(rejections.length, 0);
});

test("getCardSize counts the tiles shown, and nothing when the card is hidden", () => {
  const card = new cards["room-switch-card"]();
  card.setConfig({ area: "kitchen", columns: 1, only_on: true });
  const h = makeHass();
  h.entities["switch.tv_plug"] = { area_id: "kitchen" };
  h.states["switch.tv_plug"] = { entity_id: "switch.tv_plug", state: "off", attributes: { friendly_name: "TV plug" } };
  card.hass = h;
  assert.equal(card._items.length, 2);
  assert.equal(card.getCardSize(), 2); // header + the one plug that is on
  card.setConfig({ area: "kitchen", hide_when_off: true });
  card.hass = { ...h, states: { ...h.states, "switch.coffee_plug": { ...h.states["switch.coffee_plug"], state: "off" } } };
  assert.equal(card.getCardSize(), 0);
});

test("the header with a navigation path is a keyboard-reachable link", () => {
  const card = new cards["room-switch-card"]();
  card.attachShadow();
  card.shadowRoot.querySelector = () => fakeNode();
  card.setConfig({ area: "kitchen", navigation_path: "/energy" });
  card.hass = makeHass();
  assert.match(card.shadowRoot.innerHTML, /class="head nav" role="link" tabindex="0"/);
  card.setConfig({ area: "kitchen" });
  card.hass = makeHass();
  assert.doesNotMatch(card.shadowRoot.innerHTML, /role="link"/);
});

test("shared strings fall back per language before English", () => {
  const card = new cards["room-lights-card"]();
  card._config = { language: "fr" };
  assert.equal(card._t("turn_all_off"), "Tout éteindre");
  assert.equal(card._t("no_lights"), "Aucune lumière");
  card._config = { language: "de" };
  assert.equal(card._t("err_config"), "Set `area` or `entities`");
});

test("the Overview stays unfolded when clicking inside a more-info dialog", () => {
  const overview = new cards["room-overview-card"]();
  let folded = 0;
  overview._toggle = () => folded++;
  overview._openArea = "kitchen";
  const click = (...names) => ({ composedPath: () => names.map((localName) => ({ localName })) });
  overview._onOutside(click("div", "ha-more-info-dialog", "home-assistant", "body"));
  overview._onOutside(click("div", "ha-dialog", "body"));
  assert.equal(folded, 0);
  overview._onOutside(click("div", "hui-view", "body"));
  assert.equal(folded, 1);
});

test("the Overview's plain list is redrawn when an entity of the open room becomes unavailable", () => {
  const overview = new cards["room-overview-card"]();
  // Nodes keyed by selector, so the render finds the same elements again.
  const nodes = {};
  const node = () => ({ ...fakeNode(), style: { setProperty() {} }, querySelector: (s) => (nodes[s] ||= node()) });
  overview.shadowRoot = node();
  nodes["ha-card"] = node();
  overview._config = { ...cards["room-overview-card"].defaults };
  overview._hass = makeHass();
  const realGet = rc.customElements.get;
  rc.customElements.get = (t) => (t.startsWith("room-") && t !== "room-overview-card" ? undefined : realGet(t));
  try {
    overview._toggle("kitchen");
    assert.equal(overview._fallback, true);
    let fills = 0;
    const fill = overview._fillFallback.bind(overview);
    overview._fillFallback = (...a) => {
      fills++;
      fill(...a);
    };
    const h = makeHass();
    h.states["binary_sensor.door"] = { ...h.states["binary_sensor.door"], state: "unavailable" };
    overview.hass = h; // aggregates unchanged: the door was closed, it is now unavailable
    assert.equal(fills, 1);
    assert.match(nodes[".panel"].innerHTML, /Indisponible/);
  } finally {
    rc.customElements.get = realGet;
  }
});
