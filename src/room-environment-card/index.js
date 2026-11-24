// Entry point: the card's modules in their original order. scripts/bundle.mjs concatenates them in this order into the
// single classic script the card ships as.
import "./core.js";
import "./i18n/re-i18n.js";
import "./i18n-helpers.js";
import "./sensor-kinds.js";
import "./appliance-sensors.js";
import "./card.js";
import "./editor.js";
import "./mini-card.js";
import "./overview-card.js";
