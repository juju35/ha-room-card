// ── Editor ───────────────────────────────────────────────────────────────────
// Fields shared by the room cards' editors.
import { rcLang, rcT } from "./helpers.js";
import { rcMemo } from "./in-place-redraw.js";

export const rcAreaFields = (navigation) => [
  { name: "area", selector: { area: {} } },
  { name: "title", selector: { text: {} } },
  ...(navigation ? [{ name: "navigation_path", selector: { navigation: {} } }] : []),
  { name: "columns", selector: { number: { min: 1, max: 4, mode: "box" } } },
];
// Compact tiles (default) or large ones, the size of Home Assistant's Tile card.
export const rcLayoutField = (i18n, lang) => ({
  name: "layout",
  selector: {
    select: {
      mode: "dropdown",
      options: ["compact", "tiles"].map((value) => ({ value, label: rcT(i18n, lang, `ed_layout_${value}`) })),
    },
  },
});
export const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

// The illustrated header: on or off, day / night / automatic, and (rooms) the room type of the picture.
export const RC_SCENE_HELPERS = ["illustration", "illustration_theme", "room_type"];
export const rcIllustrationFields = (i18n, lang, roomType = false) => {
  const select = (name, values, prefix) => ({
    name,
    selector: { select: { mode: "dropdown", options: values.map((value) => ({ value, label: rcT(i18n, lang, `${prefix}${value}`) })) } },
  });
  return [
    { name: "illustration", selector: { boolean: {} } },
    select("illustration_theme", ["auto", "day", "night"], "theme_"),
    ...(roomType ? [select("room_type", ["auto", "none", ...RC_ROOM_TYPES], "room_")] : []),
  ];
};

// "Advanced" section, folded, with the options that are lists or maps (edited as YAML) and the language. Its fields
// sit at the root of the config (`flatten`).
export const RC_ADVANCED_HELPERS = ["language", "entities", "thresholds", "rooms"];
export const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// Entity picker limited to `ids`, left out when there is none.
export const rcEntitiesField = (name, ids) =>
  ids.length ? [{ name, selector: { entity: { multiple: true, include_entities: ids } } }] : [];

// Include list: the entities of the card's domains (narrowed by `card.includeMatch` when set), anywhere in the home,
// that the card does not show yet (entities already included stay in the list).
export const rcIncludeField = (card, hass, config) => {
  if (!hass) return [];
  const shown = new Set(
    rcProbe(card, hass, { ...config, entities: undefined, include: [] })
      ._entries()
      .map((e) => e.entity),
  );
  const ids = Object.keys(hass.states).filter(
    (id) =>
      card.includeDomains.includes(id.split(".")[0]) &&
      (!card.includeMatch || card.includeMatch(hass, id)) &&
      !shown.has(id) &&
      !hass.entities?.[id]?.hidden &&
      !hass.entities?.[id]?.entity_category,
  );
  for (const e of config?.include || []) {
    const id = typeof e === "string" ? e : e.entity;
    if (!ids.includes(id)) ids.push(id);
  }
  return rcEntitiesField("include", ids);
};

// A detached card of class `card`, with `config` over its defaults, to run its discovery from the editor.
export const rcProbe = (card, hass, config) => {
  const probe = document.createElement(card.tag);
  probe._hass = hass;
  probe._config = { ...card.defaults, ...config };
  return probe;
};

// Exclude list limited to what the card finds in the chosen room, with the card's own rules
// (entities already excluded stay in the list).
export const rcExcludeField = (card, hass, config) => {
  const ids =
    hass && config?.area
      ? rcProbe(card, hass, { ...config, entities: undefined, exclude: [] })
          ._entries()
          .map((e) => e.entity)
      : [];
  return rcEntitiesField("exclude", ids);
};

// Per-entity rename: a text field for each entity the card shows, grouped under a `names` map (entity_id → label).
// The field label is the entity's default name, its value the current override; empty keeps the default. Lets the
// `name` that YAML already supports be set graphically, on any of the cards (ha-room-card#81).
export const rcRenameField = (card, hass, config) => {
  if (!hass) return [];
  let entries;
  try {
    entries = rcProbe(card, hass, { ...config, names: undefined })._entries();
  } catch {
    return [];
  }
  const seen = new Set();
  const fields = [];
  for (const e of entries || []) {
    const id = e.entity;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    fields.push({ name: id, label: hass.states[id]?.attributes?.friendly_name || id, selector: { text: {} } });
  }
  return fields.length ? [{ name: "names", type: "expandable", flatten: false, schema: fields }] : [];
};

// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
export const RC_ENTITY_LISTS = ["include"];
export const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
export const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

export const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, illustration: true, illustration_theme: "auto", room_type: "auto", ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => s.label ?? rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) || RC_SCENE_HELPERS.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          if (config.names && typeof config.names === "object") {
            const kept = Object.fromEntries(Object.entries(config.names).filter(([, v]) => v != null && v !== ""));
            if (Object.keys(kept).length) config.names = kept;
            else delete config.names;
          }
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};
