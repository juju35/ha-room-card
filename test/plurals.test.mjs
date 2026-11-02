import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const rc = load();
const { cards } = rc;
const COUNTS = [1, 2, 5, 21, 22];

// A kitchen with `n` entities of `domain` that are on (lights, plugs) or open (doors).
const homeWith = (domain, n) => {
  const h = makeHass();
  h.entities = {};
  h.states = {};
  for (let i = 0; i < n; i++) {
    const id = domain === "door" ? `binary_sensor.door_${i}` : `${domain}.e${i}`;
    h.entities[id] = { area_id: "kitchen" };
    const attributes = { friendly_name: `E${i}` };
    if (domain === "switch") attributes.device_class = "outlet";
    if (domain === "door") attributes.device_class = "door";
    h.states[id] = { entity_id: id, state: "on", attributes, last_changed: "2026-01-01T00:00:00Z" };
  }
  return h;
};

// The header status of `tag` in `language` with `n` entities on / open.
const status = (tag, domain, language, n) => {
  const card = new cards[tag]();
  card.setConfig({ area: "kitchen", language });
  card.hass = homeWith(domain, n);
  const pill = card.shadowRoot.innerHTML.match(/<button class="pill[^>]*>([\s\S]*?)<\/button>/);
  return pill[1].replace(/<[^>]+>/g, "").trim();
};

const expectAll = (fn, expected, label) => {
  for (const [i, n] of COUNTS.entries()) assert.equal(fn(n), expected[i], `${label} n=${n}`);
};

test("Lights in Serbian: neuter (светло), with the 2-4 form and no slash", () => {
  expectAll((n) => status("room-lights-card", "light", "sr", n), ["1 укључено", "2 укључена", "5 укључених", "21 укључено", "22 укључена"], "sr");
  expectAll(
    (n) => status("room-lights-card", "light", "sr-Latn", n),
    ["1 uključeno", "2 uključena", "5 uključenih", "21 uključeno", "22 uključena"],
    "sr-Latn",
  );
});

test("A single light's state in Serbian is neuter, like светло", () => {
  const card = new cards["room-lights-card"]();
  for (const [language, on, off] of [
    ["sr", "Укључено", "Искључено"],
    ["sr-Latn", "Uključeno", "Isključeno"],
  ]) {
    card._config = { language };
    assert.equal(card._t("on"), on);
    assert.equal(card._t("off"), off);
  }
});

test("Plugs in Serbian: feminine (утичница), with the 2-4 form and no slash", () => {
  expectAll((n) => status("room-switch-card", "switch", "sr", n), ["1 укључена", "2 укључене", "5 укључених", "21 укључена", "22 укључене"], "sr");
  expectAll(
    (n) => status("room-switch-card", "switch", "sr-Latn", n),
    ["1 uključena", "2 uključene", "5 uključenih", "21 uključena", "22 uključene"],
    "sr-Latn",
  );
});

test("Openings in Serbian: 1 / 2-4 / 5+ forms", () => {
  expectAll((n) => status("room-sensors-card", "door", "sr", n), ["1 отворено", "2 отворена", "5 отворених", "21 отворено", "22 отворена"], "sr");
});

test("1 is singular and the other counts plural in every language", () => {
  const one = { en: "1 on", fr: "1 allumée", de: "1 an", es: "1 encendida", it: "1 accesa", nl: "1 aan", pt: "1 acesa", pl: "Włączone: 1" };
  const two = { en: "2 on", fr: "2 allumées", de: "2 an", es: "2 encendidas", it: "2 accese", nl: "2 aan", pt: "2 acesas", pl: "Włączone: 2" };
  const many = { en: "21 on", fr: "21 allumées", de: "21 an", es: "21 encendidas", it: "21 accese", nl: "21 aan", pt: "21 acesas", pl: "Włączone: 21" };
  for (const language of Object.keys(one)) {
    assert.equal(status("room-lights-card", "light", language, 1), one[language], language);
    assert.equal(status("room-lights-card", "light", language, 2), two[language], language);
    assert.equal(status("room-lights-card", "light", language, 21), many[language], language);
  }
});

test("The plugs confirmation agrees with the count in Serbian (ове 2 утичнице, ових 5 утичница)", () => {
  const overview = new cards["room-overview-card"]();
  overview.attachShadow();
  const box = fakeNode();
  overview.shadowRoot.querySelector = (s) => (s === ".confirm" ? box : null);
  overview._config = { language: "sr-Latn" };
  const plugs = (n) =>
    Array.from({ length: n }, (_, i) => ({ id: `switch.p${i}`, st: { attributes: { friendly_name: `P${i}` } }, watts: null, room: "" }));
  const hint = (n) => {
    overview._openConfirm(plugs(n));
    const text = box.innerHTML.match(/<div class="hint">([^<]*)<\/div>/)[1];
    overview._closeConfirm();
    return text;
  };
  expectAll(
    hint,
    [
      "Isključiti ovu utičnicu?",
      "Isključiti ove 2 utičnice?",
      "Isključiti ovih 5 utičnica?",
      "Isključiti ovih 21 utičnica?",
      "Isključiti ove 22 utičnice?",
    ],
    "sr-Latn",
  );
});

test("A language without a 2-4 form uses its plural form for 2-4", () => {
  // pl has a CLDR "few" category but no _few key here (it uses "Label: {n}"); en has no "few" at all.
  assert.equal(status("room-switch-card", "switch", "pl", 3), "Włączone: 3");
  assert.equal(status("room-switch-card", "switch", "en", 3), "3 on");
});
