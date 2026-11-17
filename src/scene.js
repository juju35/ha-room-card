// ── Illustrated header ───────────────────────────────────────────────────────
// The header of every card can be an animated picture (`illustration: false` keeps the classic header): the title
// and the status on the left, over the room's wall colour, a 200 × 80 scene on the right and a 10 px floor strip
// edge to edge at the bottom. Two layers:
// - the card's own theme, always there and drawn from the card's real state: pendant lamps (lights), door, window,
//   motion detector and leak puck (sensors), wall sensor, window and plant (environment), electrical panel and plugs
//   (plugs), a cutaway house with four rooms (overview);
// - the room type (`room_type`, guessed from the area's name or icon, `none` for the theme alone): wall colour, a
//   faint silhouette of the room's typical furniture and the floor (tiles, concrete or parquet). The Lights card
//   keeps the light theme alone, with no room.
// Night (stars, darker walls, lit lamps) when the sun is below the horizon (sun.sun) or Home Assistant is dark, and
// `illustration_theme: day | night` forces one. The scenes hold no id (no gradient, no mask): several cards on a
// page cannot clash. Everything moving stops with prefers-reduced-motion.

// Wall colours [day, night] of each room type.
const RC_WALLS = {
  none: ["#f3f1ec", "#23262f"],
  living: ["#f4ede3", "#2a2f3d"],
  bedroom: ["#eef0f8", "#262a3a"],
  kids: ["#fdf3e7", "#2a2a36"],
  kitchen: ["#eef3f4", "#283040"],
  dining: ["#f4eee6", "#2b2e3a"],
  bathroom: ["#e8f4f6", "#22303a"],
  toilets: ["#eaf2f2", "#22303a"],
  hallway: ["#f2efe9", "#2a2b33"],
  entry: ["#f3ede4", "#2b2a33"],
  office: ["#eef1f6", "#262c3a"],
  laundry: ["#eef2f5", "#262c36"],
  garage: ["#e4e6ea", "#22262e"],
};
const RC_ROOM_TYPES = Object.keys(RC_WALLS).filter((t) => t !== "none");

// The room type from the area's name (any language the cards speak, French and English first), else its icon.
const RC_ROOM_NAMES = [
  [/enfant|kids?\b|child|nursery|b[ée]b[ée]|playroom|jeux|kinder/i, "kids"],
  [/salle (de |d.)?(bains?|eau)|bath|douche|shower|bad\b|badezimmer|ba[ñn]o/i, "bathroom"],
  [/toilettes?|\bw\.?c\b|toilet|lavabo/i, "toilets"],
  [/salle [àa] manger|dining|esszimmer|comedor/i, "dining"],
  [/buanderie|cellier|laundry|utility|waschk/i, "laundry"],
  [/cuisine|kitchen|k[üu]che|cocina|cucina|keuken/i, "kitchen"],
  [/entr[ée]e|entrance|entry|foyer|vestibul|eingang/i, "entry"],
  [/couloir|hall|corridor|palier|landing|flur|pasillo/i, "hallway"],
  [/chambre|bedroom|schlafzimmer|dormitorio|camera da letto|slaapkamer/i, "bedroom"],
  [/salon|s[ée]jour|living|lounge|wohnzimmer|sala/i, "living"],
  [/bureau|office|study|b[üu]ro|despacho|ufficio/i, "office"],
  [/garage|atelier|workshop|carport/i, "garage"],
];
const RC_ROOM_ICON_TYPES = [
  [/teddy|baby|toy|human-child/, "kids"],
  [/bed/, "bedroom"],
  [/sofa|television|tv/, "living"],
  [/silverware|stove|fridge|chef|pot-steam|kitchen/, "kitchen"],
  [/table-chair|table-furniture/, "dining"],
  [/shower|bathtub|bath/, "bathroom"],
  [/toilet/, "toilets"],
  [/washing-machine|tumble-dryer|hanger/, "laundry"],
  [/door/, "entry"],
  [/desk|laptop|monitor|briefcase/, "office"],
  [/garage|car\b|car-/, "garage"],
];
const rcGuessRoomType = (area) => {
  if (!area) return "none";
  const name = `${area.name || ""} ${area.area_id || ""}`;
  const byName = RC_ROOM_NAMES.find(([re]) => re.test(name));
  if (byName) return byName[1];
  const byIcon = area.icon && RC_ROOM_ICON_TYPES.find(([re]) => re.test(area.icon));
  return byIcon ? byIcon[1] : "none";
};
// `room_type` when set (`auto` or unset: guessed), `none` when the type is unknown.
const rcRoomType = (config, area) => {
  const t = config?.room_type;
  if (t === "none" || RC_ROOM_TYPES.includes(t)) return t;
  return rcGuessRoomType(area);
};
const rcFloorOf = (type) =>
  ["kitchen", "bathroom", "toilets", "entry", "laundry"].includes(type) ? "tiles" : type === "garage" ? "concrete" : "parquet";

// Night picture: forced by illustration_theme, else the sun below the horizon or Home Assistant's dark mode (a dark
// theme takes the night picture even while the sun is up; an unknown sun leaves the dark mode alone to decide).
const rcIsNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return hass?.states?.["sun.sun"]?.state === "below_horizon" || !!hass?.themes?.darkMode;
};

