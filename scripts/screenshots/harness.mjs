// Shared by the screenshot scripts: theme variables, <ha-card> / <ha-icon> stand-ins, and the render loop.
import { chromium } from "playwright";
import * as mdi from "@mdi/js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../..", import.meta.url));
const cardJs = readFileSync(`${root}dist/ha-room-card.js`, "utf8");

// Every mdi:* icon the cards or the mock data can use, as SVG paths for the <ha-icon> stand-in.
const iconsFor = (extra) => {
  const icons = {};
  for (const name of new Set([...cardJs.match(/mdi:[a-z0-9-]+/g), ...extra])) {
    const key = `mdi${name.slice(4).replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())}`;
    if (mdi[key]) icons[name.slice(4)] = mdi[key];
  }
  return icons;
};

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed", "--secondary-background-color": "#ececec", "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121", "--secondary-text-color": "#727272", "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111", "--secondary-background-color": "#282828", "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1", "--secondary-text-color": "#9b9b9b", "--divider-color": "rgba(225,225,225,.12)",
  },
};
const COMMON = {
  "--primary-color": "#03a9f4", "--success-color": "#43a047", "--warning-color": "#ffa600", "--error-color": "#db4437",
  "--text-primary-color": "#ffffff",
};

const haElements = (icons) => `
const ICONS = ${JSON.stringify(icons)};
customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});
customElements.define("ha-icon", class extends HTMLElement {
  static get observedAttributes() { return ["icon"]; }
  connectedCallback() { this._draw(); }
  attributeChangedCallback() { this._draw(); }
  _draw() {
    const path = ICONS[(this.getAttribute("icon") || "").replace("mdi:", "")] || "";
    this.style.display = "inline-flex";
    this.innerHTML = '<svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor"><path d="' + path + '"/></svg>';
  }
});`;

const pageHtml = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries({ ...THEMES[theme], ...COMMON }).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

// Card widths: 460px for the full cards, the overviews and a zoomed-in mini card, 380px for the mini cards.
const widthFor = (tag, s) => (tag.endsWith("-mini-card") && !s.zoom ? 380 : 460);

// A light shot and its dark twin, both in English: pair("on", { on: X }).
export const pair = (file, extra = {}) => [
  { file, theme: "light", ...extra },
  { file: `${file}-dark`, theme: "dark", ...extra },
];

// Renders each shot of `shots` ({ file, theme, ... }) into screenshots/<prefix>-<file>.png.
// `setup(shot, lang)` returns { hass, config, open? } for that shot; every shot is in English.
export const shoot = async ({ prefix, tag, shots, setup, icons = [] }) => {
  const iconMap = iconsFor(icons);
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of shots) {
    // A new page per shot: the card's script declares top-level names, which cannot be evaluated twice in one page.
    const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
    page.on("pageerror", (err) => console.error(`pageerror (${prefix}-${s.file}): ${err.message}`));
    const lang = "en";
    const width = widthFor(tag, s);
    const { hass, config, open } = setup(s, lang);
    await page.setContent(pageHtml(s.theme, width));
    await page.addScriptTag({ content: haElements(iconMap) });
    await page.addScriptTag({ content: cardJs });
    await page.evaluate(
      ({ tag, hass, config, dark, open }) => {
        const el = document.createElement(tag);
        el.setConfig({ type: `custom:${tag}`, ...config });
        el.hass = { ...hass, language: hass.language, themes: { darkMode: dark }, callService: async () => {} };
        document.getElementById("root").appendChild(el);
        // A mouse click (detail 1), not a keyboard one: no focus ring left in the shot.
        if (open) el.shadowRoot.querySelector(open).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
      },
      { tag, hass, config, dark: s.theme === "dark", open },
    );
    await page.waitForTimeout(400);
    const out = `screenshots/${prefix}-${s.file}.png`;
    // The card on the theme background, with the body's 16px padding around it.
    const box = await page.locator("#root").boundingBox();
    await page.screenshot({
      path: `${root}${out}`,
      clip: { x: 0, y: 0, width: width + 32, height: Math.ceil(box.height) + 32 },
      animations: "disabled",
    });
    console.log(out);
    await page.close();
  }
  await browser.close();
};
