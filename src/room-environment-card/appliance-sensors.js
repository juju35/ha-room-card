// ── Appliance sensors ──────────────────────────────────────────────────────────
// Only a room's ambient readings should count: an appliance (oven, fridge, dishwasher, water heater, heat pump,
// aquarium, pool…) lives in the area through its device, and its own temperature/humidity sensors would otherwise
// be taken for the air of the room (issue #89). Two heuristics tell them apart, with the explicit `entities` config
// and `appliance_filter: false` as escape hatches.
import { RE_KINDS } from "./sensor-kinds.js";

// Entity id / friendly name folded for matching: lower case, separators (._-) turned into spaces so the word list
// below can use word boundaries on both `sensor.four_oven_cavity_temperature` and "Four cavity temperature".
export const reNorm = (s) => (s || "").toString().toLowerCase().replace(/[._-]+/g, " ");

// Inner-part / appliance words, matched on the entity id and on the friendly name. Multilingual and deliberately
// conservative: bare "water" / "eau" are left out (an ambient "rainwater temperature" must survive), and wine
// coolers match the "cave à vin" phrase rather than a bare "cave" (a cellar room keeps its ambient sensor).
// "sonde" / "probe" alone are left out on purpose (a window or outdoor probe is ambient); the oven meat probe is
// caught by its "sonde à viande" phrase and, failing that, by the companion oven device.
export const RE_APPLIANCE_WORDS =
  /\b(oven|four|cavity|cavite|meat probe|food probe|sonde a viande|sonde à viande|fridge|refrigerator|refrigerateur|réfrigérateur|frigo|freezer|congelateur|congélateur|dishwasher|lave vaisselle|washer|washing|lave linge|dryer|seche linge|sèche linge|boiler|water heater|chauffe eau|ballon|cumulus|tank|aquarium|pool|piscine|spa|wine|cave a vin|cave à vin|cellar|kettle|bouilloire|flow|return|depart|départ|retour)\b/;

// A sibling entity of one of these domains marks the device as an appliance, not a room: a thermostat/heat-pump
// `climate`, a `water_heater`, a `humidifier`, or a `number` setpoint.
export const RE_APPLIANCE_DOMAINS = new Set(["climate", "water_heater", "humidifier", "number"]);
// A `number` that tunes the sensor itself rather than setting a target: a calibration offset, a comfort range, an alarm
// threshold, a reporting interval, or a remote reading pushed to its screen (SNZB-02DR2 `source_1_temperature`,
// older firmware `external_temperature`)… A temperature/humidity sensor (SONOFF SNZB-02D/02DR2, Aqara, Tuya…) exposes
// these without an entity category under Zigbee2MQTT or ZHA, and they must not turn it into an appliance (issue #98).
export const RE_SENSOR_SETTING =
  /\b(source|external|externe|exterieure|extérieure|remote|distant|distante|display|affichage|calibration|calibrage|etalonnage|étalonnage|offset|decalage|décalage|correction|comfort|confort|min|max|minimum|maximum|lower|upper|low|high|threshold|seuil|alarm|alarme|alert|alerte|limit|limite|report|reporting|interval|intervalle|sensitivity|sensibilite|sensibilité|hysteresis|hystérésis|precision|précision|delta|change|led|brightness|luminosite|luminosité)\b/;
export const reSensorSetting = (hass, id) => RE_SENSOR_SETTING.test(reNorm(id)) || RE_SENSOR_SETTING.test(reNorm(hass.states?.[id]?.attributes?.friendly_name));

// A `select` / `sensor` for an operation state or a program (Home Connect, Miele, LG ThinQ, SmartThings…).
export const RE_APPLIANCE_STATE = /\b(program|programme|operation|op state)\b/;

export const reDomain = (id) => id.slice(0, id.indexOf("."));