// ── Drawing helpers ──────────────────────────────────────────────────────────
const rcPick = (n, day, night) => (n ? night : day);
// The faint furniture of the room type, in the left half of the scene (behind nothing that moves).
const RC_GHOSTS = {
  living: `<rect x="20" y="56" width="70" height="20" rx="6"/><rect x="14" y="48" width="12" height="28" rx="5"/><rect x="84" y="48" width="12" height="28" rx="5"/>`,
  bedroom: `<rect x="16" y="40" width="7" height="36" rx="2"/><rect x="20" y="56" width="90" height="14" rx="3"/><rect x="24" y="50" width="20" height="8" rx="4"/>`,
  kids: `<rect x="16" y="58" width="70" height="12" rx="3"/><rect x="92" y="62" width="12" height="12"/><circle cx="114" cy="70" r="5"/>`,
  kitchen: `<rect x="0" y="54" width="110" height="26"/><rect x="0" y="6" width="110" height="20"/><rect x="40" y="48" width="24" height="6" rx="2"/>`,
  dining: `<rect x="24" y="50" width="66" height="4"/><rect x="30" y="54" width="4" height="22"/><rect x="80" y="54" width="4" height="22"/><rect x="10" y="44" width="4" height="32"/><rect x="10" y="62" width="14" height="3"/><rect x="100" y="44" width="4" height="32"/><rect x="90" y="62" width="14" height="3"/>`,
  bathroom: `<path d="M10 56 H100 V64 Q100 76 88 76 H22 Q10 76 10 64Z"/><path d="M92 56 V36 h-8" stroke="currentColor" stroke-width="3" fill="none"/>`,
  toilets: `<rect x="40" y="36" width="20" height="22" rx="2"/><path d="M34 58 h32 q0 12 -12 14 v4 h-8 v-4 q-12 -2 -12 -14z"/><circle cx="86" cy="50" r="5"/>`,
  hallway: `<rect x="20" y="56" width="60" height="4"/><rect x="24" y="60" width="3" height="16"/><rect x="73" y="60" width="3" height="16"/><rect x="34" y="20" width="30" height="22" rx="1"/>`,
  entry: `<rect x="30" y="16" width="30" height="60"/><rect x="74" y="20" width="2" height="56"/><path d="M68 22 h14"/>`,
  office: `<rect x="14" y="52" width="90" height="4"/><rect x="18" y="56" width="4" height="20"/><rect x="96" y="56" width="4" height="20"/><rect x="44" y="30" width="34" height="20" rx="2"/>`,
  laundry: `<rect x="20" y="40" width="34" height="36" rx="3"/><circle cx="37" cy="60" r="10" fill-opacity=".5"/><path d="M66 60 h26 l-3 16 h-20z"/>`,
  garage: `<path d="M20 70 Q22 60 34 58 L44 50 H74 L86 58 Q100 60 100 70Z"/><circle cx="36" cy="72" r="6"/><circle cx="86" cy="72" r="6"/>`,
};
const rcGhost = (type, n) => {
  const g = RC_GHOSTS[type];
  return g ? `<g fill="${rcPick(n, "#5c4a3a", "#ffffff")}" color="${rcPick(n, "#5c4a3a", "#ffffff")}" opacity="${rcPick(n, 0.09, 0.07)}">${g}</g>` : "";
};
// A falling drop (leak), its tip at (x, y).
const rcDrop = (x, y, fill, cls = "sc-drip") => `<path class="${cls}" d="M${x} ${y} q-3 4 0 6 q3 -2 0 -6z" fill="${fill}"/>`;
// A person standing, feet at (x, y).
const rcPerson = (x, y, fill) =>
  `<g transform="translate(${x} ${y})" fill="${fill}"><circle cy="-30" r="4.4"/><path d="M-5 -24 h10 l2 14 h-3 l-1 10 h-3 l-1 -10 h-1 l-1 10 h-3 l-1 -10 h-3z"/></g>`;
// A window (glass, mullion, opening sash scaled by `open` 0–1), top-left at (x, y).
const rcWindow = (x, y, w, h, n, { open = 0, glass } = {}) => {
  const frame = rcPick(n, "#fff", "#4a5568");
  const half = w / 2;
  const sash = open ? `<g transform="translate(${half} 0) scale(${1 - 0.7 * open} 1) translate(${-half} 0)">` : "<g>";
  return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="1.5" fill="${glass || rcPick(n, "#cfe8f8", "#1b2f52")}" stroke="${frame}" stroke-width="2"/><line x1="${half}" y1="0" x2="${half}" y2="${h}" stroke="${frame}" stroke-width="1.4"/>${sash}<rect x="${half}" y="0" width="${half}" height="${h}" fill="${rcPick(n, "#e2f2fc", "#28406a")}" opacity=".9" stroke="${frame}" stroke-width="1.4"/></g></g>`;
};
// A door or window contact (magnet and sensor), its LED amber and blinking when open.
const rcContact = (x, y, open) =>
  `<rect x="${x}" y="${y}" width="4" height="10" rx="1" fill="#fff" stroke="#9aa3ae" stroke-width=".5"/><circle class="${open ? "sc-blink" : ""}" cx="${x + 2}" cy="${y + 2}" r=".9" fill="${open ? "#f5b400" : "#43c463"}"/>`;
const rcStars = (pts) => `<g fill="#fff" opacity=".8">${pts.map(([x, y]) => `<circle class="sc-tw" cx="${x}" cy="${y}" r=".6"/>`).join("")}</g>`;

