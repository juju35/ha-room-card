// ── Sensor kinds ─────────────────────────────────────────────────────────────
// `dc`: device classes · `scale`: [alert low, warn low, warn high, alert high] in `unit` (null: no low side)
// · `gauge`: range of the bar · `words` / `issue`: label families (b_* / i_*) · `sev`: severity of the five bands
// · `cold`: bands tinted blue. A kind without `scale` (light level) is information only.
export const RE_SEV = ["alert", "warn", "ok", "warn", "alert"];
export const RE_KINDS = {
  temperature: {
    dc: ["temperature"],
    unit: "°C",
    scale: [16, 18, 25, 28],
    gauge: [10, 35],
    digits: 1,
    words: "temperature",
    issue: "temperature",
    sev: ["warn", "info", "ok", "warn", "alert"],
    cold: [0, 1],
    icon: "mdi:thermometer",
    icons: ["mdi:snowflake-thermometer", "mdi:thermometer-low", "mdi:thermometer", "mdi:thermometer-high", "mdi:thermometer-alert"],
  },
  humidity: {
    dc: ["humidity"],
    unit: "%",
    scale: [25, 35, 60, 70],
    gauge: [0, 100],
    digits: 0,
    words: "humidity",
    issue: "humidity",
    icon: "mdi:water-percent",
    icons: ["mdi:water-percent-alert", "mdi:water-percent", "mdi:water-percent", "mdi:water-percent", "mdi:water-percent-alert"],
  },
  co2: {
    dc: ["carbon_dioxide"],
    unit: "ppm",
    scale: [null, null, 1000, 1500],
    gauge: [400, 2000],
    digits: 0,
    words: "air",
    issue: "co2",
    icon: "mdi:molecule-co2",
  },
  pm25: { dc: ["pm25"], unit: "µg/m³", scale: [null, null, 15, 35], gauge: [0, 75], digits: 0, words: "air", issue: "air", icon: "mdi:blur" },
  pm10: { dc: ["pm10"], unit: "µg/m³", scale: [null, null, 45, 100], gauge: [0, 150], digits: 0, words: "air", issue: "air", icon: "mdi:blur-radial" },
  voc: {
    dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
    unit: "µg/m³",
    scale: [null, null, 300, 1000],
    gauge: [0, 1500],
    // Same levels in parts: 220 / 660 ppb.
    units: { ppb: [220, 660, 1000], ppm: [0.22, 0.66, 1] },
    digits: 0,
    words: "air",
    issue: "air",
    icon: "mdi:scent",
  },
  aqi: { dc: ["aqi"], unit: "", scale: [null, null, 100, 150], gauge: [0, 300], digits: 0, words: "air", issue: "air", icon: "mdi:air-filter" },
  noise: {
    dc: ["sound_pressure"],
    unit: "dB",
    // Noisy from 70 dB (vacuum, loud TV), very noisy from 85 dB (the level where long exposure harms hearing):
    // conversation and everyday sounds (40 to 65 dB) stay quiet.
    scale: [null, null, 70, 85],
    gauge: [20, 100],
    digits: 0,
    words: "noise",
    issue: "noise",
    icon: "mdi:volume-medium",
    icons: [null, null, "mdi:volume-low", "mdi:volume-high", "mdi:volume-high"],
  },
  illuminance: {
    dc: ["illuminance"],
    unit: "lx",
    // Dark below 10 lx, dim below 200 lx.
    steps: [10, 200],
    gauge: [0, 1000],
    digits: 0,
    words: "illuminance",
    icon: "mdi:brightness-5",
    icons: ["mdi:brightness-3", "mdi:brightness-5", "mdi:brightness-7"],
  },
};
export const RE_ORDER = Object.keys(RE_KINDS);
export const RE_DC = Object.fromEntries(RE_ORDER.flatMap((k) => RE_KINDS[k].dc.map((dc) => [dc, k])));
export const RE_RANK = { ok: 0, info: 1, warn: 2, alert: 3 };

export const reKindOf = (st) => RE_DC[st?.attributes.device_class];
// A sensor that reports a number: unavailable, unknown and other states give no reading.
export const reValid = (st) => !rcUnavailable(st) && Number.isFinite(Number.parseFloat(st.state));

// Environment sensors of the card: a known device class, configuration and diagnostic entities excepted
// (a battery or a CPU temperature, say).
export const reMatch = (hass, id) =>
  id.startsWith("sensor.") && !hass.entities?.[id]?.entity_category && !!reKindOf(hass.states[id]);
