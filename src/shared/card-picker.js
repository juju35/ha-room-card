// ── Card picker: light previews ──────────────────────────────────────────────
// Home Assistant's card picker builds a live preview of every card that registers with `preview: true`, all at once
// and with no lazy loading. A preview here is drawn only once it scrolls into view: the picker calls getStubConfig()
// right before it creates the preview, which marks the next instance of that card; once connected under
// <hui-card-picker>, that instance holds Home Assistant's state (no render, no history, no animation) until it is
// visible. Anywhere else (a dashboard, the editor's preview) the card behaves as before.
import { RC_VERSION } from "./core.js";

export const pickerLazy = (Card) => {
  if (typeof IntersectionObserver !== "function") return Card;
  let marks = [];
  const STALE_MS = 5000;
  return class extends Card {
    static getStubConfig(...args) {
      marks.push(Date.now());
      return Card.getStubConfig ? Card.getStubConfig(...args) : {};
    }

    constructor() {
      super();
      const now = Date.now();
      marks = marks.filter((t) => now - t < STALE_MS);
      if (marks.length) {
        marks.shift();
        this._plHold = true;
      }
    }

    set hass(hass) {
      if (this._plHold) this._plHass = hass;
      else super.hass = hass;
    }

    get hass() {
      return this._plHold ? this._plHass : super.hass;
    }

    connectedCallback() {
      if (!this._plHold) return super.connectedCallback?.();
      if (this.getRootNode()?.host?.localName !== "hui-card-picker") return this._plRelease();
      if (this._plIo) return;
      // A custom element is inline until its styles arrive: a block of a card's height keeps the cells apart, so
      // that only the previews actually on screen intersect.
      this.style.display = "block";
      this.style.minHeight = "120px";
      this._plIo = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this._plRelease();
        },
        { rootMargin: "200px" },
      );
      this._plIo.observe(this);
    }

    disconnectedCallback() {
      if (this._plHold) return;
      super.disconnectedCallback?.();
    }

    _plRelease() {
      this._plIo?.disconnect();
      this._plIo = null;
      this._plHold = false;
      this.style.display = "";
      this.style.minHeight = "";
      if (this._plHass !== undefined) super.hass = this._plHass;
      this._plHass = undefined;
      if (this.isConnected) super.connectedCallback?.();
    }
  };
};

export const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, pickerLazy(card));
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-room-card",
  });
};

if (!customElements.get("room-overview-card")) {
  console.info(`%c HA-ROOM-CARD %c v${RC_VERSION} `, "background:#43a047;color:#fff;font-weight:700", "");
}