// ── Card themes ──────────────────────────────────────────────────────────────
// Lights: three pendant lamps, lit in the lights' own colours; the room a little darker when everything is off.
const RC_LAMP_POS = [
  [110, 20],
  [146, 32],
  [182, 18],
];
const RC_LAMP_COLORS = ["#ffd27a", "#ffb36b", "#c9b8ff"];
const rcSceneLights = (s, n) => {
  const lamps = s.lamps || [];
  const start = RC_LAMP_POS.length - Math.max(1, lamps.length);
  const one = ([x, y], l, i) => {
    const c = l.color || RC_LAMP_COLORS[(start + i) % 3];
    const glow = l.on
      ? `<circle class="sc-glow sc-g${i}" cx="${x}" cy="${y + 6}" r="20" fill="${c}" opacity="${rcPick(n, 0.28, 0.22)}"/><path d="M${x - 7} ${y + 4} L${x - 18} ${y + 50} H${x + 18} L${x + 7} ${y + 4}Z" fill="${c}" opacity="${rcPick(n, 0.14, 0.12)}"/>`
      : "";
    return `<path d="M${x} 0 V${y}" stroke="${rcPick(n, "#8a8478", "#4a4f60")}" stroke-width=".8"/><g transform="translate(${x} ${y}) scale(1.45) translate(${-x} ${-y})">${glow}<path d="M${x - 7} ${y + 2} Q${x - 7} ${y - 6} ${x} ${y - 6} Q${x + 7} ${y - 6} ${x + 7} ${y + 2}Z" fill="${rcPick(n, "#2a3038", "#3a3f50")}"/><circle cx="${x}" cy="${y + 4}" r="3.2" fill="${l.on ? c : rcPick(n, "#d3cfc6", "#4a4f60")}"/></g>`;
  };
  const list = lamps.length ? lamps : [{ on: false }];
  return `${list.map((l, i) => one(RC_LAMP_POS[start + i], l, i)).join("")}`;
};

// Sensors: the door and its contact, the window and its contact, the motion detector (its beam and someone walking
// in when it detects), the leak puck (a puddle and a red LED on a leak), smoke under the ceiling on a smoke, CO or
// gas alarm.
const rcSceneSensors = (s, n) => {
  const leak = s.leak;
  const door = `<g transform="translate(108 76)"><rect x="-15" y="-64" width="30" height="64" fill="${rcPick(n, "#6d4c3d", "#3a3040")}"/>${
    s.door ? `<rect x="-12" y="-61" width="24" height="61" fill="${rcPick(n, "#fff4d6", "#d8c48a")}" opacity="${rcPick(n, 0.8, 0.35)}"/>` : ""
  }<g transform="translate(-12 0) scale(${s.door ? 0.42 : 1} 1) translate(12 0)"><rect x="-12" y="-61" width="24" height="61" fill="${rcPick(n, "#8a5a3a", "#4a3a30")}"/><circle cx="8" cy="-30" r="1.4" fill="#d4b26a"/></g>${rcContact(15, -50, s.door)}</g>`;
  const breeze = s.window
    ? `<g class="sc-breeze" fill="none" stroke="${rcPick(n, "#86b9de", "#5c7ea8")}" stroke-width="1.2" stroke-linecap="round"><path d="M158 26 q-8 -4 -16 0"/><path d="M158 36 q-8 -4 -16 0"/></g>`
    : "";
  const motion = `<g transform="translate(194 6)"><path d="M0 0 h-9 v7 q4.5 4.5 9 0z" fill="${rcPick(n, "#fff", "#3d475c")}" stroke="#9aa3ae" stroke-width=".6"/><circle cx="-4.5" cy="7" r="1.6" fill="${s.motion ? "#2f80ed" : "#2a3038"}"/>${
    s.motion ? '<path class="sc-pir" d="M-5 10 L-46 74 H-6Z" fill="#2f80ed"/>' : ""
  }</g>${s.motion ? rcPerson(164, 76, rcPick(n, "#5f6b7a", "#8fa3c4")) : ""}`;
  const puck = `<g transform="translate(186 76)">${leak ? '<ellipse class="sc-puddle" cx="-4" cy="0" rx="18" ry="3.6" fill="#4fb3e8" opacity=".55"/>' : ""}<ellipse rx="7" ry="2.6" fill="${rcPick(n, "#fff", "#3d475c")}" stroke="${leak ? "#e5484d" : "#9aa3ae"}" stroke-width="${leak ? 1 : 0.6}"/><circle class="${leak ? "sc-blink" : ""}" cx="3" cy="-.6" r="${leak ? 1.3 : 0.8}" fill="${leak ? "#e5484d" : "#43c463"}"/>${leak ? rcDrop(-1, -12, "#4fb3e8") : ""}</g>`;
  const smoke = s.smoke
    ? `<g class="sc-smoke" fill="${rcPick(n, "#b4b2a9", "#6a6f7a")}" opacity=".5">${[
        [124, 14, 10],
        [142, 10, 12],
        [160, 16, 10],
        [138, 22, 9],
      ]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
        .join("")}</g>`
    : "";
  return `${door}${rcWindow(140, 12, 34, 36, n, { open: s.window ? 1 : 0 })}<g transform="translate(140 12)">${rcContact(34, 12, s.window)}</g>${breeze}${smoke}${motion}${puck}`;
};

