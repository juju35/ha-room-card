// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.
import { rcEsc, rcT } from "./helpers.js";
import { rcInDialog, rcMemo } from "./in-place-redraw.js";

// Visible entities accepted by `match(id)`, with their area, minus the config's `exclude`: the registries are
// scanned again only when they or the config change.
export const rcByArea = (card, match) => {
  const h = card._hass;
  const c = card._config;
  return rcMemo((card._memo ||= {}), "byArea", [c, h.entities, h.devices], () => {
    const excluded = new Set(c.exclude || []);
    const out = [];
    for (const [id, r] of Object.entries(h.entities || {})) {
      if (r.hidden || excluded.has(id) || !match(id)) continue;
      const aid = card._areaOf(id);
      if (aid) out.push([id, aid]);
    }
    return out;
  });
};

// The overviews' `rooms[].include`: entities added by hand to a room, from another room, without one or not
// recognised (a template without an area or a device class, say). A map of entity ID to { aid, entry }, `entry` the
// `{entity, name, icon}` item; an entity listed in several rooms counts in the first. Only existing states count.
export const rcRoomIncludes = (hass, config) => {
  const out = new Map();
  for (const r of config.rooms || []) {
    for (const e of r?.include || []) {
      const entry = typeof e === "string" ? { entity: e } : e;
      if (entry?.entity && hass.states[entry.entity] && !out.has(entry.entity)) out.set(entry.entity, { aid: r.area, entry });
    }
  }
  return out;
};
// The entities included in a room other than `aid`: left out of `aid`'s details card, as of its tiles.
export const rcIncludedElsewhere = (included, aid) => [...included].filter(([, x]) => x.aid !== aid).map(([id]) => id);
// The `include` items of one room, for its details card.
export const rcIncludesOf = (included, aid, keep = () => true) =>
  [...included.values()].filter((x) => x.aid === aid && keep(x.entry.entity)).map((x) => x.entry);

// Rooms in the order of the config's `rooms` list, then, with `sort: state`, the highest `rank(room)` first,
// then by name.
export const rcSortRooms = (list, config, rank) => {
  const order = (config.rooms || []).map((x) => x.area);
  return list.sort((a, b) => {
    if (order.length) {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia !== ib) return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
    }
    return (config.sort === "state" ? rank(b) - rank(a) : 0) || a.name.localeCompare(b.name);
  });
};

// The overviews only show the rooms needing a look until their detail button (`zoom`, on by default) is pressed;
// `zoom: false` shows every room, with no button.
export const rcCompact = (card) => card._config.zoom !== false && !card._zoomed;

// The zoom / detail button: the same icons on the overviews and the mini cards.
export const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// The detail button of an overview header, at its end.
export const rcZoomButton = (card) =>
  card._config.zoom === false
    ? ""
    : `<button class="zoom" title="${rcEsc(card._t(card._zoomed ? "rooms_check" : "rooms_all"))}"><ha-icon icon="${rcZoomIcon(card)}"></ha-icon></button>`;

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
export const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
export const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
export const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// Editor fields shared by the overviews: title, columns and sort.
export const rcOverviewFields = (i18n, lang) => [
  { name: "title", selector: { text: {} } },
  { name: "columns", selector: { number: { min: 1, max: 6, mode: "box" } } },
  {
    name: "sort",
    selector: {
      select: {
        mode: "dropdown",
        options: ["name", "state"].map((value) => ({ value, label: rcT(i18n, lang, `ed_sort_${value}`) })),
      },
    },
  },
];
