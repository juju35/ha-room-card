// Shared by the screenshot scripts: theme variables, <ha-card> / <ha-icon> stand-ins, and the render loop.
import { chromium } from "playwright";
import * as mdi from "@mdi/js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../..", import.meta.url));
// Read on first use: the tests import writeIfChanged without a built bundle.
let bundle;
const cardJs = () => (bundle ??= readFileSync(`${root}dist/ha-room-card.js`, "utf8"));

// Every mdi:* icon the cards or the mock data can use, as SVG paths for the <ha-icon> stand-in.
export const iconsFor = (extra) => {
  const icons = {};
  for (const name of new Set([...cardJs().match(/mdi:[a-z0-9-]+/g), ...extra])) {
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
      // Like Home Assistant's <ha-card>: the --ha-card-* variables win (the overviews' panel sets them for the room
      // cards it unfolds: no border, no background), the theme's colours otherwise.
      "<style>:host{display:block;background:var(--ha-card-background,var(--card-background-color));" +
      "border-radius:var(--ha-card-border-radius,12px);border-style:solid;border-width:var(--ha-card-border-width,1px);" +
      "border-color:var(--ha-card-border-color,var(--divider-color));box-shadow:var(--ha-card-box-shadow,none);" +
      "color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});
customElements.define("ha-icon", class extends HTMLElement {
  static get observedAttributes() { return ["icon"]; }
  connectedCallback() { this._draw(); }
  attributeChangedCallback() { this._draw(); }
  _draw() {
    const path = ICONS[(this.getAttribute("icon") || "").replace("mdi:", "")] || "";
    // Like Home Assistant's <ha-icon>: its display comes from its own :host rule, which the card's styles override
    // (".head button.chip .off { display: none }"); an inline style would win over them.
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = '<style>:host{display:inline-flex}</style><svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor"><path d="' + path + '"/></svg>';
  }
});`;

const pageHtml = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { ${Object.entries({ ...THEMES[theme], ...COMMON }).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

// Card widths: 460px for the full cards, the overviews and a zoomed-in mini card, 380px for the mini cards; a shot's
// own `width` wins (the tiles layout, shown at a phone's width).
const widthFor = (tag, s) => s.width ?? (tag.endsWith("-mini-card") && !s.zoom ? 380 : 460);

// A light shot and its dark twin, both in English: pair("on", { on: X }).
export const pair = (file, extra = {}) => [
  { file, theme: "light", ...extra },
  { file: `${file}-dark`, theme: "dark", ...extra },
];

export const launch = () => chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

// A page ready to host a card: theme variables, the <ha-*> stand-ins and the card bundle loaded.
// A new page per shot: the card's script declares top-level names, which cannot be evaluated twice in one page.
// `ws`: a recorder mock, as script source defining window.__ws (the card's hass.callWS).
export const openPage = async (browser, { theme, width, icons = {}, label = "", ws = "" }) => {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 2000 } });
  page.on("pageerror", (err) => console.error(`pageerror${label ? ` (${label})` : ""}: ${err.message}`));
  await page.setContent(pageHtml(theme, width));
  await page.addScriptTag({ content: haElements(icons) + ws });
  await page.addScriptTag({ content: cardJs() });
  return page;
};

// Creates the card in the page, with `open` (a selector) clicked once rendered.
export const mountCard = (page, { tag, hass, config, dark = false, open = null }) =>
  page.evaluate(
    ({ tag, hass, config, dark, open }) => {
      const el = document.createElement(tag);
      el.setConfig({ type: `custom:${tag}`, ...config });
      el.hass = {
        ...hass,
        language: hass.language,
        themes: { darkMode: dark },
        callService: async () => {},
        ...(window.__ws ? { callWS: window.__ws } : {}),
      };
      document.getElementById("root").appendChild(el);
      // A mouse click (detail 1), not a keyboard one: no focus ring left in the shot.
      if (open) el.shadowRoot.querySelector(open).dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
    },
    { tag, hass, config, dark, open },
  );

// The card on the theme background, with the body's 16px padding around it.
export const cardClip = async (page, width) => {
  const box = await page.locator("#root").boundingBox();
  return { x: 0, y: 0, width: width + 32, height: Math.ceil(box.height) + 32 };
};

// Writes a PNG screenshot to `path` only when its pixels differ from the file already there. PNG encoding is not
// byte-stable from one run (or machine) to the next: comparing bytes would commit pictures that did not change.
// Both images are decoded by the page's browser (no colour conversion, no premultiplication) and compared pixel by pixel.
export const writeIfChanged = async (page, path, png) => {
  if (existsSync(path)) {
    const same = await page.evaluate(
      async ([a, b]) => {
        const pixels = async (b64) => {
          const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
          const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
          const ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext("2d");
          ctx.drawImage(bmp, 0, 0);
          return { w: bmp.width, h: bmp.height, d: ctx.getImageData(0, 0, bmp.width, bmp.height).data };
        };
        const [x, y] = await Promise.all([pixels(a), pixels(b)]);
        if (x.w !== y.w || x.h !== y.h) return false;
        for (let i = 0; i < x.d.length; i++) if (x.d[i] !== y.d[i]) return false;
        return true;
      },
      [readFileSync(path).toString("base64"), png.toString("base64")],
    );
    if (same) return false;
  }
  writeFileSync(path, png);
  return true;
};

// Renders each shot of `shots` ({ file, theme, ... }) into screenshots/<prefix>-<file>.png.
// `setup(shot, lang)` returns { hass, config, open? } for that shot; every shot is in English.
export const shoot = async ({ prefix, tag, shots, setup, icons = [], ws = "" }) => {
  const iconMap = iconsFor(icons);
  const browser = await launch();
  for (const s of shots) {
    const lang = "en";
    const width = widthFor(tag, s);
    const { hass, config, open } = setup(s, lang);
    const page = await openPage(browser, { theme: s.theme, width, icons: iconMap, label: `${prefix}-${s.file}`, ws });
    await mountCard(page, { tag, hass, config, dark: s.theme === "dark", open });
    await page.waitForTimeout(400);
    const out = `screenshots/${prefix}-${s.file}.png`;
    const png = await page.screenshot({ clip: await cardClip(page, width), animations: "disabled" });
    console.log(`${out}${(await writeIfChanged(page, `${root}${out}`, png)) ? "" : " (unchanged)"}`);
    await page.close();
  }
  await browser.close();
};

// The tiles layout (`layout: tiles`) of a card at a phone's width, light and dark: the card's own `setup` with the
// layout added; `extra` goes into the shot.
export const shootTiles = ({ setup, ...opts }, extra = {}) =>
  shoot({
    ...opts,
    shots: pair("tiles", { width: 380, ...extra }),
    setup: (s, lang) => {
      const out = setup(s, lang);
      return { ...out, config: { ...out.config, layout: "tiles" } };
    },
  });
