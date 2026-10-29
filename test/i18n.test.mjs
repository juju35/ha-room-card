import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const rc = load();
const LANGS = ["en", "fr", "de", "es"];
// Gendered states, only in the languages where doors and windows are feminine.
const GENDERED = ["open_f", "closed_f"];

const tables = [
  ["shared", rc.RC_I18N],
  ...[...Object.values(rc.cards), rc.customElements.get("room-environment-overview-card")].map((c) => [c.tag, c.i18n]),
];
const vars = (s) => (Array.isArray(s) ? s.join("|") : s).match(/\{\w+\}/g)?.sort() ?? [];

for (const [name, i18n] of tables) {
  test(`I18N parity: ${name} has en, fr, de and es with the keys of en`, () => {
    assert.deepEqual(Object.keys(i18n), LANGS);
    const ref = Object.keys(i18n.en).sort();
    for (const lang of ["fr", "de", "es"]) {
      const keys = Object.keys(i18n[lang]).filter((k) => !GENDERED.includes(k));
      assert.deepEqual(keys.sort(), ref, `${name}.${lang}`);
      for (const k of ref) {
        const [en, tr] = [i18n.en[k], i18n[lang][k]];
        assert.equal(typeof tr, typeof en, `${name}.${lang}.${k}`);
        if (Array.isArray(en)) assert.equal(tr.length, en.length, `${name}.${lang}.${k}`);
        assert.deepEqual(vars(tr), vars(en), `${name}.${lang}.${k} placeholders`);
      }
    }
  });
}

test("German and Spanish are picked from the config or Home Assistant", () => {
  const card = new rc.cards["room-switch-card"]();
  card._config = { language: "de" };
  assert.equal(card._t("on_one", { n: 2 }), "2 an");
  card._config = {};
  card._hass = { locale: { language: "es-ES" } };
  assert.equal(card._t("turn_all_off"), "Apagar todo");
});

test("Spanish doors and windows take the feminine state", () => {
  const card = new rc.cards["room-sensors-card"]();
  card._config = { language: "es" };
  assert.equal(card._stateText("window", true), "Abierta");
  assert.equal(card._stateText("garage", false), "Cerrado");
  card._config = { language: "de" };
  assert.equal(card._stateText("door", true), "Offen");
});

test("Editor help texts name every documented key: rooms[].thresholds, entities[].power", () => {
  const reo = rc.customElements.get("room-environment-overview-card");
  const plugs = rc.cards["room-switch-card"];
  for (const lang of LANGS) {
    const t = (card, key) => card.i18n[lang]?.[key] ?? rc.RC_I18N[lang][key];
    assert.match(t(reo, "ed_rooms_helper"), /thresholds/, `environment overview rooms helper (${lang})`);
    assert.match(t(plugs, "ed_entities_helper"), /\bpower\b/, `plugs entities helper (${lang})`);
    // The other cards keep the shared help texts: no power on lights or sensors, no thresholds on the Overview.
    assert.doesNotMatch(t(rc.cards["room-lights-card"], "ed_entities_helper"), /power/, `lights (${lang})`);
    assert.doesNotMatch(t(rc.customElements.get("room-overview-card"), "ed_rooms_helper"), /thresholds/, `overview (${lang})`);
  }
});
