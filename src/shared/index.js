// Entry point: the card's modules in their original order. scripts/bundle.mjs concatenates them in this order into the
// single classic script the card ships as.
import "./core.js";
import "./discovery-rules.js";
import "./overviews.js";
import "./i18n/rc-i18n.js";
import "./i18n-helpers.js";
import "./helpers.js";
import "./in-place-redraw.js";
import "./base-card.js";
import "./mini-cards.js";
import "./overviews-2.js";
import "./editor.js";
import "./card-picker.js";
import "./common-styles.js";
