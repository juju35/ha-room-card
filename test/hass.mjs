// A small mock Home Assistant: one room with a door, a diagnostic door sensor, a light and a plug.
export const makeHass = (overrides = {}) => {
  const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });
  return {
    language: "fr",
    locale: { language: "fr" },
    areas: { kitchen: { area_id: "kitchen", name: "Kitchen" } },
    devices: { d1: { area_id: "kitchen" }, d2: { area_id: "kitchen" } },
    entities: {
      "binary_sensor.door": { area_id: "kitchen" },
      "binary_sensor.diag_door": { area_id: "kitchen", entity_category: "diagnostic" },
      "light.ceiling": { area_id: "kitchen" },
      "switch.coffee_plug": { device_id: "d1" },
      "sensor.coffee_power": { device_id: "d1" },
      "switch.relay": { area_id: "kitchen", entity_category: "config" },
    },
    states: {
      "binary_sensor.door": st("binary_sensor.door", "off", { device_class: "door", friendly_name: "Door" }),
      "binary_sensor.diag_door": st("binary_sensor.diag_door", "on", { device_class: "door", friendly_name: "Diag door" }),
      "light.ceiling": st("light.ceiling", "on", { friendly_name: "Ceiling light" }),
      "switch.coffee_plug": st("switch.coffee_plug", "on", { friendly_name: "Coffee plug" }),
      "sensor.coffee_power": st("sensor.coffee_power", "12", { device_class: "power", unit_of_measurement: "W" }),
      "switch.relay": st("switch.relay", "off", { device_class: "outlet", friendly_name: "Relay plug" }),
    },
    callService() {},
    ...overrides,
  };
};
