// ── In-place redraw ──
// Home Assistant sets `hass` on every state change of the house. Rewriting the card's whole content then (innerHTML)
// replaces every node: <ha-card> and <ha-icon> come back empty until their own update, the scene's animations start
// over, the status pill is measured before the new <ha-card> lays out its content (wrong line, other height), and
// the sections view reflows under the page (it moves by itself). rcMorph brings the nodes in place in line with the
// new markup instead: same node, text and attributes updated; a tile is matched by its key (data-id, data-area,
// data-scene), the rest by position and tag. Attributes the card sets itself after drawing (the pill's fit) are
// kept, and so are the nodes it adds itself (data-rc-own: the mini cards' zoom button).
export const RC_KEEP_ATTRS = new Set(["data-wrap", "data-dot"]);
export const rcIsOwn = (n) => n?.nodeType === 1 && n.hasAttribute("data-rc-own");
export const rcKeyOf = (n) => (n.nodeType === 1 ? (n.getAttribute("data-id") ?? n.getAttribute("data-area") ?? n.getAttribute("data-scene")) : null);

export const rcPatchNode = (a, b) => {
  if (a.nodeType !== 1) {
    if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
    return;
  }
  for (const { name, value } of b.attributes) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name) && !RC_KEEP_ATTRS.has(name)) a.removeAttribute(name);
  rcMorphChildren(a, b);
};

export const rcMorphChildren = (from, to) => {
  const old = [...from.childNodes].filter((n) => !rcIsOwn(n));
  const keyed = new Map();
  for (const n of old) {
    const k = rcKeyOf(n);
    if (k != null) keyed.set(`${n.nodeName}|${k}`, n);
  }
  const used = new Set();
  let cursor = 0;
  let prev = null;
  for (const n of [...to.childNodes]) {
    const k = rcKeyOf(n);
    let match = null;
    if (k != null) match = keyed.get(`${n.nodeName}|${k}`) ?? null;
    else {
      while (cursor < old.length && (used.has(old[cursor]) || rcKeyOf(old[cursor]) != null)) cursor++;
      if (old[cursor]?.nodeName === n.nodeName) match = old[cursor++];
    }
    if (match && !used.has(match)) {
      used.add(match);
      rcPatchNode(match, n);
    } else match = n;
    // Where it goes: right after the previous node, before the card's own nodes (which stay at the end).
    let ref = prev ? prev.nextSibling : from.firstChild;
    let own = null;
    while (rcIsOwn(ref)) {
      own ??= ref;
      ref = ref.nextSibling;
    }
    if (ref !== match) from.insertBefore(match, ref ?? own);
    prev = match;
  }
  for (const n of old) if (!used.has(n) && n.parentNode === from) from.removeChild(n);
};

// `el`'s content brought in line with `html`, in place (see above); a plain rewrite where there is no DOM to morph.
export const rcMorph = (el, html) => {
  if (!el.childNodes || typeof document.createElement("template").content !== "object") {
    el.innerHTML = html;
    return;
  }
  const t = document.createElement("template");
  t.innerHTML = html;
  rcMorphChildren(el, t.content);
};

export const rcUnavailable = (st) => ["unavailable", "unknown"].includes(st.state);

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
export const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
export const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
export const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};
