// The illustrated header in Chromium (skipped without Chromium), for every card in en, fr, de, hu, el and ru from 190
// to 500 px, with its own title and a long one, with the illustrated banner and the classic header: the status pill sits right after the title only beside a whole title (never an ellipsised title next to
// it), its label is whole or it shows its dot alone (always its dot alone at 200 px or less), and nothing of the
// title block leaves the banner or reaches its floor strip; the mini cards' expand / collapse button is a 24 px round
// button 5 px from the banner's top right corner.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";

let harness;
try {
  harness = await import("../scripts/screenshots/harness.mjs");
} catch {}
const browser = await harness?.launch().catch(() => null);

// The bundle as scripts/build.mjs makes it, with every language inline (the build moves them to files of their own).
const src = (name) => readFileSync(new URL(`../src/${name}.js`, import.meta.url), "utf8");
const CARDS = ["room-sensors-card", "room-lights-card", "room-switch-card", "room-environment-card", "room-overview-card"];
const js = ["{", src("shared"), src("scene"), ...CARDS.map((c) => `{\n${src(c)}}\n`), "}"].join("\n");

const TAGS = ["room-lights-card", "room-lights-mini-card", "room-sensors-card", "room-sensors-mini-card", "room-switch-card", "room-switch-mini-card",
  "room-environment-card", "room-environment-mini-card", "room-overview-card", "room-environment-overview-card"];
const LANGUAGES = ["en", "fr", "de", "hu", "el", "ru"];
const WIDTHS = [190, 245, 300, 400, 460, 500];

// In-page audit of the header (string spliced into page.evaluate): every title block with a status pill —
// the pill on the title row only beside a whole title, its label whole or its dot alone (≤ 200 px: dot alone),
// nothing of the title block below the banner's ground strip or outside the banner.
const pillAudit = (r, width, pillSel, nameSel, groundSel, bannerSel = ".banner") => {
  const res = [];
  const shown = (e) => e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
  const cut = (e) => [e, ...e.querySelectorAll("*")].some((x) => shown(x) && x.clientWidth > 1 && getComputedStyle(x).overflow !== "visible" && x.scrollWidth > x.clientWidth + 1);
  const pills = [...r.querySelectorAll(pillSel)].filter(shown);
  if (!pills.length) return ["no pill"];
  for (const pill of pills) {
    const pb = pill.getBoundingClientRect();
    const dot = pb.width < 30;
    if (width <= 200 && !dot) res.push(`pill "${pill.textContent.trim()}" not a dot at ${width}px`);
    if (!dot && cut(pill)) res.push(`pill "${pill.textContent.trim()}" label cut`);
    const name = pill.parentElement.querySelector(nameSel) || pill.closest(".titles")?.querySelector(nameSel);
    if (shown(name)) {
      const nb = name.getBoundingClientRect();
      const onRow = Math.abs(pb.top + pb.height / 2 - (nb.top + nb.height / 2)) < nb.height / 2;
      const range = document.createRange();
      range.selectNodeContents(name);
      if (onRow && range.getBoundingClientRect().width > nb.width + 0.01) res.push(`title "${name.textContent.trim()}" ellipsised beside the pill`);
    }
    const banner = pill.closest(bannerSel);
    if (!banner) continue;
    const bb = banner.getBoundingClientRect();
    const floor = banner.querySelector(groundSel)?.getBoundingClientRect().top ?? bb.bottom;
    const block = pill.closest(".titles") || pill.parentElement;
    for (const x of [block, ...block.children, ...block.querySelectorAll(":scope > .trow > *")]) {
      if (!shown(x)) continue;
      const xb = x.getBoundingClientRect();
      if (!xb.width || !xb.height) continue;
      if (xb.bottom > floor + 0.5 || xb.top < bb.top - 0.5 || xb.right > bb.right + 0.5 || xb.left < bb.left - 0.5) {
        res.push(`${x.className || x.tagName} outside the banner above its ground strip`);
        break;
      }
    }
  }
  return res;
};

test("status pill beside a whole title or under the subtitle, label whole or dot alone, inside the banner", { skip: !browser && "no Chromium" }, async () => {
  const failures = [];
  const hass = { ...makeHass(), language: "en", locale: { language: "en" } };
  delete hass.callService; // a function cannot reach the page
  try {
    for (const tag of TAGS) {
      const page = await harness.openPage(browser, { theme: "light", width: 500, js });
      const out = await page.evaluate(
        async ({ tag, hass, LANGUAGES, WIDTHS, audit }) => {
          const pillAudit = new Function(`return (${audit})`)();
          const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const res = [];
          for (const classic of [false, true])
          for (const zoom of tag.includes("mini") ? [false, true] : [false])
            for (const language of LANGUAGES)
              for (const width of WIDTHS)
                for (const title of [undefined, "Kitchen and dining room"]) {
                document.body.style.width = `${width}px`;
                const el = document.createElement(tag);
                el.setConfig({ type: `custom:${tag}`, area: "kitchen", animations: false, language, ...(title ? { title } : {}), ...(classic ? { illustration: false } : {}) });
                el.hass = { ...hass, themes: { darkMode: false }, callService: async () => {} };
                document.getElementById("root").replaceChildren(el);
                if (zoom) el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
                await frame();
                await frame();
                const r = el.shadowRoot;
                const what = `${tag}${classic ? " classic" : ""}${zoom ? " zoomed" : ""} ${language} ${width}px${title ? " long title" : ""}`;
                if (classic) {
                  // The classic header: the same rule, the pill right after the title (the header's 6–10 px gap) when it shares its line.
                  for (const f of pillAudit(r, width, ".head > .pill, .mini .head > .st", ".title", ".ground")) res.push(`${what}: ${f}`);
                  const p = r.querySelector(".head > .pill, .mini .head > .st")?.getBoundingClientRect();
                  const n = r.querySelector(".head > .title")?.getBoundingClientRect();
                  if (p && n && Math.abs(p.top + p.height / 2 - (n.top + n.height / 2)) < n.height / 2 && (p.left - n.right < 4 || p.left - n.right > 12))
                    res.push(`${what}: pill ${Math.round(p.left - n.right)}px after the title`);
                  continue;
                }
                for (const f of pillAudit(r, width, ".banner .trow > .pill, .banner .trow > .st", ".title", ".ground")) res.push(`${what}: ${f}`);
                const bb = r.querySelector(".banner").getBoundingClientRect();
                const z = r.querySelector(".banner .zoom")?.getBoundingClientRect();
                if (z && (Math.round(z.width) !== 24 || Math.round(z.height) !== 24 || Math.round(z.top - bb.top) !== 5 || Math.round(bb.right - z.right) !== 5))
                  res.push(`${what}: zoom ${Math.round(z.width)}x${Math.round(z.height)} at ${Math.round(z.top - bb.top)}/${Math.round(bb.right - z.right)}`);
              }
          return res;
        },
        { tag, hass, LANGUAGES, WIDTHS, audit: pillAudit.toString() },
      );
      failures.push(...out);
      await page.close();
    }
  } finally {
    await browser?.close();
  }
  assert.deepEqual(failures, []);
});