// Environment: the window (sun or moon; snow when cold, mist and drops when humid, a strong sun and its beam when
// hot), the wall sensor showing the reading that matters in its comfort colour, floating particles (a haze when
// the air is stale), a plant that wilts in the heat.
const RC_ENV_COLORS = {
  ok: ["#2e9d5a", "#e8f6ec"],
  warn: ["#d68f00", "#faeeda"],
  alert: ["#e5484d", "#fcebeb"],
  cold: ["#2f80ed", "#e6f1fb"],
};
const rcSceneEnv = (s, n) => {
  const [c, screen] = RC_ENV_COLORS[s.tone] || RC_ENV_COLORS.ok;
  const fx = s.fx;
  const hot = fx === "hot" && !n;
  const sky = hot
    ? '<circle cx="28" cy="11" r="7" fill="#ffb02e"/>'
    : n
      ? '<circle cx="28" cy="10" r="3" fill="#f3eed2"/>'
      : '<circle cx="28" cy="11" r="4" fill="#ffd65a"/>';
  const snow =
    fx === "cold"
      ? `<g fill="#fff">${[
          [6, 6],
          [12, 14],
          [24, 22],
          [32, 30],
          [8, 30],
        ]
          .map(([x, y]) => `<circle class="sc-snow" cx="${x}" cy="${y}" r="1.1"/>`)
          .join("")}</g>`
      : "";
  const mist =
    fx === "humid"
      ? `<g fill="#9fd0f3" opacity=".9">${[
          [4, 30],
          [9, 34],
          [14, 28],
          [22, 33],
          [30, 29],
          [35, 35],
        ]
          .map(([x, y]) => `<path d="M${x} ${y - 3} q-1.6 2 0 3 q1.6 -1 0 -3z"/>`)
          .join("")}</g><rect width="38" height="40" fill="#fff" opacity=".35"/>`
      : "";
  const win = `<g transform="translate(154 6) scale(1.05)"><rect width="38" height="40" rx="1.5" fill="${rcPick(n, "#cfe8f8", "#1b2f52")}" stroke="${rcPick(n, "#fff", "#4a5568")}" stroke-width="2"/>${sky}${snow}${mist}<line x1="19" y1="0" x2="19" y2="40" stroke="${rcPick(n, "#fff", "#4a5568")}" stroke-width="1.4"/></g>`;
  const air = fx === "air";
  const pts = Array.from({ length: air ? 22 : 10 }, (_, i) => [86 + ((i * 37) % 110), 8 + ((i * 23) % 56), (i % 3) * 0.5 + 0.8]);
  const parts = `<g fill="${air ? rcPick(n, "#888780", "#b0b6c2") : rcPick(n, "#9aa3ae", "#8fa3c4")}">${pts
    .map(([x, y, r], i) => `<circle class="sc-pp sc-p${i % 4}" cx="${x}" cy="${y}" r="${r}" opacity=".55"/>`)
    .join("")}</g>`;
  const haze = air ? `<g class="sc-haze"><ellipse cx="130" cy="30" rx="40" ry="18" fill="${rcPick(n, "#b4b2a9", "#8a8f9a")}" opacity=".25"/></g>` : "";
  const beam = hot ? '<path class="sc-beam" d="M154 48 L194 48 L150 80 L100 80Z" fill="#ffb02e" opacity=".3"/>' : "";
  const top = rcEsc(s.top ?? "—");
  const sensor = `<g transform="translate(126 32) scale(1.5)"><rect x="-16" y="-14" width="32" height="28" rx="5" fill="${rcPick(n, "#fff", "#3d475c")}" stroke="${s.tone === "ok" ? rcPick(n, "#c9ced6", "#55617a") : c}"/><rect x="-12" y="-10" width="24" height="12" rx="2" fill="${rcPick(n, screen, "#1d2a3a")}"/><text x="0" y="-1" text-anchor="middle" font-size="${top.length > 4 ? 7 : 8}" font-weight="700" font-family="sans-serif" fill="${c}">${top}</text>${
    s.bottom ? `<g transform="translate(-8 7)"><path d="M0 -3 q-2.4 3 0 4.4 q2.4 -1.4 0 -4.4z" fill="#4fb3e8"/></g><text x="-3" y="10" font-size="4.6" font-family="sans-serif" fill="${rcPick(n, "#5c6470", "#a0a6ae")}">${rcEsc(s.bottom)}</text>` : ""
  }<circle class="${s.tone === "ok" ? "" : "sc-blink"}" cx="11" cy="8" r="1.4" fill="${c}"/></g>`;
  const plant = `<g transform="translate(94 76) scale(1.4)"><path d="M-7 0 l-2 -11 h18 l-2 11z" fill="#c0603a"/><path class="sc-leaf" d="M0 -11 q-10 -6 -11 -20 q8 4 11 15 q2 -14 10 -18 q1 12 -10 23z" fill="${
    fx === "hot" ? rcPick(n, "#9cae4a", "#6a7a3a") : rcPick(n, "#5aa83d", "#3e7a4a")
  }"/></g>`;
  return `${win}${beam}${haze}${parts}${sensor}${plant}`;
};

