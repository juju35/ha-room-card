// ── Helpers ──────────────────────────────────────────────────────────────────
import { RC_I18N } from "./i18n/rc-i18n.js";

export const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

export const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

// Plural key for `n` items: `<base>_one`, `<base>_few` or `<base>_many` (the "other" form), from the CLDR category of
// `n` in `lang` (Serbian 1 / 2-4 / 5+, 21 / 22…). `_few` is optional: without it, `_many` is used. A `_one` text without
// {n} ("Turn this plug off?") only means exactly one.
export const rcPluralKey = (i18n, lang, base, n) => {
  let cat;
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {
    cat = n === 1 ? "one" : "other";
  }
  const text = (k) => i18n[lang]?.[k] ?? RC_I18N[lang]?.[k];
  if (cat === "one" && (n === 1 || text(`${base}_one`)?.includes("{n}"))) return `${base}_one`;
  if (cat === "few" && text(`${base}_few`) != null) return `${base}_few`;
  return `${base}_many`;
};

export const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// The whole width of an element's text in its own font, an ellipsised one included.
export const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

export const rcEscRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A power in the card's language (*1,2 kW* in French), from `lang` (defaults to the browser's).
export const rcWatts = (w, lang) => {
  const kw = w >= 1000;
  const digits = kw && w < 10000 ? 1 : 0;
  let text;
  try {
    text = new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(kw ? w / 1000 : w);
  } catch {
    text = (kw ? w / 1000 : w).toFixed(digits);
  }
  return `${text} ${kw ? "kW" : "W"}`;
};

// Strips a prefix, a suffix and the area name from an entity name, then capitalises it.
export const rcCleanName = (name, areaName, prefix, suffix) => {
  let n = (name || "").replace(prefix, "").replace(suffix, "").trim();
  if (areaName && n.toLowerCase() !== areaName.toLowerCase()) {
    n = n.replace(new RegExp(`(^${rcEscRe(areaName)}\\s+|\\s+${rcEscRe(areaName)}$)`, "i"), "");
  }
  return n.charAt(0).toUpperCase() + n.slice(1);
};

export const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

export const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself. `opts`: the listeners'
// options (the card's abort signal, so that the next redraw can wire the same node again).
export const rcBindNav = (head, path, opts) => {
  head.addEventListener("click", () => rcNavigate(path), opts);
  head.addEventListener(
    "keydown",
    (ev) => {
      if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
    },
    opts,
  );
};

// A section of the Room card folds and unfolds from its header (a tap, Enter or Space), not from its buttons (the
// "turn everything off" pill): the `collapsed` attribute hides everything under the header (RC_BASE_STYLES), and
// `rc-fold` tells the Room card, which keeps the state.
export const rcFold = (card, head) => {
  const collapsed = !card.hasAttribute("collapsed");
  card.toggleAttribute("collapsed", collapsed);
  head?.setAttribute?.("aria-expanded", String(!collapsed));
  card.dispatchEvent(new CustomEvent("rc-fold", { detail: { collapsed } }));
};
export const rcBindFold = (card, head, opts) => {
  if (!head) return;
  head.addEventListener(
    "click",
    (ev) => {
      if (!ev.target.closest?.("button")) rcFold(card, head);
    },
    opts,
  );
  head.addEventListener(
    "keydown",
    (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target === head) {
        ev.preventDefault();
        rcFold(card, head);
      }
    },
    opts,
  );
};
