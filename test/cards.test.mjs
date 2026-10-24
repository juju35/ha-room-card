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

// An Overview whose shadow-root nodes are kept by selector and record their listeners, so that the header can be
// clicked and pressed by hand. `calls` collects the service calls.
const overviewSetup = (options = {}, hass = makeHass()) => {
  const overview = new cards["room-overview-card"]();
  const nodes = {};
  const node = () => {
    const on = {};
    return {
      ...fakeNode(),
      on,
      style: { setProperty() {} },
      addEventListener(type, fn) {
        (on[type] ||= []).push(fn);
      },
      fire(type, ev = {}) {
        for (const fn of on[type] || []) fn({ button: 0, stopPropagation() {}, ...ev });
      },
      focus() {
        focused.push(this);
      },
      querySelector: (s) => (nodes[s] ||= node()),
    };
  };
  const focused = [];
  overview.attachShadow();
  // No <ha-card> until the first render has written the skeleton, so that the card wires its listeners.
  overview.shadowRoot.querySelector = (s) => (s === "ha-card" && !overview.shadowRoot.innerHTML ? null : (nodes[s] ||= node()));
  const calls = [];
  overview.setConfig({ ...options });
  overview.hass = { ...hass, callService: (...a) => calls.push(JSON.parse(JSON.stringify(a))) };
  return { overview, nodes, calls, focused };
};

// Event target inside the header: `kind` is the data-kind of the chip it belongs to, or null.
const chipTarget = (kind) => ({ closest: (s) => (kind && s === ".chip.action" ? { dataset: { kind } } : null) });

const withWatts = (w) => {
  const h = makeHass();
  h.states["sensor.coffee_power"] = { ...h.states["sensor.coffee_power"], state: String(w) };
  return h;
};

test("a power update during a press on a header chip does not rewrite the header", async () => {
  const { overview, nodes, calls } = overviewSetup({ plugs_off_button: true }, withWatts(80));
  const head = nodes[".head"];
  const before = head.innerHTML;
  assert.match(before, /80 W/);
  head.fire("pointerdown", { target: chipTarget("lights") });
  overview.hass = { ...withWatts(83), callService: (...a) => calls.push(a) };
  assert.equal(head.innerHTML, before, "header kept while the chip is pressed");
  head.fire("pointerup", { target: chipTarget("lights") });
  head.fire("click", { target: chipTarget("lights") });
  assert.equal(calls.length, 1, "the tap reached the chip");
  await new Promise((r) => setTimeout(r, 10));
  assert.match(head.innerHTML, /83 W/, "deferred update rendered after the tap");
});

// A home with a second room and plugs: the kitchen's coffee plug (on), a TV plug (on, excluded by entity), and a
// fridge plug in the cellar (on, excluded by room in some tests), plus an unavailable plug.
const plugsHass = () => {
  const h = makeHass();
  const st = (entity_id, state, friendly_name) => ({ entity_id, state, attributes: { device_class: "outlet", friendly_name } });
  h.areas = { ...h.areas, cellar: { area_id: "cellar", name: "Cellar" } };
  Object.assign(h.entities, {
    "switch.tv_plug": { area_id: "kitchen" },
    "switch.fridge_plug": { area_id: "cellar" },
    "switch.dead_plug": { area_id: "cellar" },
  });
  Object.assign(h.states, {
    "switch.tv_plug": st("switch.tv_plug", "on", "TV plug"),
    "switch.fridge_plug": st("switch.fridge_plug", "on", "Fridge plug"),
    "switch.dead_plug": st("switch.dead_plug", "unavailable", "Dead plug"),
  });
  return h;
};
const clickOn = (node, target) => node.fire("click", { target });
const confirmTarget = (action) => ({ closest: (s) => (s === "[data-action]" ? { dataset: { action } } : null) });

