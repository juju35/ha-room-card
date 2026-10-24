// Evaluates src/shared.js and the cards in a sandbox with minimal DOM stand-ins, the way scripts/build.mjs
// concatenates them, and returns the names the tests need. No dependency, no browser.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../src/", import.meta.url);
const read = (name) => readFileSync(new URL(`${name}.js`, root), "utf8");

// Shadow root / element stand-in: enough for the cards' render and event wiring.
export const fakeNode = () => ({
  innerHTML: "",
  hidden: false,
  style: {},
  children: [],
  className: "",
  classList: { add() {}, remove() {}, toggle() {} },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {},
  appendChild(el) {
    this.children.push(el);
  },
});

export const load = () => {
  const registry = new Map();
  class HTMLElement {
    constructor() {
      this.style = {};
    }
    attachShadow() {
      this.shadowRoot = fakeNode();
      return this.shadowRoot;
    }
    dispatchEvent() {}
  }
  const sandbox = {
    HTMLElement,
    console: { info() {} },
    customElements: { get: (t) => registry.get(t), define: (t, c) => registry.set(t, c) },
    document: {
      createElement: (t) => (registry.has(t) ? new (registry.get(t))() : fakeNode()),
      addEventListener() {},
      removeEventListener() {},
    },
    history: { pushState() {} },
    setTimeout,
    clearTimeout,
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  const cards = ["room-sensors-card", "room-lights-card", "room-switch-card", "room-overview-card"];
  const code = [read("shared"), ...cards.map((c) => `{\n${read(c)}}\n`)].join("\n");
  return vm.runInContext(
    `${code}
    ({ RcCard, rcCleanName, rcIsPlug, rcIsLightSwitch, rcMatchSensor, rcMatchLight, rcMatchPlug, rcEsc, rcMemo,
       rcPowerSensors, rcCall, rcInDialog, RC_HOLD_MS, customElements, cards: Object.fromEntries(${JSON.stringify(cards)}.map((t) => [t, customElements.get(t)])) })`,
    ctx,
  );
};