// Plugs: the electrical panel (its gauge filling with the plugs on, red with a bolt on an overload), a row of plugs
// whose cords carry current when on.
const rcScenePlugs = (s, n) => {
  const total = s.total || 0;
  const hi = !!s.high;
  const breakers = [0, 1, 2, 3]
    .map(
      (r) =>
        `<rect x="4" y="${5 + r * 10}" width="26" height="7" rx="1" fill="${rcPick(n, "#eef1f5", "#2e3442")}"/>${[0, 1, 2, 3]
          .map((col) => {
            const k = r * 4 + col;
            const fill = hi && k === 5 ? "#e5484d" : k < total * 3 + 2 ? rcPick(n, "#fff", "#55617a") : rcPick(n, "#d8dde3", "#2a3040");
            return `<rect x="${6 + col * 6}" y="${6 + r * 10}" width="4" height="5" rx=".8" fill="${fill}" stroke="#9aa3ae" stroke-width=".4"/>`;
          })
          .join("")}`,
    )
    .join("");
  const panel = `<g transform="translate(96 8)"><rect width="34" height="56" rx="3" fill="${rcPick(n, "#fff", "#3a4050")}" stroke="${hi ? "#e5484d" : rcPick(n, "#c9ced6", "#4a5568")}" stroke-width="${hi ? 1.4 : 1}"/>${breakers}<rect x="4" y="46" width="26" height="5" rx="2" fill="${rcPick(n, "#e3e8ef", "#2a3040")}"/><rect x="4" y="46" width="${[3, 10, 18, 26][Math.min(3, total + (hi ? 1 : 0))]}" height="5" rx="2" fill="${hi ? "#e5484d" : "#43a047"}"/>${
    hi ? '<path class="sc-blink" d="M30 -6 l-6 9 h5 l-3 8 l8 -10 h-5 l3 -7z" fill="#e5484d"/>' : ""
  }</g>`;
  const plugs = [150, 172, 194]
    .map((x, i) => {
      const on = !!s.on?.[i];
      const led = on ? (hi && i === 0 ? "#e5484d" : "#43c463") : "#9aa3ae";
      const cord = on
        ? `<path d="M0 9 V26" stroke="#5f6b7a" stroke-width="2.2"/><path class="sc-flow" d="M0 9 V26" stroke="${hi && i === 0 ? "#e5484d" : "#f5b400"}" stroke-width="1.1"/>`
        : "";
      return `<g transform="translate(${x} 44)"><rect x="-10" y="-10" width="20" height="20" rx="4" fill="${rcPick(n, "#fff", "#3d475c")}" stroke="${rcPick(n, "#c9ced6", "#55617a")}"/><circle cx="-3.4" cy="0" r="1.5" fill="#5f6b7a"/><circle cx="3.4" cy="0" r="1.5" fill="#5f6b7a"/><rect x="-7" y="-5" width="14" height="14" rx="3.4" fill="${rcPick(n, "#f6f8fa", "#55617a")}" stroke="#9aa3ae" stroke-width=".6"/><circle class="${on ? "sc-blink" : ""}" cx="4" cy="-1" r="1.3" fill="${led}"/>${cord}</g>`;
    })
    .join("");
  return `${panel}<path d="M130 70 H200" stroke="${rcPick(n, "#d3cfc6", "#3a4050")}" stroke-width="2"/>${plugs}`;
};