test("the plugs chip asks for confirmation, listing the plugs; Cancel, Escape and a click outside do nothing", () => {
  const { overview, nodes, calls, focused } = overviewSetup({ plugs_off_button: true, exclude: ["switch.tv_plug"] }, plugsHass());
  const open = () => {
    overview._closedAt = null; // the double-click guard is tested on its own
    clickOn(nodes[".head"], chipTarget("plugs"));
  };
  open();
  assert.equal(calls.length, 0, "no call before confirming");
  const box = nodes[".confirm"];
  assert.equal(box.hidden, false);
  assert.match(box.innerHTML, /Éteindre ces 2 prises \?/);
  assert.match(box.innerHTML, /Coffee plug/);
  assert.match(box.innerHTML, /Fridge plug/);
  assert.doesNotMatch(box.innerHTML, /TV plug|Dead plug/);
  assert.equal(focused.at(-1), box.querySelector(".primary"), "OK has the focus");

  clickOn(box, confirmTarget("cancel"));
  assert.equal(box.hidden, true);
  open();
  rc.window.fire("keydown", { key: "Escape", stopPropagation() {} });
  assert.equal(box.hidden, true, "Escape closes it, wherever the focus is");
  open();
  const backdrop = { dataset: { action: "backdrop" } };
  backdrop.closest = () => backdrop;
  const inside = { closest: (s) => (s === "[data-action]" ? backdrop : null) };
  clickOn(box, inside); // a click on the dialog itself, inside the backdrop
  assert.equal(box.hidden, false);
  clickOn(box, backdrop); // the backdrop itself
  assert.equal(box.hidden, true);
  open();
  overview._onOutside({ composedPath: () => [{ localName: "hui-view" }] });
  assert.equal(box.hidden, true);
  assert.equal(calls.length, 0);
});

test("confirming turns off the plugs listed, rooms and entities excluded spared, unavailable ones left out", () => {
  const { nodes, calls } = overviewSetup(
    { plugs_off_button: true, exclude: ["switch.tv_plug"], exclude_areas: ["cellar"] },
    plugsHass(),
  );
  clickOn(nodes[".head"], chipTarget("plugs"));
  assert.doesNotMatch(nodes[".confirm"].innerHTML, /Fridge plug/);
  assert.match(nodes[".confirm"].innerHTML, /Éteindre cette prise \?/);
  clickOn(nodes[".confirm"], confirmTarget("ok"));
  assert.deepEqual(calls, [["homeassistant", "turn_off", { entity_id: ["switch.coffee_plug"] }]]);
  assert.equal(nodes[".confirm"].hidden, true);
});

test("the lights chip turns the lights off at once, without confirmation", () => {
  const { nodes, calls } = overviewSetup({}, plugsHass());
  clickOn(nodes[".head"], chipTarget("lights"));
  assert.deepEqual(calls, [["homeassistant", "turn_off", { entity_id: ["light.ceiling"] }]]);
  assert.equal(nodes[".confirm"].innerHTML, "", "no popup");
});

test("the second click of a double click on OK does not reach the card under the popup", () => {
  const { overview, nodes, calls } = overviewSetup({ plugs_off_button: true }, plugsHass());
  clickOn(nodes[".head"], chipTarget("plugs"));
  clickOn(nodes[".confirm"], confirmTarget("ok"));
  clickOn(nodes[".head"], chipTarget("lights")); // what lies under OK
  nodes[".grid"].fire("click", { target: { closest: () => ({ dataset: { area: "kitchen" } }) } });
  assert.equal(calls.length, 1, "only the plugs call");
  assert.equal(overview._openArea, undefined, "no room unfolded");
  overview._closedAt -= 1000;
  clickOn(nodes[".head"], chipTarget("lights"));
  assert.equal(calls.length, 2, "clicks act again afterwards");
});

test("a new config rebuilds the details of the open room", () => {
  const overview = new cards["room-overview-card"]();
  const panel = fakeNode();
  overview.shadowRoot = { ...fakeNode(), querySelector: (s) => (s === ".panel" ? panel : null) };
  overview._config = { ...cards["room-overview-card"].defaults, plugs_off_button: true };
  overview._hass = makeHass();
  overview._rooms = overview._collect();
  overview._openArea = "kitchen";
  overview._fillPanel();
  overview._render = () => {};
  overview.setConfig({ plugs_off_button: false });
  overview._fillPanel();
  const plugs = panel.children.filter((el) => el._config.type === "custom:room-switch-card");
  assert.equal(plugs.at(-1)._config.all_off_button, false);
});

test("pressing a tile and leaving it with the mouse neither toggles nor opens more-info", async () => {
  const t = pressSetup();
  t.tile.fire("pointerdown");
  t.tile.fire("pointerleave");
  await new Promise((r) => setTimeout(r, rc.RC_HOLD_MS + 50));
  t.tile.fire("pointerup");
  assert.deepEqual(t.calls, []);
  assert.equal(t.card._pressing, false);
});
