// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then its environment readings and a pill for the lights on, the
// plugs on (their power draw) and someone there. The zoom button switches to the full Room card and back.
import { RoomCard } from "./card.js";
import { RM_HELPERS, rmSchema } from "./editor.js";

export class RoomMiniCard extends rcMini(
  RoomCard,
  "room-mini-card",
  `
    .r small { font-size: 10px; font-weight: 400; opacity: .7; margin-left: 1px; }
    .r.s-warn  { --t: var(--rc-warn); }
    .r.s-alert { --t: var(--rc-alert); }
    .r.cold    { --t: var(--rc-info); }
    .r.light   { --t: var(--rc-light); }
    .r.plug    { --t: var(--rc-plug); }
    .r.info    { --t: var(--rc-info); }
    .r.k-illuminance { --t: var(--rc-idle); }
  `,
) {
  _drawMini(x) {
    if (this._view !== "mini") {
      this.shadowRoot.innerHTML = "";
      this._view = "mini";
    }
    const sum = this._summary(x);
    if (!this._changed(["mini", this._sigOf(x, sum), x.env.map((i) => [i.id, i.state, i.sev, i.cold])])) return;
    const env = this._kids.environment;
    const readings = x.env
      .map((i) => {
        const tint = i.sev === "warn" || i.sev === "alert" || (i.cold && i.sev !== "ok") ? " pill" : "";
        return `<button class="r s-${i.sev}${i.cold ? " cold" : ""}${tint} k-${i.kind}" data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${env._chipValue(i)}</button>`;
      })
      .join("");
    // Each pill opens the details of the entity it stands for: the first light on, the plug drawing the most, the
    // presence sensor.
    const pill = (cls, id, icon, label, text) =>
      `<button class="r pill ${cls}" data-id="${rcEsc(id)}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</button>`;
    const top = [...x.plugsOn].sort((a, b) => (b.watts ?? -1) - (a.watts ?? -1))[0];
    const present = x.sensors.find((i) => i.info && i.on);
    const pills = [
      x.lit.length ? pill("light", x.lit[0].id, "mdi:lightbulb", this._t("chip_lights"), String(x.lit.length)) : "",
      top ? pill("plug", top.id, "mdi:power-socket-fr", this._t("chip_plugs"), x.watts != null ? rcWatts(x.watts, this._lang()) : String(x.plugsOn.length)) : "",
      present ? pill("info", present.id, "mdi:account", this._t("occupied"), "") : "",
    ].join("");
    this._shown = x.env.length;
    this._paintMini({ level: sum.level, icon: sum.icon, status: sum.status, chips: readings + pills });
  }
}

rcRegister(
  RoomMiniCard,
  rcEditor({ card: RoomMiniCard, helpers: [...RM_HELPERS, "zoom"], schema: rmSchema(RoomMiniCard, ["zoom"]) }),
  "Room Mini Card",
  "A whole room on two lines: its status, environment readings, lights and plugs on, and a zoom to the full card",
);
