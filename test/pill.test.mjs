// The illustrated header in Chromium (needs `npm run build`; skipped without Chromium): the status pill shows its
// whole label from 245 to 500 px (right after the title, else on its own line), never more than about half of the
// title row, next to a readable title; the mini cards' expand / collapse button is a 24 px round button 5 px from the
// banner's top right corner.
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";

let harness;
try {
  harness = await import("../scripts/screenshots/harness.mjs");
} catch {}
const dist = new URL("../dist/", import.meta.url);
const built = existsSync(dist) && readdirSync(dist).some((f) => f.endsWith(".js"));
const browser = built ? await harness?.launch().catch(() => null) : null;

const TAGS = ["room-lights-card", "room-lights-mini-card", "room-sensors-card", "room-sensors-mini-card", "room-switch-card", "room-switch-mini-card",
  "room-environment-card", "room-environment-mini-card", "room-overview-card", "room-environment-overview-card"];

test("status pill shows its whole label next to a readable title; the zoom button sits at the banner corner", { skip: !browser && "no Chromium or no build" }, async () => {
  const failures = [];
  try {
    for (const tag of TAGS) {
      for (const width of [245, 300, 400, 500]) {
        for (const zoom of tag.includes("mini") ? [false, true] : [false]) {
          const hass = { ...makeHass(), language: "en", locale: { language: "en" } };
          delete hass.callService; // a function cannot reach the page
          const page = await harness.openPage(browser, { theme: "light", width });
          await harness.mountCard(page, { tag, hass, config: { area: "kitchen", animations: false }, open: zoom ? ".zoom" : null });
          await page.waitForTimeout(300);
          const out = await page.evaluate(() => {
            const r = document.querySelector("#root").firstElementChild.shadowRoot;
            const res = [];
            const pill = r.querySelector(".banner .trow > .pill, .banner .trow > .st");
            if (!pill) return ["no pill"];
            const txt = pill.querySelector(".pt");
            const pb = pill.getBoundingClientRect();
            // A status, not an empty-state sentence ("No room with environment sensors", whole in its tooltip).
            if (txt.textContent.length <= 20 && (txt.scrollWidth > txt.clientWidth + 0.5 || !txt.clientWidth)) res.push("label cut");
            const nb = r.querySelector(".banner .title").getBoundingClientRect();
            if (nb.width < 24) res.push(`title ${Math.round(nb.width)}px`);
            const onRow = Math.abs(pb.top + pb.height / 2 - (nb.top + nb.height / 2)) < 3;
            const row = r.querySelector(".banner .trow");
            const rw = getComputedStyle(row).display === "contents" ? 0 : row.getBoundingClientRect().width;
            if (onRow && rw && pb.width > rw * 0.51 + 0.5) res.push(`pill ${Math.round(pb.width)} of ${Math.round(rw)}px`);
            const bb = r.querySelector(".banner").getBoundingClientRect();
            if (pb.right > bb.right - 4 || pb.bottom > bb.bottom - 10 || pb.top < bb.top) res.push("pill out of the banner");
            const z = r.querySelector(".banner .zoom")?.getBoundingClientRect();
            if (z && (Math.round(z.width) !== 24 || Math.round(z.height) !== 24 || Math.round(z.top - bb.top) !== 5 || Math.round(bb.right - z.right) !== 5))
              res.push(`zoom ${Math.round(z.width)}x${Math.round(z.height)} at ${Math.round(z.top - bb.top)}/${Math.round(bb.right - z.right)}`);
            return res;
          });
          for (const f of out) failures.push(`${tag}${zoom ? " zoomed" : ""} ${width}px: ${f}`);
          await page.close();
        }
      }
    }
  } finally {
    await browser?.close();
  }
  assert.deepEqual(failures, []);
});
