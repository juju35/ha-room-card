import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { load } from "./load.mjs";

const rc = load();
const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl"];
// Gendered states, only in the languages where doors and windows are feminine.
const GENDERED = ["open_f", "closed_f"];

const tables = [
  ["shared", rc.RC_I18N],
  ...[...Object.values(rc.cards), rc.customElements.get("room-environment-overview-card")].map((c) => [c.tag, c.i18n]),
];
const vars = (s) => (Array.isArray(s) ? s.join("|") : s).match(/\{\w+\}/g)?.sort() ?? [];

for (const [name, i18n] of tables) {
  test(`I18N parity: ${name} has every language with the keys of en`, () => {
    assert.deepEqual(Object.keys(i18n), LANGS);
    const ref = Object.keys(i18n.en).sort();
    for (const lang of LANGS.slice(1)) {
      const keys = Object.keys(i18n[lang]).filter((k) => !GENDERED.includes(k));
      assert.deepEqual(keys.sort(), ref, `${name}.${lang}`);
      for (const k of ref) {
        const [en, tr] = [i18n.en[k], i18n[lang][k]];
        assert.equal(typeof tr, typeof en, `${name}.${lang}.${k}`);
        if (Array.isArray(en)) assert.equal(tr.length, en.length, `${name}.${lang}.${k}`);
        assert.deepEqual(vars(tr), vars(en), `${name}.${lang}.${k} placeholders`);
        // Blank only where English is blank (the unused bands of b_air, b_noise, i_co2…).
        const blanks = (s) => (Array.isArray(s) ? s : [s]).map((x) => x.trim() === "");
        assert.deepEqual(blanks(tr), blanks(en), `${name}.${lang}.${k} empty`);
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

test("Language: the full tag when the card has it, else its base language, else English", () => {
  const lang = (language) => rc.rcLang(rc.RC_I18N, { locale: { language } }, {});
  assert.equal(lang("fr-FR"), "fr");
  assert.equal(lang("de-CH"), "de");
  assert.equal(lang("sr-Latn"), "sr-Latn");
  assert.equal(lang("sr"), "sr");
  assert.equal(lang("it-IT"), "it");
  assert.equal(lang("nl-BE"), "nl");
  assert.equal(lang("pt"), "pt");
  // Brazilian Portuguese falls back to European Portuguese, on purpose.
  assert.equal(lang("pt-BR"), "pt");
  assert.equal(lang("pl-PL"), "pl");
  assert.equal(lang("ja"), "en");
  // The card's language wins over Home Assistant's, then hass.locale over hass.language.
  assert.equal(rc.rcLang(rc.RC_I18N, { locale: { language: "fr" } }, { language: "sr-Latn" }), "sr-Latn");
  assert.equal(rc.rcLang(rc.RC_I18N, { locale: { language: "de" }, language: "fr" }, {}), "de");
  assert.equal(rc.rcLang(rc.RC_I18N, { language: "es-ES" }, {}), "es");
});

test("Serbian is picked in Cyrillic or Latin script", () => {
  const card = new rc.cards["room-switch-card"]();
  card._config = {};
  card._hass = { locale: { language: "sr-Latn" } };
  assert.equal(card._t("turn_all_off"), "Isključi sve");
  card._hass = { locale: { language: "sr" } };
  assert.equal(card._t("turn_all_off"), "Искључи све");
});

test("Italian, Dutch, Portuguese and Polish are picked from Home Assistant", () => {
  const card = new rc.cards["room-switch-card"]();
  card._config = {};
  const t = (language) => {
    card._hass = { locale: { language } };
    return card._t("turn_all_off");
  };
  assert.equal(t("it-IT"), "Spegni tutto");
  assert.equal(t("nl-BE"), "Alles uitschakelen");
  assert.equal(t("pt-PT"), "Desligar tudo");
  assert.equal(t("pl-PL"), "Wyłącz wszystko");
});

test("The editor offers every language, each in its own name", () => {
  const editor = new (rc.customElements.get("room-switch-card-editor"))();
  editor.appendChild = () => {};
  editor.setConfig({ area: "kitchen" });
  editor.hass = makeHass();
  const find = (items) => items.flatMap((x) => (x.name === "language" ? [x] : x.schema ? find(x.schema) : []));
  // Copied out of the sandbox's realm, for deepEqual.
  const options = [...find([...editor._form.schema])[0].selector.select.options];
  assert.deepEqual(
    options.map((o) => o.value),
    ["", ...LANGS],
  );
  assert.deepEqual(
    options.slice(-4).map((o) => o.label),
    ["Italiano", "Nederlands", "Português (Portugal)", "Polski"],
  );
});

test("Spanish, Italian and Portuguese doors and windows take the feminine state", () => {
  const card = new rc.cards["room-sensors-card"]();
  card._config = { language: "es" };
  assert.equal(card._stateText("window", true), "Abierta");
  assert.equal(card._stateText("garage", false), "Cerrado");
  card._config = { language: "de" };
  assert.equal(card._stateText("door", true), "Offen");
  // Italian and Portuguese too (porta, finestra, janela); Dutch and Polish need no gender.
  card._config = { language: "it" };
  assert.equal(card._stateText("window", true), "Aperta");
  assert.equal(card._stateText("garage", false), "Chiuso");
  card._config = { language: "pt" };
  assert.equal(card._stateText("door", false), "Fechada");
  card._config = { language: "pl" };
  assert.equal(card._stateText("door", true), "Otwarte");
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
