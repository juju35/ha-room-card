// Records the animated states into screenshots/*.gif (needs ffmpeg).
// Usage: npm install && npm run build && node scripts/screenshots/animations.mjs
// CSS animations are paused and stepped frame by frame — each one by a fraction of its own cycle, so every GIF
// loops cleanly whatever the machine's speed; the brightness drag is driven step by step with real pointer events.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cardClip, iconsFor, launch, mountCard, openPage, root } from "./harness.mjs";

const FPS = 20;
const WIDTH = 460;

const frameName = (i) => `f${String(i).padStart(3, "0")}.png`;

const encode = (dir, out) => {
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
    "-vf", `scale=${WIDTH + 32}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0", `${root}${out}`,
  ]);
  console.log(out);
};

// Steps every CSS animation of the page to `frac` of its own cycle: a GIF of one cycle loops seamlessly even when
// the card mixes periods (the 1.5 s blink and the 1.6 s badge pulse drift apart in real time).
// document.getAnimations() does not reach into shadow roots here, so the cards' trees are walked by hand.
const step = (page, frac) =>
  page.evaluate((f) => {
    const anims = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll("*")) {
        anims.push(...el.getAnimations());
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);
    for (const a of anims) {
      a.pause();
      const d = a.effect.getComputedTiming().duration;
      a.currentTime = (3 + f) * d;
    }
  }, frac);

// One cycle of the card's CSS animations, stepped frame by frame.
const recordCycle = async (page, dir, seconds) => {
  const clip = await cardClip(page, WIDTH);
  const frames = Math.round(FPS * seconds);
  for (let i = 0; i < frames; i++) {
    await step(page, i / frames);
    await page.screenshot({ path: join(dir, frameName(i)), clip, animations: "allow" });
  }
};

// ── Mock data ────────────────────────────────────────────────────────────────
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const area = { living_room: { area_id: "living_room", name: "Living room" } };
const hassOf = (states, entities) => ({ states, entities, devices: {}, areas: area, language: "en", locale: { language: "en" } });

// Sensors card: a leak sensor, two doors and a window, some of them on.
const sensorsHass = (on) => {
  const defs = [
    ["binary_sensor.sink_leak", "Sink Leak", "moisture"],
    ["binary_sensor.kitchen_door", "Kitchen Patio Door Contact", "door"],
    ["binary_sensor.living_room_door", "Living Room Patio Door Contact", "door"],
    ["binary_sensor.living_room_window", "Living Room Window Contact", "window"],
  ];
  const states = {};
  const entities = {};
  for (const [entity_id, friendly_name, device_class] of defs) {
    const [isOn, min] = on[entity_id] ?? [false, 180];
    states[entity_id] = { entity_id, state: isOn ? "on" : "off", last_changed: ago(min), attributes: { device_class, friendly_name } };
    entities[entity_id] = { entity_id, area_id: "living_room" };
  }
  return hassOf(states, entities);
};

// Lights card: one dimmable light on, one off.
const lightsHass = (pct) => {
  const states = {
    "light.living_room": {
      entity_id: "light.living_room",
      state: "on",
      attributes: { friendly_name: "Living Room", icon: "mdi:ceiling-light", supported_color_modes: ["color_temp", "xy"], brightness: Math.round((pct / 100) * 255) },
    },
    "light.night_light": {
      entity_id: "light.night_light",
      state: "off",
      attributes: { friendly_name: "Living Room Night Light", icon: "mdi:lightbulb-night", supported_color_modes: ["hs"] },
    },
  };
  const entities = Object.fromEntries(Object.keys(states).map((id) => [id, { entity_id: id, area_id: "living_room" }]));
  return hassOf(states, entities);
};

// ── The GIFs ─────────────────────────────────────────────────────────────────
const browser = await launch();

// Open sensors: their icons blink (rc-blink, one 1.5 s cycle).
{
  const page = await openPage(browser, { theme: "light", width: WIDTH, icons: iconsFor([]), label: "sensors-blink" });
  await mountCard(page, {
    tag: "room-sensors-card",
    hass: sensorsHass({ "binary_sensor.kitchen_door": [true, 12], "binary_sensor.living_room_window": [true, 5] }),
    config: { area: "living_room" },
  });
  await page.waitForTimeout(300);
  const dir = mkdtempSync(join(tmpdir(), "rc-frames-"));
  await recordCycle(page, dir, 1.5);
  encode(dir, "screenshots/sensors-blink.gif");
  rmSync(dir, { recursive: true });
  await page.close();
}

// Water leak: the header badge pulses (rc-pulse) while the leaking sensor blinks (one 1.6 s cycle).
{
  const page = await openPage(browser, { theme: "light", width: WIDTH, icons: iconsFor([]), label: "sensors-alert" });
  await mountCard(page, {
    tag: "room-sensors-card",
    hass: sensorsHass({ "binary_sensor.sink_leak": [true, 3], "binary_sensor.kitchen_door": [true, 12] }),
    config: { area: "living_room" },
  });
  await page.waitForTimeout(300);
  const dir = mkdtempSync(join(tmpdir(), "rc-frames-"));
  await recordCycle(page, dir, 1.6);
  encode(dir, "screenshots/sensors-alert.gif");
  rmSync(dir, { recursive: true });
  await page.close();
}

// Drag to dim: a real pointer drag across the dimmable light, the brightness bar following the finger.
{
  const page = await openPage(browser, {
    theme: "light",
    width: WIDTH,
    icons: iconsFor(["mdi:ceiling-light", "mdi:lightbulb-night"]),
    label: "lights-dim",
  });
  await mountCard(page, { tag: "room-lights-card", hass: lightsHass(30), config: { area: "living_room" } });
  await page.waitForTimeout(300);
  const dir = mkdtempSync(join(tmpdir(), "rc-frames-"));
  const clip = await cardClip(page, WIDTH);
  const box = await page.locator("room-lights-card .tile").first().boundingBox();
  const y = box.y + box.height / 2;
  const at = (pct) => box.x + (box.width * pct) / 100;
  let frame = 0;
  const grab = () => page.screenshot({ path: join(dir, frameName(frame++)), clip, animations: "allow" });
  await page.mouse.move(at(30), y);
  await grab();
  await page.mouse.down();
  // The first move clears the hold timer (more than 8 px sideways), then the bar follows each step.
  for (let pct = 34; pct <= 86; pct += 4) {
    await page.mouse.move(at(pct), y);
    await grab();
  }
  await page.mouse.up();
  // Hold the final level for a beat before the GIF loops.
  for (let i = 0; i < 6; i++) await grab();
  encode(dir, "screenshots/lights-dim.gif");
  rmSync(dir, { recursive: true });
  await page.close();
}

await browser.close();
