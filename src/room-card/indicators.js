// ── Indicators ───────────────────────────────────────────────────────────────
// What else is going on in the room, as pills after the readings (mini card) and chips under the title (full card), only
// while it is going on (#114). Found from the control sections: heating, cooling, covers open, a media player playing,
// an appliance running (`auto_indicators: false` leaves them out). Then the `indicators` of the config:
//   indicators:
//     - entity: binary_sensor.kitchen_smoke   # shown while active (on, open, playing, heat…), or as the options say
//       icon: mdi:smoke-detector-variant
//       color: red                             # red, orange, yellow, green, blue, purple, grey, or a CSS colour
//       label: Smoke                           # the pill's title (the entity's name by default)
//       state: "on"                            # or a list; state_not; above / below for a number
//       show_state: true                       # the state as the pill's text
import { RM_I18N } from "./i18n/rm-i18n.js";

// States that mean nothing is going on.
export const RM_QUIET = /^(off|closed|idle|standby|unavailable|unknown|none|false|0|not_home|docked|paused|stopped|ready|finished|clear|ok|normal)$/i;
// Named colours of `color`, on the cards' own palette.
const RM_COLORS = {
  red: "var(--rc-alert)",
  orange: "var(--rc-warn)",
  amber: "var(--rc-warn)",
  yellow: "var(--rc-light)",
  green: "var(--rc-ok)",
  blue: "var(--rc-info)",
  purple: "var(--rc-media, #9c6ade)",
  grey: "var(--rc-idle)",
  gray: "var(--rc-idle)",
};
// A CSS colour as given (#hex, rgb(), hsl(), a var() or a name), never anything that could close the declaration.
export const rmColor = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (RM_COLORS[s.toLowerCase()]) return RM_COLORS[s.toLowerCase()];
  return /^[#a-z0-9(),.%\s-]+$/i.test(s) ? s : "";
};

// Whether a configured indicator is on, from its options.
export const rmIndicatorActive = (st, ind) => {
  if (!st) return false;
  const s = String(st.state);
  if (ind.state != null) return [].concat(ind.state).map(String).includes(s);
  if (ind.state_not != null) return ![].concat(ind.state_not).map(String).includes(s);
  const v = Number(s);
  if (ind.above != null || ind.below != null) {
    if (!Number.isFinite(v)) return false;
    return (ind.above == null || v > Number(ind.above)) && (ind.below == null || v < Number(ind.below));
  }
  return !RM_QUIET.test(s);
};

// The indicators of a room card: { id, cls, icon, label, text, style }.
export const rmIndicators = (card, x) => {
  const t = (k, vars) => rcT(RM_I18N, card._lang(), k, vars);
  const c = card._config;
  const h = card._hass;
  const out = [];
  const ctl = x.controls || {};
  if (c.auto_indicators !== false) {
    const count = (list) => (list.length > 1 ? String(list.length) : "");
    const heat = (ctl.climate || []).filter((i) => i.action === "heat");
    const cool = (ctl.climate || []).filter((i) => i.action === "cool");
    const open = (ctl.covers || []).filter((i) => i.on);
    const playing = (ctl.media || []).filter((i) => i.on);
    const running = (ctl.appliances || []).filter((i) => i.on);
    if (heat.length) out.push({ id: heat[0].id, cls: "heat", icon: "mdi:fire", label: t("ind_heating"), text: count(heat) });
    if (cool.length) out.push({ id: cool[0].id, cls: "cool", icon: "mdi:snowflake", label: t("ind_cooling"), text: count(cool) });
    if (open.length) out.push({ id: open[0].id, cls: "cover", icon: "mdi:window-shutter-open", label: t("ind_covers"), text: String(open.length) });
    if (playing.length) out.push({ id: playing[0].id, cls: "media", icon: "mdi:play", label: t("ind_playing"), text: count(playing) });
    for (const a of running)
      out.push({ id: a.id, cls: "run", icon: a.icon, label: a.name, text: a.remaining ? t("ctl_minutes", { n: a.remaining }) : "" });
  }
  for (const raw of c.indicators || []) {
    const ind = typeof raw === "string" ? { entity: raw } : raw;
    const st = ind?.entity && h.states[ind.entity];
    if (!st || !rmIndicatorActive(st, ind)) continue;
    const color = rmColor(ind.color);
    out.push({
      id: ind.entity,
      cls: "custom",
      icon: ind.icon || h.entities?.[ind.entity]?.icon || st.attributes.icon || "mdi:checkbox-blank-circle",
      label: ind.label || st.attributes.friendly_name || ind.entity,
      text: ind.show_state ? (h.formatEntityState?.(st) ?? st.state) : "",
      style: color ? `--ind:${color}` : "",
    });
  }
  return out;
};
