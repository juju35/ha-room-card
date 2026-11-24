// ── Discovery rules ──────────────────────────────────────────────────────────
// Smoke, carbon monoxide, gas and water leak detectors are left to ha-safety-card (safety-card, safety-overview-card).
export const RC_OPENING_CLASSES = ["door", "window", "opening", "garage_door"];
export const RC_PRESENCE_CLASSES = ["occupancy", "presence", "motion"];
// A switch driving a light belongs to the lights card, a switch that is a plug to the plugs card.
export const RC_LIGHT_NAME = /(^|\s)(lumi[eè]re|lampe|lamp|light|veilleuse|guirlande)(\s|$)/i;
export const RC_PLUG_NAME = /(^|\s)(prise|multiprise|plug|outlet|socket)(\s|$)/i;
export const RC_HOLD_MS = 500;
export const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
export const RC_REPEAT_MS = 150;

export const rcIsLightSwitch = (st) => RC_LIGHT_NAME.test(st.attributes.friendly_name || "");
export const rcIsPlug = (st) =>
  !rcIsLightSwitch(st) && (st.attributes.device_class === "outlet" || RC_PLUG_NAME.test(st.attributes.friendly_name || ""));

// What each room card shows, shared with the Overview so that both count the same entities.
// Detections that are not about people, which cameras report as motion: pets never count, vehicles only outdoors.
export const RC_PET = /(^|[\s_.-])(pets?|animals?|animaux|chiens?|chats?|dogs?|cats?)($|[\s_-])/i;
export const RC_VEHICLE = /(^|[\s_.-])(vehicles?|v[ée]hicules?|voitures?|cars?)($|[\s_-])/i;
// An outdoor room, from its name: garden, terrace, balcony, patio, yard, driveway, porch, gate, parking…
export const RC_OUTDOOR =
  /jardin|terrasse|balcon|patio|ext[ée]rieur|cour(\s|$)|all[ée]e|porche|portail|parking|garden|terrace|balcony|outdoor|outside|yard|driveway|porch|gate/i;
export const rcIsOutdoor = (area) => !!area && RC_OUTDOOR.test(`${area.name || ""} ${area.area_id || ""}`);

// Sensors card: door, window and opening sensors, plus presence and motion unless `presence` is false. Camera
// detections count, except pets, and vehicles outside an `outdoor` room.
export const rcMatchSensor = (hass, id, { presence = true, outdoor = false } = {}) => {
  if (!id.startsWith("binary_sensor.")) return false;
  const st = hass.states[id];
  const dc = st?.attributes.device_class;
  if (RC_OPENING_CLASSES.includes(dc)) return true;
  if (presence === false || !RC_PRESENCE_CLASSES.includes(dc)) return false;
  const name = `${id} ${st.attributes.friendly_name || ""}`;
  if (RC_PET.test(name)) return false;
  return outdoor || !RC_VEHICLE.test(name);
};
// Lights card: lights (groups excepted) and switches driving a light, configuration and diagnostic entities excepted.
export const rcMatchLight = (hass, id) => {
  const st = hass.states[id];
  if (!st || hass.entities?.[id]?.entity_category) return false;
  if (id.startsWith("light.")) return !Array.isArray(st.attributes.entity_id);
  return id.startsWith("switch.") && rcIsLightSwitch(st);
};
// Plugs card: switches that are plugs, configuration and diagnostic entities excepted.
export const rcMatchPlug = (hass, id) => {
  const st = hass.states[id];
  if (!st || !id.startsWith("switch.") || hass.entities?.[id]?.entity_category) return false;
  return rcIsPlug(st);
};

export const RC_ROOM_ICONS = [
  [/chambre|bedroom|nursery/i, "mdi:bed-outline"],
  [/s[ée]jour|salon|living|lounge/i, "mdi:sofa-outline"],
  [/cuisine|kitchen/i, "mdi:silverware-fork-knife"],
  [/salle (de )?bains?|bath|douche|shower/i, "mdi:shower-head"],
  [/toilettes?|wc|toilet/i, "mdi:toilet"],
  [/entr[ée]e|entrance|hall d.entr|entry/i, "mdi:door"],
  [/couloir|hall|corridor/i, "mdi:arrow-left-right"],
  [/bureau|office|study/i, "mdi:desk"],
  [/garage/i, "mdi:garage"],
  [/terrasse|jardin|balcon|garden|terrace|balcony|patio|ext[ée]rieur|outdoor/i, "mdi:flower-outline"],
  [/buanderie|cellier|laundry|utility/i, "mdi:washing-machine"],
  [/salle [àa] manger|dining/i, "mdi:table-chair"],
];

// Icon of a room in the overviews: the area's own icon, or one picked from its name.
export const rcRoomIcon = (area) => {
  if (area.icon) return area.icon;
  const hit = RC_ROOM_ICONS.find(([re]) => re.test(area.name || area.area_id || ""));
  return hit ? hit[1] : "mdi:home-outline";
};

// `fn(hass)` computed once per entity registry: HA replaces hass.entities only when the registry changes,
// whereas a new hass (and hass.states) comes with every state change of the whole instance.
export const rcPerRegistry = (fn) => {
  const cache = new WeakMap();
  const none = {};
  return (hass) => {
    const reg = hass.entities || none;
    if (!cache.has(reg)) cache.set(reg, fn(hass));
    return cache.get(reg);
  };
};

// The sensor entities of each device, in registry order.
export const rcDeviceSensors = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, r] of Object.entries(hass.entities || {})) {
    if (r.device_id && id.startsWith("sensor.")) (out[r.device_id] ||= []).push(id);
  }
  return out;
});

// Power sensor (device class power, W or kW) of each device; only the device's own sensors are read.
// Settled per registry like rcDeviceSensors (a device_class next to never changes), except for the devices with a
// sensor that has no state yet (an integration still loading after a restart): those are looked at again on every
// call until all their sensors report, so their power sensor is not missed until the next registry change.
export const rcPowerCache = rcPerRegistry((hass) => ({ found: {}, pending: new Set(Object.keys(rcDeviceSensors(hass))) }));
export const rcPowerSensors = (hass) => {
  const cache = rcPowerCache(hass);
  if (!cache.pending.size) return cache.found;
  const sensors = rcDeviceSensors(hass);
  for (const device of cache.pending) {
    const ids = sensors[device] || [];
    const id = ids.find((s) => hass.states[s]?.attributes.device_class === "power");
    if (id) cache.found[device] = id;
    if (id || ids.every((s) => hass.states[s])) cache.pending.delete(device);
  }
  return cache.found;
};

export const rcWattsOf = (hass, sensorId) => {
  const st = sensorId && hass.states[sensorId];
  const v = st ? Number.parseFloat(st.state) : Number.NaN;
  if (!Number.isFinite(v)) return null;
  return st.attributes.unit_of_measurement === "kW" ? v * 1000 : v;
};
