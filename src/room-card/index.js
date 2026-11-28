// Entry point: the card's modules in their original order. scripts/bundle.mjs concatenates them in this order into the
// single classic script the card ships as.
import "./core.js";
import "./i18n/rm-i18n.js";
import "./i18n-helpers.js";
import "./sections.js";
import "./controls.js";
import "./indicators.js";
import "./card.js";
import "./editor.js";
import "./mini-card.js";