// Is `id` an appliance's own sensor (so, not a room reading)? `devEnts`: device_id → sibling entity ids.
export const reIsAppliance = (hass, id, devEnts) => {
  const name = hass.states?.[id]?.attributes?.friendly_name;
  if (RE_APPLIANCE_WORDS.test(reNorm(id)) || RE_APPLIANCE_WORDS.test(reNorm(name))) return true;
  const dev = hass.entities?.[id]?.device_id;
  if (!dev || !devEnts) return false;
  for (const sib of devEnts[dev] || []) {
    if (sib === id) continue;
    const dom = reDomain(sib);
    const cat = hass.entities?.[sib]?.entity_category;
    // A climate / water_heater / humidifier is a decisive appliance signal; a setpoint `number` only when it is not a
    // config/diagnostic entity nor a setting of the sensor itself (a multisensor's LED brightness, a calibration
    // offset or comfort range must not disqualify its temperature).
    if (RE_APPLIANCE_DOMAINS.has(dom) && (dom !== "number" || (!cat && !reSensorSetting(hass, sib)))) return true;
    if ((dom === "select" || dom === "sensor") && !cat && RE_APPLIANCE_STATE.test(reNorm(sib))) return true;
  }
  return false;
};

// Wet rooms (bathroom, shower room, laundry) live with more humidity: 70 % is a warning there, 80 % an alert.
export const RE_WET_ROOM = /salle (de )?bains?|salle d.eau|douche|bath|shower|buanderie|laundry/i;
export const RE_WET_HUMIDITY = [25, 35, 70, 80];

// Outdoor areas (terrace, garden, balcony…): their temperature, humidity and noise are the weather and the street, not
// a comfort issue, so they are information only, unless the user set thresholds for them.
export const RE_OUTDOOR_ROOM = /terrasse|jardin|balcon|patio|ext[ée]rieur|cour\b|garden|terrace|balcony|outdoor|outside|yard/i;
export const RE_OUTDOOR_KINDS = ["temperature", "humidity", "noise"];
export const reOutdoorInfo = (kind, room) =>
  RE_OUTDOOR_KINDS.includes(kind) && !room.thresholds?.[kind] && RE_OUTDOOR_ROOM.test(room.name || "");

// Thresholds of `kind` for a room: the room's own, then the card's, then the wet-room humidity, then the defaults.
export const reCustom = (kind, room) =>
  room.thresholds?.[kind] ?? (kind === "humidity" && RE_WET_ROOM.test(room.name || "") ? RE_WET_HUMIDITY : undefined);

// Thresholds and gauge of `kind` in the sensor's unit: °F and parts per billion are converted, custom thresholds
// (`thresholds: { co2: [800, 1200] }`, two values for a one-sided kind, four otherwise) are used as they are.
export const reScale = (kind, unit, custom) => {
  const k = RE_KINDS[kind];
  if (Array.isArray(custom) && custom.length) {
    const scale = custom.length === 2 ? [null, null, ...custom] : custom;
    if (scale.length === 4 && scale.every((v) => v === null || Number.isFinite(Number(v)))) {
      return { scale: scale.map((v) => (v === null ? null : Number(v))), gauge: k.gauge };
    }
  }
  if (kind === "temperature" && /F$/.test(unit || "")) {
    const f = (c) => (c === null ? null : (c * 9) / 5 + 32);
    return { scale: k.scale.map(f), gauge: k.gauge.map(f) };
  }
  const parts = k.units?.[unit];
  if (parts) return { scale: [null, null, parts[0], parts[1]], gauge: [0, parts[2] * 1.5] };
  return { scale: k.scale, gauge: k.gauge };
};

// `value` of `kind` from unit `from` to unit `to`: only temperatures convert (°C ⇄ °F), other kinds are grouped
// by unit before any mean.
export const reConvert = (kind, value, from, to) => {
  if (kind !== "temperature") return value;
  const f = (u) => /F$/.test(u || "");
  if (f(from) === f(to)) return value;
  return f(to) ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
};

// Band of a value: 0 alert low, 1 warn low, 2 comfortable, 3 warn high, 4 alert high.
export const reBand = (v, [al, wl, wh, ah]) => {
  if (al !== null && v < al) return 0;
  if (wl !== null && v < wl) return 1;
  if (ah !== null && v >= ah) return 4;
  if (wh !== null && v >= wh) return 3;
  return 2;
};
