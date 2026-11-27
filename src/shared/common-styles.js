// ── Common styles ────────────────────────────────────────────────────────────
export const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  :host([hidden]) { display: none !important; }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* The status pill right after the title (8 px), whole, then the header's chips; the detail button at the far end. */
  .head > .title { flex: 0 1 auto; min-width: 0; }
  .head > .pill, .mini .head > .st { flex: none; margin-left: 0; }
  .head > .chip, .head > .hchips { order: 2; }
  .head > .zoom { order: 3; margin-left: auto; }
  /* Not enough room for the whole title and the pill's whole label on one line (measured by the card, see _fitPill):
     the status pill goes to a line of its own under the title (and the chips), where its whole label fits; a label
     too long even there (an empty-state sentence) wraps to a second line rather than being cut. */
  .head[data-wrap] { flex-wrap: wrap; row-gap: 4px; }
  .head[data-wrap] > .title { flex: 1 1 0; }
  .head[data-wrap]::after { content: ""; order: 4; flex: 1 0 100%; }
  .head[data-wrap] > .pill { order: 5; margin-left: 50px; max-width: calc(100% - 50px); border-radius: 10px; }
  .head[data-wrap] > .pill .pt { white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .mini .head[data-wrap] > .st { order: 5; max-width: 100%; }
  @container (max-width: 200px) {
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  /* embedded: a section of the Room card. Its header folds the section (chevron right folded, down unfolded), with a
     smaller badge; the environment readings show without their header (the Room card's banner holds the room). */
  :host([embedded]) .head.fold { cursor: pointer; border-radius: 8px; }
  :host([embedded]) .head.fold:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  :host([embedded]) .head > .badge { width: 28px; height: 28px; }
  :host([embedded]) .head > .badge ha-icon { --mdc-icon-size: 16px; }
  :host([embedded]) .title { font-size: 14px; }
  .rc-fold { order: 3; flex: none; margin-left: auto; width: 7px; height: 7px; margin-right: 4px;
          border-right: 2px solid var(--secondary-text-color); border-bottom: 2px solid var(--secondary-text-color);
          transform: translateY(-2px) rotate(45deg); transition: transform .2s; }
  :host([collapsed]) .rc-fold { transform: rotate(-45deg); }
  :host([collapsed]) ha-card > :not(.head) { display: none; }
  :host([embedded]) .mini > .badge, :host([embedded]) .mini .head { display: none; }
  :host([embedded]) .mini .body { min-height: 0; }
  @media (prefers-reduced-motion: reduce) { .rc-fold { transition: none; } }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 10px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
export const RC_ZOOM_STYLES = `
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

// Lights and plugs mini cards: the "turn everything off" status (not filled: tinted on hover, like the zoom button)
// and the chips of the entities that are off (icon alone, grey).
export const RC_TOGGLE_MINI_STYLES = `
  .st.action { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative; cursor: pointer;
               display: inline-flex; align-items: center; gap: 3px; margin-left: auto; padding: 1px 6px; border-radius: 999px;
               font-size: 11px; font-weight: 500; color: var(--c); }
  .st.action ha-icon { --mdc-icon-size: 12px; flex: none; }
  .st.action:hover { background: color-mix(in srgb, var(--c) 14%, transparent); }
  .st.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  @container (max-width: 200px) {
    .st.action { width: auto; height: auto; padding: 1px 4px; }
    .st.action::before { content: none; }
  }
  .r.off, .r.na { padding: 0 3px; }
  .r.off ha-icon, .r.na ha-icon { margin-right: 0; }
  .r.off { --t: var(--rc-idle); }
  .r.na  { --t: var(--rc-na); opacity: .7; }
  .r small { flex: none; font-size: 10px; font-weight: 400; opacity: .8; margin-left: 4px; }
`;

// Header chips of the overviews and the Room card (people there, lights on, plugs drawing power), and their row.
export const RC_CHIP_STYLES = `
      :where(button.chip) { all: unset; }
      .chip { --k: var(--rc-idle); flex: none; display: inline-flex; align-items: center; gap: 2px; height: 18px; padding: 0 5px;
              border-radius: 999px; font-size: 11px; font-weight: 500; line-height: 1; white-space: nowrap;
              color: var(--k); background: color-mix(in srgb, var(--k) 14%, transparent); }
      .head .chip { height: 20px; padding: 0 6px; font-size: 11px; }
      .chip ha-icon { --mdc-icon-size: 12px; }
      .chip:not(:has(span)) { width: 18px; padding: 0; justify-content: center; }
      .chip.warn  { --k: var(--rc-warn); }
      .chip.info  { --k: var(--rc-info); }
      .chip.light { --k: var(--rc-light); }
      .chip.plug  { --k: var(--rc-plug); }
      button.chip { cursor: pointer; transition: background .2s; }
      button.chip:hover { background: color-mix(in srgb, var(--k) 26%, transparent); }
      button.chip:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
      button.chip .off { --mdc-icon-size: 11px; margin-left: 2px; opacity: .75; }
      /* A 32 px tall touch target around the 20 px header chips, without changing how they look. */
      .head button.chip { position: relative; }
      .head button.chip::before { content: ""; position: absolute; inset: -6px -3px; }
      .hchips { flex: none; display: flex; align-items: center; gap: inherit; }
      /* Narrow card: the chips go to a line of their own under the title, which keeps the first line (title, status,
         detail button) readable; they wrap there if they still do not fit. */
      @container (max-width: 420px) {
        .head { gap: 6px; flex-wrap: wrap; }
        .hchips { order: 2; flex: 1 0 100%; flex-wrap: wrap; box-sizing: border-box; padding-left: 46px; }
        .head > .zoom { order: 1; }
      }
`;

// The overviews' room grid: the tiles, their icon, chips row, empty state and details panel. Each overview sets the
// tile's default tint and its own levels (`.room { --t: … }`, `.room.lvl-…`), the chips' spacing and the panel extras.
export const RC_ROOM_GRID_STYLES = `
  .grid { display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  @container (max-width: 340px) { .grid:not(.fixed) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  /* A card this narrow (6 columns of the Sections view on a phone): one room per row, whatever the columns option. Two
     left the name a letter or two ("B…") and pushed a chip out of its tile. */
  @container (max-width: 260px) { .grid.grid { grid-template-columns: minmax(0, 1fr); } }
  .grid[hidden] { display: none; }
  .room { all: unset; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: grid; grid-template-columns: 26px minmax(0, 1fr); grid-template-areas: "ic name" "ic state" "chips chips";
          column-gap: 7px; align-items: center; align-content: start; padding: 6px 7px; border-radius: 10px;
          background: var(--secondary-background-color, transparent); border: 1px solid transparent;
          transition: background .2s, border-color .2s; }
  /* Tile B look: the background stays neutral at every level — the state reads from the tinted icon badge, the
     coloured state line and the chips (an alert shows red without tinting the whole tile). */
  .room:hover { background: color-mix(in srgb, var(--t) 13%, var(--secondary-background-color, transparent)); }
  .room:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .room.sel { border-color: color-mix(in srgb, var(--primary-color) 55%, transparent); }
  .room .ic { grid-area: ic; align-self: start; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
              color: var(--t); background: color-mix(in srgb, var(--t) 16%, transparent); }
  .room.lvl-ok .ic { color: var(--primary-text-color); background: color-mix(in srgb, var(--rc-idle) 14%, transparent); }
  .room .ic ha-icon { --mdc-icon-size: 15px; }
  .room .name { grid-area: name; }
  /* The state (a sentence: "Water leak", "Too humid +1") wraps between its words only; a word too long for its line
     ends with "…" rather than being broken ("Pr|es|en|ce"). */
  .room .state { grid-area: state; overflow-wrap: normal; overflow: hidden; text-overflow: ellipsis; }
  .room:not(.lvl-ok) .state { color: var(--t); }
  .chips { grid-area: chips; display: flex; flex-wrap: wrap; }
  .chips:empty { display: none; }
  .empty { grid-column: 1 / -1; padding: 12px; text-align: center; font-size: 13px; color: var(--secondary-text-color); }
  .panel { margin-top: 8px; border-radius: 12px; overflow: hidden; background: var(--secondary-background-color, transparent);
           --ha-card-background: transparent; --card-background-color: transparent;
           --ha-card-box-shadow: none; --ha-card-border-width: 0; }
  .panel[hidden] { display: none; }
  /* The unfolded room cards are custom elements with no display of their own: inline, the separator between them
     (border-top) would only paint on an empty first line box around their block <ha-card>. */
  .panel > * { display: block; }
  @media (prefers-reduced-motion: reduce) { .room { animation: none; transition: none; } }
`;

export const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 18px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
