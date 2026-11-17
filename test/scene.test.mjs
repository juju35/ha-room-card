// The illustrated header (src/scene.js): room type, night, and pictures that follow the cards' state.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { load } from "./load.mjs";

const rc = load();
const { cards } = rc;

test("Room type: guessed from the area's name, then its icon; room_type wins, none when unknown", () => {
  assert.equal(rc.rcGuessRoomType({ name: "Chambre enfant" }), "kids");
  assert.equal(rc.rcGuessRoomType({ name: "Salle de bain" }), "bathroom");
  assert.equal(rc.rcGuessRoomType({ name: "Hall d'entrée" }), "entry");
  assert.equal(rc.rcGuessRoomType({ name: "Kitchen" }), "kitchen");
  assert.equal(rc.rcGuessRoomType({ name: "Zone 3", icon: "mdi:sofa-outline" }), "living");
  assert.equal(rc.rcGuessRoomType({ name: "Zone 3" }), "none");
  assert.equal(rc.rcRoomType({ room_type: "garage" }, { name: "Kitchen" }), "garage");
  assert.equal(rc.rcRoomType({ room_type: "none" }, { name: "Kitchen" }), "none");
  assert.equal(rc.rcRoomType({ room_type: "auto" }, { name: "Kitchen" }), "kitchen");
});

test("Night: illustration_theme, else the sun, else the dark mode", () => {
  const sun = (state) => ({ states: { "sun.sun": { state } }, themes: { darkMode: true } });
  assert.equal(rc.rcIsNight(sun("above_horizon"), {}), false);
  assert.equal(rc.rcIsNight(sun("below_horizon"), {}), true);
  assert.equal(rc.rcIsNight(sun("below_horizon"), { illustration_theme: "day" }), false);
  assert.equal(rc.rcIsNight({ states: {}, themes: { darkMode: true } }, {}), true);
  assert.equal(rc.rcIsNight({ states: {} }, { illustration_theme: "night" }), true);
});

test("Floor strip: tiles in wet rooms, concrete in the garage, parquet otherwise; lawn under the house; lights with no room", () => {
  assert.equal(rc.rcScene("sensors", "kitchen", {}, false).floor, "tiles");
  assert.equal(rc.rcScene("plugs", "garage", {}, false).floor, "concrete");
  assert.equal(rc.rcScene("environment", "bedroom", { tone: "ok" }, false).floor, "parquet");
  assert.equal(rc.rcScene("overview", "kitchen", {}, false).floor, "lawn");
  const lights = rc.rcScene("lights", "kitchen", { lamps: [{ on: true }] }, false);
  assert.equal(lights.floor, "parquet");
  assert.doesNotMatch(lights.svg, /opacity="0.09"/, "no furniture silhouette on the Lights card");
  assert.notEqual(rc.rcScene("sensors", "kitchen", {}, true).wall, rc.rcScene("sensors", "kitchen", {}, false).wall);
});

test("The cards draw the banner by default, the classic header with illustration: false", () => {
  const card = new cards["room-sensors-card"]();
  card.attachShadow();
  card.setConfig({ area: "kitchen" });
  card.hass = makeHass();
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner/);
  assert.match(html, /class="rc-scene"/);
  assert.match(html, /class="ground g-tiles"/, "kitchen: tiles");
  card.setConfig({ area: "kitchen", illustration: false });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="banner/);
});

test("Sensors: an open door opens the door of the picture, a leak draws the puddle", () => {
  const card = new cards["room-sensors-card"]();
  card.attachShadow();
  card.setConfig({ area: "kitchen", illustration_theme: "day" });
  const hass = makeHass();
  hass.states["binary_sensor.door"].state = "on";
  card.hass = hass;
  assert.equal(card._sceneState().door, true);
  assert.equal(card._sceneState().leak, false);
  assert.match(card.shadowRoot.innerHTML, /scale\(0.42 1\)/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="sc-puddle"/);
});

test("Plugs: the plugs on carry current; 3 kW together is an overload (amber level, panel in alert)", () => {
  const card = new cards["room-switch-card"]();
  card.attachShadow();
  card.setConfig({ area: "kitchen" });
  const hass = makeHass();
  card.hass = hass;
  assert.equal(JSON.stringify(card._sceneState()), JSON.stringify({ on: [true], total: 1, high: false }));
  hass.states["sensor.coffee_power"].state = "3200";
  card._sig = null;
  card.hass = { ...hass };
  assert.equal(card._sceneState().high, true);
  assert.match(card.shadowRoot.innerHTML, /lvl-high/);
});

test("Plugs: overload_power sets the overload threshold, 0 never warns", () => {
  const hass = makeHass();
  hass.states["sensor.coffee_power"].state = "1500";
  const card = new cards["room-switch-card"]();
  card.attachShadow();
  card.setConfig({ area: "kitchen", overload_power: 1200 });
  card.hass = hass;
  assert.equal(card._sceneState().high, true);
  card.setConfig({ area: "kitchen", overload_power: 2000 });
  card._sig = null;
  card.hass = { ...hass };
  assert.equal(card._sceneState().high, false);
  hass.states["sensor.coffee_power"].state = "9000";
  card.setConfig({ area: "kitchen", overload_power: 0 });
  card._sig = null;
  card.hass = { ...hass };
  assert.equal(card._sceneState().high, false);
  card.setConfig({ area: "kitchen", overload_power: "abc" });
  card._sig = null;
  card.hass = { ...hass };
  assert.equal(card._sceneState().high, true);
});

test("Lights: the lamps are lit in the lights' colours", () => {
  const card = new cards["room-lights-card"]();
  card.attachShadow();
  card.setConfig({ area: "kitchen" });
  const hass = makeHass();
  hass.states["light.ceiling"].attributes.rgb_color = [255, 0, 0];
  card.hass = hass;
  assert.equal(JSON.stringify(card._sceneState()), JSON.stringify({ lamps: [{ on: true, color: "rgb(255,0,0)" }] }));
  assert.match(card.shadowRoot.innerHTML, /fill="rgb\(255,0,0\)"/);
});