// Overview: a cutaway house (two floors, four rooms: bedroom, bathroom, living room, kitchen), each room showing the
// state of the home's room it stands for: blue and someone there (presence), a warm glow (light on), amber (open),
// red with a drip, a puddle and an alert badge (leak, smoke, CO, gas).
const RC_HOUSE_SLOTS = [
  [98, 28, 46, 22],
  [146, 28, 46, 22],
  [98, 52, 52, 26],
  [152, 52, 40, 26],
];
const rcSlotState = (slot, st, n) => {
  if (!st) return "";
  const [x, y, w, h] = slot;
  const out = [];
  if (st.alert) out.push(`<rect class="sc-alarm" x="${x}" y="${y}" width="${w}" height="${h}" fill="#e5484d" opacity="${rcPick(n, 0.2, 0.3)}"/>`);
  else if (st.warn) out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f5b400" opacity="${rcPick(n, 0.16, 0.24)}"/>`);
  else if (st.presence) out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#4fb3e8" opacity="${rcPick(n, 0.16, 0.22)}"/>`);
  if (st.light) out.push(`<ellipse class="sc-glow2" cx="${x + w / 2}" cy="${y + h / 2 + 2}" rx="${w / 2 - 2}" ry="${h / 2 + 1}" fill="#ffd27a" opacity="${rcPick(n, 0.3, 0.4)}"/>`);
  if (st.presence) {
    const px = x + Math.round(w * 0.74);
    const py = y + h - 6;
    out.push(
      `<g transform="translate(${px} ${py})"><circle cy="-8" r="2.6" fill="#2f80ed"/><path d="M-4 2 q0 -6 4 -6 q4 0 4 6z" fill="#2f80ed"/><circle class="sc-ping" cy="-4" r="6" fill="none" stroke="#2f80ed" stroke-width=".8"/></g>`,
    );
  }
  if (st.alert) {
    out.push(
      `${rcDrop(x + Math.round(w * 0.28), y + h - 15, "#2f80ed")}<ellipse cx="${x + Math.round(w * 0.45)}" cy="${y + h - 1}" rx="9" ry="1.2" fill="#4fb3e8" opacity=".85"/>`,
    );
  }
  if (st.alert || st.warn) {
    const bx = x + w - 4;
    const by = y + 4;
    out.push(
      `<circle class="sc-blink" cx="${bx}" cy="${by}" r="3.2" fill="${st.alert ? "#e5484d" : "#f5b400"}"/><path d="M${bx} ${by - 1.8} v2.2 M${bx} ${by + 1.6} v.3" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>`,
    );
  }
  return out.join("");
};
const rcSceneHouse = (s, n) => {
  const wall = rcPick(n, "#f3ead9", "#3a3f4c");
  const edge = rcPick(n, "#8a7a66", "#596273");
  const inner = rcPick(n, "#fbf6ec", "#262b38");
  const fl = rcPick(n, "#c99a6b", "#4a4238");
  const slots = s.slots || [];
  const room = ([x, y, w, h], c) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c || inner}"/><rect x="${x}" y="${y + h - 2}" width="${w}" height="2" fill="${fl}"/>`;
  const sky = n
    ? `${rcStars([
        [12, 8],
        [44, 18],
        [96, 6],
        [132, 24],
        [168, 10],
        [188, 30],
        [70, 30],
      ])}<circle cx="70" cy="14" r="5.5" fill="#f3eed2"/><circle cx="72.5" cy="12" r="4.5" fill="${RC_WALLS.none[1]}"/>`
    : `<circle cx="70" cy="14" r="9" fill="#ffd65a" opacity=".28"/><circle cx="70" cy="14" r="6" fill="#ffd65a"/><g fill="#fff" opacity=".9">${[
        [40, 16, 0.9],
        [196, 10, 0.6],
      ]
        .map(
          ([x, y, k]) =>
            `<path class="sc-cloud" transform="translate(${x} ${y}) scale(${k})" d="M-14,4 C-17,4 -18,0 -14.5,-1 C-14,-5 -8,-6 -6,-3 C-4,-8 4,-8 5,-2 C9,-3 12,0 10,4 Z"/>`,
        )
        .join("")}</g>`;
  const hills = `<path d="M0,80 C30,70 60,64 100,66 C140,68 170,60 200,62 L200,80Z" fill="${rcPick(n, "#a7d39f", "#1d3a4a")}"/><path d="M0,80 C40,74 90,75 200,72 L200,80Z" fill="${rcPick(n, "#86c27f", "#17303d")}"/>`;
  const lamp = slots[2]?.light ? rcPick(n, "#ffcf6b", "#ffd27a") : rcPick(n, "#d8cfc1", "#5a6070");
  const decor = `<g fill="${rcPick(n, "#9c8f7c", "#7d8ca3")}"><rect x="102" y="42" width="22" height="6" rx="2"/><rect x="102" y="39" width="6" height="4" rx="1.5" fill="${rcPick(n, "#fff", "#9aa8bd")}"/></g>
<g fill="${rcPick(n, "#b9c6cf", "#8fa3c4")}"><path d="M152 46 h18 v-6 q0 -4 -4 -4 h-10 q-4 0 -4 4z"/><rect x="178" y="34" width="8" height="12" rx="1"/></g><path d="M182 34 v-3 h-4" stroke="${rcPick(n, "#7d8a94", "#8fa3c4")}" stroke-width="1.2" fill="none"/>
<g fill="${rcPick(n, "#b19b80", "#7d8ca3")}"><rect x="104" y="68" width="30" height="8" rx="3"/><rect x="104" y="64" width="6" height="8" rx="2"/></g><path d="M140 76 V62" stroke="${rcPick(n, "#6b5d4d", "#8fa3c4")}" stroke-width="1"/><path d="M135 62 h10 l-2 -6 h-6z" fill="${lamp}"/>
<g fill="${rcPick(n, "#c9bfae", "#6b7586")}"><rect x="156" y="66" width="32" height="10"/><rect x="160" y="56" width="10" height="6" rx="1"/></g><rect x="174" y="58" width="8" height="8" rx="1" fill="${rcPick(n, "#cfe8f8", "#1b2f52")}"/><path d="M166 66 v-4 h-3" stroke="${rcPick(n, "#7d8a94", "#8fa3c4")}" stroke-width="1.2" fill="none"/>`;
  return `${sky}${hills}<rect x="170" y="2" width="8" height="16" fill="${rcPick(n, "#a0503a", "#4a3a36")}"/>
<path d="M90 26 L145 3 L200 26Z" fill="${rcPick(n, "#c46b4e", "#5a3a36")}"/><path d="M90 26 L145 3 L200 26" fill="none" stroke="${rcPick(n, "#9a4a32", "#3a2624")}" stroke-width="1.6" stroke-linejoin="round"/>
<rect x="94" y="25" width="102" height="55" fill="${wall}"/>
${room(RC_HOUSE_SLOTS[0])}${room(RC_HOUSE_SLOTS[1], rcPick(n, "#e9f5f7", "#22343f"))}${room(RC_HOUSE_SLOTS[2], rcPick(n, "#fff3d6", "#3a3424"))}${room(RC_HOUSE_SLOTS[3])}
${decor}${RC_HOUSE_SLOTS.map((slot, i) => rcSlotState(slot, slots[i], n)).join("")}
<rect x="94" y="25" width="102" height="55" fill="none" stroke="${edge}" stroke-width="1.4"/><path d="M94 51 H196 M145 25 V51 M151 51 V80" stroke="${edge}" stroke-width="1.4"/>`;
};

const RC_THEMES = { lights: rcSceneLights, sensors: rcSceneSensors, environment: rcSceneEnv, plugs: rcScenePlugs, overview: rcSceneHouse };

// The whole picture: { wall, floor, svg } for the card's theme, its room type and state `s`, by day or night `n`.
const rcScene = (theme, type, s, n) => {
  const room = theme === "lights" || theme === "overview" ? "none" : type;
  const svg = `<svg class="rc-scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">${rcGhost(room, n)}${RC_THEMES[theme](s, n)}</svg>`;
  const wall = (RC_WALLS[room] || RC_WALLS.none)[n ? 1 : 0];
  // Every light off: the room a little darker.
  const dim = theme === "lights" && !(s.lamps || []).some((l) => l.on);
  return {
    wall: dim ? `color-mix(in srgb, ${wall} ${n ? 82 : 94}%, #000)` : wall,
    floor: theme === "overview" ? "lawn" : theme === "lights" ? "parquet" : rcFloorOf(room),
    svg,
  };
};

// ── Styles ───────────────────────────────────────────────────────────────────
// The banner sits edge to edge at the top of the card (over the card's 12 px padding), 90 px high on the full and the
// mini cards. The scene is 200 × 80 at the right (at most 54 % of the card, none under 300 px), over the 10 px floor.
const RC_BANNER_STYLES = `
  .banner { position: relative; height: 90px; margin: -12px -12px 0; overflow: hidden; color: #1d2733;
            --rc-sub: #4a5a6c; --rc-scene-w: min(200px, 54%); }
  .banner.night { color: #fff; --rc-sub: rgba(255,255,255,.78); }
  .banner:not(:has(~ :not([hidden]))) { margin-bottom: -12px; }
  .rc-scene { position: absolute; right: 0; bottom: 10px; height: 80px; width: var(--rc-scene-w); }
  .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; }
  .g-parquet { background: repeating-linear-gradient(90deg, #c99a6b 0 38px, #b98a5c 38px 40px); box-shadow: inset 0 2px 0 #a97c50; }
  .night .g-parquet { background: repeating-linear-gradient(90deg, #4a3a2c 0 38px, #3e3024 38px 40px); box-shadow: inset 0 2px 0 #5c4836; }
  .g-tiles { background: repeating-linear-gradient(90deg, #d9dfe3 0 18px, #c6cdd2 18px 19px); box-shadow: inset 0 2px 0 #b8c0c6; }
  .night .g-tiles { background: repeating-linear-gradient(90deg, #3a4250 0 18px, #2e3542 18px 19px); box-shadow: inset 0 2px 0 #4a5262; }
  .g-concrete { background: #9aa1a9; box-shadow: inset 0 2px 0 #b5bbc2; }
  .night .g-concrete { background: #2c323b; box-shadow: inset 0 2px 0 #3a414c; }
  .g-lawn { background: repeating-linear-gradient(90deg, #5aa83d 0 22px, #6cbb4c 22px 44px); }
  .night .g-lawn { background: repeating-linear-gradient(90deg, #1f4a2a 0 22px, #245433 22px 44px); }
  /* The text: the round icon (its colour is the card's status), the title and the status, on the wall at the left. */
  .banner .head { position: absolute; z-index: 1; left: 0; top: 0; right: 0; bottom: 10px; box-sizing: border-box;
                  padding: 6px calc(var(--rc-scene-w) + 4px) 6px 12px; display: flex; align-items: center; gap: 10px; min-width: 0; }
  .banner .badge { position: relative; width: 40px; height: 40px; background: rgba(255,255,255,.62);
                   box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 24%, transparent); }
  .banner.night .badge { background: rgba(255,255,255,.12); color: color-mix(in srgb, var(--c) 78%, #fff);
                         box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .titles { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .banner .title { flex: none; min-width: 0; color: inherit; font-size: 16px; font-weight: 500; line-height: 1.25; }
  :host([hide-title]) .banner .title { display: none; }
  .sub { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 6px; min-width: 0; font-size: 13px; line-height: 18px; color: var(--rc-sub); }
  /* The status pill right after the title (8 px), centred on it, in the badge's colour on a frosted tint: the title is
     cut first (about four letters kept); when the pill would be cut (measured by the card) or on a narrow card, it
     goes on a line of its own under the title; under 200 px only its dot shows (its text stays in its title). */
  .banner .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .banner .trow > .title { flex: 0 100 auto; min-width: 4.5ch; }
  .banner .trow > .pill, .banner .trow > .st { all: unset; flex: 0 1 auto; min-width: 0; max-width: 51%; box-sizing: border-box; position: relative;
                               display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px;
                               font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; overflow: hidden;
                               background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .trow > .pill, .banner.night .trow > .st { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .trow > .pill .pt, .banner .trow > .st .pt { position: static; width: auto; height: auto; clip-path: none; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .banner .trow > .pill:not(.action)::before, .banner .trow > .st:not(.action)::before { content: ""; flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
  .banner .trow > .pill.action ha-icon, .banner .trow > .st.action ha-icon { --mdc-icon-size: 12px; flex: none; margin-left: -2px; color: var(--c); }
  .banner .trow > .pill.action, .banner .trow > .st.action { cursor: pointer; }
  .banner .trow > .pill.action:hover, .banner .trow > .st.action:hover { background: color-mix(in srgb, var(--c) 28%, rgba(255,255,255,.85)); }
  .banner.night .trow > .pill.action:hover, .banner.night .trow > .st.action:hover { background: color-mix(in srgb, var(--c) 40%, rgba(8,18,38,.6)); }
  .banner .trow > .pill.action:focus-visible, .banner .trow > .st.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .banner[data-wrap] .trow { display: contents; }
  .banner[data-wrap] .trow > .pill, .banner[data-wrap] .trow > .st { order: 9; align-self: flex-start; max-width: calc(100cqw - 80px); margin-top: 1px; }
  /* The overviews' header also holds a row or two of counters: a narrower scene leaves them room, and their pill stays
     beside the title on a narrow card as long as it fits (measured). */
  .banner:has(.hchips) { --rc-scene-w: min(200px, 40%); }
  /* Their wrapped pill leads the counters' row rather than taking a line of its own. */
  .banner[data-wrap]:has(.hchips) .titles { flex-flow: row wrap; align-items: center; align-content: center; gap: 4px; }
  .banner[data-wrap]:has(.hchips) .trow > .title { flex: 1 0 100%; }
  .banner[data-wrap]:has(.hchips) .trow > .pill { order: 1; align-self: center; margin: 0; }
  .banner[data-wrap] .hchips { display: contents; }
  .banner[data-wrap] .hchips > * { order: 2; }
  @container (max-width: 260px) {
    .banner:not(:has(.hchips)) .trow { display: contents; }
    .banner:not(:has(.hchips)) .trow > .pill, .banner:not(:has(.hchips)) .trow > .st { order: 9; align-self: flex-start; max-width: calc(100cqw - 80px); margin-top: 1px; }
  }
  @container (max-width: 200px) {
    .banner .trow { display: flex; }
    .banner .trow > .pill, .banner .trow > .st { order: 0; flex: none; align-self: auto; margin: 0; padding: 0 4px; background: none; }
    .banner .trow > .pill .pt, .banner .trow > .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  }
  /* The detail / expand / collapse button: 24 px, round, frosted, 5 px from the banner's top right corner; the scene
     steps aside to leave it room. */
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner .zoom ha-icon { --mdc-icon-size: 16px; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .zoom:hover { color: #33506b; background: rgba(255,255,255,.75); }
  .banner.night .zoom:hover { color: #fff; background: rgba(255,255,255,.22); }
  .banner:has(.zoom) .rc-scene { right: 30px; }
  .banner:has(.zoom) .head { padding-right: calc(var(--rc-scene-w) + 34px); }
  .banner .head.head { flex-wrap: nowrap; gap: 10px; }
  .banner .head::after { content: none; }
  .banner .hchips { order: 0; flex: none; display: flex; flex-wrap: wrap; gap: 4px; padding-left: 0; margin-top: 2px; }
  /* Chips on the wall (the overviews' counters): a light glass behind them. */
  .banner .chip { background: rgba(255,255,255,.6); }
  .banner.night .chip { background: rgba(10,20,40,.45); }
  /* A narrow card: no room for the scene beside the text, the wall and the floor stay. */
  @container (max-width: 300px) { .rc-scene { display: none; } .banner, .banner:has(.hchips) { --rc-scene-w: 30px; } .banner:has(.zoom) .head { padding-right: 34px; } }
  ha-card > .banner + .grid, ha-card > .banner + .rs { margin-top: 10px; }
  .rc-scene .sc-blink { animation: sc-blink 1.2s steps(2) infinite; }
  .rc-scene .sc-flow { stroke-dasharray: 3 4; animation: sc-flow 1s linear infinite; }
  .rc-scene .sc-drip { animation: sc-drip 1.6s ease-in infinite; }
  .rc-scene .sc-glow { transform-box: fill-box; transform-origin: center; animation: sc-glow 3s ease-in-out infinite; }
  .rc-scene .sc-g1 { animation-delay: -1s; } .rc-scene .sc-g2 { animation-delay: -2s; }
  .rc-scene .sc-glow2 { animation: sc-glow2 4s ease-in-out infinite; }
  .rc-scene .sc-alarm { animation: sc-blink-soft 1.4s ease-in-out infinite; }
  .rc-scene .sc-breeze path, .rc-scene .sc-haze { animation: sc-wave 3s ease-in-out infinite; }
  .rc-scene .sc-pir { opacity: .14; animation: sc-pir 2s ease-in-out infinite; }
  .rc-scene .sc-puddle { transform-box: fill-box; transform-origin: center; animation: sc-puddle 2.4s ease-in-out infinite; }
  .rc-scene .sc-snow { animation: sc-snow 2.4s linear infinite; }
  .rc-scene .sc-pp { animation: sc-float 6s ease-in-out infinite; }
  .rc-scene .sc-p1 { animation-delay: -1.5s; } .rc-scene .sc-p2 { animation-delay: -3s; } .rc-scene .sc-p3 { animation-delay: -4.5s; }
  .rc-scene .sc-beam { animation: sc-blink-soft 5s ease-in-out infinite; }
  .rc-scene .sc-leaf { transform-box: fill-box; transform-origin: 50% 100%; animation: sc-sway 4s ease-in-out infinite; }
  .rc-scene .sc-ping { transform-box: fill-box; transform-origin: center; animation: sc-ping 2s ease-out infinite; }
  .rc-scene .sc-smoke circle { animation: sc-smoke 4s ease-in-out infinite; }
  .rc-scene .sc-cloud { animation: sc-drift 4s ease-in-out infinite alternate; }
  .rc-scene .sc-tw:nth-child(3n) { animation: sc-blink-soft 3.2s ease-in-out infinite; }
  @keyframes sc-blink { 50% { opacity: .2; } }
  @keyframes sc-blink-soft { 50% { opacity: .08; } }
  @keyframes sc-flow { to { stroke-dashoffset: -14; } }
  @keyframes sc-drip { from { transform: translateY(0); opacity: 1; } to { transform: translateY(14px); opacity: 0; } }
  @keyframes sc-glow { 50% { transform: scale(1.08); opacity: .36; } }
  @keyframes sc-glow2 { 50% { opacity: .2; } }
  @keyframes sc-wave { 50% { transform: translateX(-6px); } }
  @keyframes sc-pir { 0%, 100% { opacity: .06; } 50% { opacity: .18; } }
  @keyframes sc-puddle { 50% { transform: scaleX(1.12); } }
  @keyframes sc-snow { from { transform: translateY(-4px); } to { transform: translateY(4px); } }
  @keyframes sc-float { 50% { transform: translate(-6px, -4px); } }
  @keyframes sc-sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
  @keyframes sc-ping { from { transform: scale(1); opacity: .9; } to { transform: scale(2.6); opacity: 0; } }
  @keyframes sc-smoke { 50% { transform: translate(-4px, 2px); } }
  @keyframes sc-drift { to { transform: translateX(4px); } }
  @media (prefers-reduced-motion: reduce) { .rc-scene * { animation: none !important; } }
`;
