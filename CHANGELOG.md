# Changelog

## 1.24.2 - 2026-11-14

### Fixes
- Sensors card, Sensors mini card and Overview: smoke, carbon monoxide and gas detectors (`smoke`, `carbon_monoxide`, `gas`) read *Closed* / *Open*. They now show Home Assistant's own state (*Clear* / *Detected*), with the right icon, and are found in the room without `include`. An active detector is an alarm like a water leak: listed first, red and blinking, and the status names it (*Smoke detected*, *Carbon monoxide*, *Gas detected*), the most serious first. Reported in juju35/ha-public-transport#4.
- The new texts in the 22 languages.

## 1.24.1 - 2026-11-14

### Fixes
- Sensors card and Sensors mini card visual editors: `outdoor` was missing. The editor now offers it, showing the guess from the area name while it is unset and writing it only when changed; its label and help text in the 22 languages.

## 1.24.0 - 2026-11-13

### Features
- **Lights card scenes**: the scenes of the room show under the lights, in a *Scenes* section folded until its title is tapped and folded back by a click anywhere else (or when the card leaves the page). One chip per scene, a tap activates it (`scene.turn_on`).
- **Philips Hue**: Hue scenes with no area of their own are found by their Hue room (`group_name`) when it has the area's name, their names lose the room's name, and a dynamic scene starts with its colours moving (`hue.activate_scene` with `dynamic: true`).
- `show_scenes: false` hides the scenes, `scenes` lists them by hand (scene IDs, or `{entity, name, icon}`), both in the visual editor; the mini card shows them once zoomed in.
- The new texts in the 22 languages.
- README: a *Supported integrations* section (Philips Hue, IKEA TRÅDFRI).

## 1.23.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so what a click elsewhere folds (unfolded sections, the detailed view of the mini card, popups) stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state.
- A click could do nothing: Home Assistant updates the card several times a second, and a rewrite of the card between the press and the release replaced the element pressed, so that the click was lost. The card is no longer rewritten while a press is in progress; the pending update is drawn right after the click.
- No focus ring after a mouse click or a tap: the focus is kept across updates only for the keyboard.

## 1.23.0 - 2026-11-12

### Features
- `show_title` option (also in the visual editor) hides the header's title on every room card, the status pill and buttons keeping their place, for a card placed under a section heading of its own (asked in juju35/ha-vehicle-card#72).

## 1.22.4 - 2026-11-11

### Fixes
- Sensors and Overview cards: the motion and presence detections of cameras are no longer left out — a room whose only presence sensor is a camera now shows its motion, person and line crossing detections. Pet detections never count; vehicle detections count only in outdoor rooms (*Terrasse*, *Jardin*, *Garden*…, guessed from the area name), and `outdoor: true` / `false` sets it on the Sensors card and in the Overview's `rooms` entries.

## 1.22.3 - 2026-11-09

### Improvements
- Environment card: a tile's tooltip gives the lowest and highest values of its 24 h curve (*Temperature — 21.4 °C · 24 h 19.8 °C – 22.6 °C*): the curve shows the trend but has no scale. A tap still opens the reading's history.

## 1.22.2 - 2026-11-09

### Fixes
- Environment card: the 24 h curve takes the lower half of its tile, under the value and gauge, instead of the whole tile where it crossed the name and the icon.

### Documentation
- The environment screenshots show the 24 h curves: the screenshot harness can now answer the recorder (`ws` option), the environment script with a day of 5-minute means.

## 1.22.1 - 2026-11-09

### Maintenance
- No code change: released again to check the installation from the Marketplace.

## 1.22.0 - 2026-11-09

### Features
- Environment card: each tile draws the last 24 hours of its reading as a faint curve behind it (`show_history`, on by default; also in the zoomed-in mini card). One recorder statistics query (5-minute means) covers every tile and is refreshed at most every 5 minutes; sensors without statistics simply get no curve.

## 1.21.1 - 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 1.21.0 - 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (322 KB → 157 KB) and each other language is its own `ha-room-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 1.20.0 - 2026-11-08

### Features
- Environment card and mini card: unavailable or unknown sensors are no longer dropped silently but shown as a muted *N unavailable* tile or chip that lists them and opens the first one.
- Lights card: dimming with ← / → updates the bar and the label at once and sends a single brightness call when the key is released or 300 ms after the last step, and a held arrow steps at a limited pace.

## 1.19.0 - 2026-11-07

### Features
- Sensors card and Overview: an unavailable leak or opening sensor is no longer counted as all-clear: the room warns with *N unavailable*, `hide_when_clear` keeps the card shown, and the Overview keeps the room among those needing a look.
- Lights and Plugs cards: from the keyboard, Shift+Enter or the context-menu key opens a tile's details, and ← / → dim a dimmable light by 10 %; the focused tile keeps the focus when the card redraws.
- Powers follow the card's language (*1,2 kW* in French).

## 1.18.0 - 2026-11-07

### Features
- New Lights mini card (`custom:room-lights-mini-card`): the lights of a room on two lines, with how many are on out of the total (*2/4 on*), a button to turn them all off and a zoom to the full Lights card.
- New Plugs mini card (`custom:room-switch-mini-card`): the plugs of a room on two lines, with how many are on out of the total, their power draw (*2/4 on · 1.2 kW*), an optional button to turn them all off and a zoom to the full Plugs card.

## 1.17.11 - 2026-11-04

### Documentation
- README: images and links use absolute URLs, so the screenshots, icons, badges and links display in HACS (relative paths broke there).
- README: screenshots get a display size, so cards no longer show oversized in HACS and on GitHub.

## 1.17.10 - 2026-11-04
### Features
- Added Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek translations (`ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv`, `el`) for every card and visual editor, with *Română*, *Dansk*, *Svenska*, *Български*, *Русский*, *Українська*, *Magyar*, *Slovenčina*, *Čeština*, *Slovenščina*, *Latviešu* and *Ελληνικά* in the editor's language list. Romanian doors and windows take the feminine state (*Deschisă*, *Închisă*).

## 1.17.9 - 2026-11-02
### Fixes
- Mini cards: the header icon keeps its full size (40 px, icon 24 px) in the compact view, like the full card.

## 1.17.8 - 2026-11-01
### Fixes
- Overview: on a narrow card (6 columns of a Sections view, or a phone in a masonry view: up to about 445 px) the title no longer disappears, the status (*Water leak*) is no longer cut down to "…" and the detail button no longer slides out of the card: the header's totals (occupied rooms, lights, plugs) move to a line of their own under the title, power icons included.
- Every card: the status pill shows its whole label (*Ready*, *Water leak*) whenever there is room for it, the title giving way first; the title always keeps a few letters (ending with "…"), and the pill only shrinks with an ellipsis when the room really runs out, instead of pushing the buttons out. On a card of 260 px or less (6 columns on a phone) the pill moves to a line of its own under the title, where its whole label fits (*Włączone: 4 · 1.3 kW*, *Za wilgotno +2*). Below 200 px the status shows as its coloured dot, its text kept in the tooltip and for screen readers.
- Mini cards: the smallest width in a Sections view is now 6 columns (was 4: about 104-121 px on a phone, where the zoom button left the card). Zoomed in on a phone, the full card's header uses the mini badge size and leaves out its side chip (presence, shown on its tile anyway), so the title, status and zoom button fit.
- Mini cards: a long sensor name in a chip now ends with "…" inside the card instead of being cut off at its edge.
- Sensors, lights, plugs and environment cards: a reading is never cut any more (*1,380 ppm*, *24.6 °*, *Open for 12 min*): on a narrow tile it goes on to a second line, and a card of 260 px or less (6 columns on a phone) shows one tile per row; under 200 px the environment tiles also drop their icon.
- Overview and environment overview: on a card of 260 px or less (6 columns of a Sections view on a phone) the rooms show one per row, whatever the `columns` option, and at most two per row up to 340 px: the room name no longer drops to a letter (*B…*) and the power or CO₂ chip (*1.2 kW*, *1,380 ppm*) no longer runs out of its tile. A room's state (*Water leak*, *Too humid +1*) wraps between its words instead of being broken inside them (*Pr|es|en|ce*); a word too long for its line ends with "…".
- Overview and environment overview: in a wrapper sized by its content (layout-card, button-card, a grid's `auto` column) the card no longer shrinks to a sliver. Every card shrinks with its column in a grid card, a horizontal stack or a layout-card `1fr 1fr` grid, wrapped or not, instead of overflowing it.
- Focus: after the plugs confirmation opens or the zoom button is redrawn, the focus moves without scrolling the dashboard.
- Serbian: counts now use the right form for 1, 2-4 and 5+ (*2 uključene*, *5 uključenih*, *Isključiti ove 2 utičnice?*) instead of "uključeno/ih"; a light's state is neuter (*Uključeno*, like *svetlo*); the editors' exclusion lists read *Izostavi …* rather than "… za isključivanje" (which read as "to turn off").

### Maintenance
- CI: Biome 2.6.4 for the pre-commit hook, `biome.json` and the Lint workflow.
- Screenshots: the `ha-icon` stand-in takes its display from a `:host` rule, like Home Assistant's, so the cards' rules hiding an icon apply in the captures.
- Changelog: 1.17.5 is dated 2026-11-01, the day it was released.
- Screenshots: a capture or an animation is only rewritten when its decoded pixels change (PNG and GIF bytes vary from one run or machine to the next), and the GIFs use a fixed palette and ordered dithering, so an unchanged picture no longer shows up as a change to commit.
- Tests: every card is rendered in Chromium (when installed) in an inline-block, a grid's `auto` column and a `1fr 1fr` grid at 320, 360 and 500 px, directly and wrapped in a `<div>`; the screenshot comparison is checked on every colour channel, not only the alpha.

## 1.17.7 - 2026-11-01
### Features
- Added Italian, Dutch, European Portuguese and Polish translations (`it`, `nl`, `pt`, `pl`) for every card and visual editor, with *Italiano*, *Nederlands*, *Português (Portugal)* and *Polski* in the editor's language list. `pt-BR` uses the European Portuguese texts.

## 1.17.6 - 2026-11-01
### Features
- Serbian translations, in Cyrillic (`sr`) and Latin (`sr-Latn`) script, for every card and visual editor, with both options in the editor's language list. Serbian translations by @cpmarexel2f (#35)

### Fixes
- Language: a full language tag the cards have is now used as is (`sr-Latn` when Home Assistant is in Serbian Latin), else its base language (`fr-FR` → `fr`, `de-CH` → `de`), else English.

## 1.17.5 - 2026-11-01
### Fixes
- Overview: the room details (Sensors, Lights, Plugs) are now separated by a line; in Home Assistant the three cards ran together with no visible separation.

### Maintenance
- Overview: the plain-list fallback for the room details (meant for a missing room card, which the bundle always ships) is removed, with its unused translations.
- Screenshots: the `ha-card` stand-in honours the `--ha-card-*` variables like Home Assistant's, so the room-details captures show what the dashboard draws.
- CI: one Biome version (2.6.3) for the pre-commit hook, `biome.json` and the Lint workflow, which now reads it from `.pre-commit-config.yaml`.

## 1.17.4 - 2026-10-29
### Fixes
- Visual editors: the help text of *Rooms* on the Environment overview now mentions the per-room `thresholds`, and the help text of *Entities* on the Plugs card mentions `power` (the entity of the plug's power sensor), two keys the cards already read but the editor did not tell about.

## 1.17.3 - 2026-10-29
### Fixes
- Environment overview: the header's average temperature no longer mixes °C and °F when rooms report in different units (e.g. one thermometer shown in °F): each room's temperature is converted to Home Assistant's unit system (or, if unknown, to the first room's unit) before the mean, so 70 °F and 20 °C average to about 20.6°, not 45°.

## 1.17.2 - 2026-10-29
### Fixes
- Overview: the confirmation opened from the room details' Plugs card (with `plugs_off_button: true`) now shows the room's current power, instead of the power it drew when the room was unfolded.
- Overview: a door or window sensor added to an idle room now switches the header and the room tile from "All quiet" to "All closed" (and back when removed) at once, instead of at the next visible change.

## 1.17.1 - 2026-10-29
### Fixes
- Environment overview: in the compact view, the header's average temperature and humidity (and the room count) froze while only hidden, comfortable rooms changed; they now follow every room.
- Environment cards: sensors of one kind reporting in different units are no longer averaged together: a VOC sensor in µg/m³ and one in ppb make two readings, each on its own scale, and a °F thermometer is converted before being averaged with a °C one.
- Overview: with `plugs_off_button: true`, the turn-everything-off pill of the room details' Plugs card now asks for the same confirmation as the header's plugs chip, instead of turning the plugs off at once.
- Plugs: a power sensor that had no state yet when the dashboard opened (integration still loading after a restart) is now picked up as soon as it reports, instead of after the next entity registry change.
- Visual editors: switching the language now translates the field labels and help texts too, not only the select options.
- Sensors card: the "since" labels (*5 min*, *2 h*…) now move every minute, even when no state changes.
- Translations: Spanish light tiles say *Encendida* / *Apagada* (feminine, like the header's "1 encendida"); Spanish "indicador de estado" and "conmutador de red", German day abbreviation "Tg.".

### Maintenance
- CI: the Screenshots workflow checks out fork pull requests safely, fails clearly when its apt installs fail three times, and re-runs on `package.json` / `package-lock.json` changes; the `playwright` range matches the lock.
- CHANGELOG: every section is dated.
- Overviews: the room tap, the open room's fold / unfold and the outside-click folding are shared by the Overview and the Environment overview (one `rcRoomsPanel` mixin) instead of duplicated; same behaviour, now tested for both.
- CI: the screenshots commit, pushed with `GITHUB_TOKEN` (which starts no `pull_request` run), now re-runs Lint, Validate and HACS on the pull request branch through `workflow_dispatch`.

## 1.17.0 - 2026-10-28
### Changes
- German and Spanish translations: every card (sensors, lights, plugs, environment, overviews) and its visual editor now speak German (`de`) and Spanish (`es`), picked from the Home Assistant language or forced with `language: de` / `language: es`; **Deutsch** and **Español** join the editor's language selector. In Spanish, doors and windows take the feminine state (*Abierta* / *Cerrada*), as in French.

## 1.16.1 - 2026-10-28
### Fixes
- Environment overview editor: the **exclude** field only listed the first sensor of each averaged reading; it now lists every sensor behind the reading, so a second thermometer skewing a mean can be excluded from the editor.
- Press and hold: a card removed mid-press (dashboard change, view switch) no longer opens a more-info dialog 500 ms later.

### Maintenance
- Shared helpers for the power-sensor lookup (now memoized per entity registry instead of rescanned on every render), the `navigation_path` wiring, the mini cards' zoom button and the overviews' room grid; shared editor strings move to the common i18n table.
- README: new **Animations** section with three GIFs (open sensors blinking, water-leak badge pulsing, drag-to-dim), and the manual HACS install path updated for HACS 2.
- CI: releases are gated on the tests, a new **Screenshots** workflow refreshes the README images, `hacs/action` is pinned on a release tag, and the unused ruff tooling is gone.

## 1.16.0 - 2026-10-26
### Fixes
- Overview: on a room both leaking *and* with a single opening, the tile's openings chip always used the plural i18n key `open_many`, showing "1 ouvertures" in French instead of "1 ouverture". The key is now chosen by count (`open > 1 ? open_many : open_one`), as everywhere else in the code.

## 1.15.0 - 2026-10-26
### Changes
- Header icon sized like the other ha-* cards: the round badge of the full cards and the overviews grows from 36px to 40px with a 24px icon; the mini cards keep their 32px badge, with a 20px icon.
- Mini cards (sensors and environment): the room name is 16px / 500 / 1.25 like the full cards' title (it was 14px on an 18px line); a long name still ends with an ellipsis.
- Header spacing like the other ha-* cards: the tiles start 8px under the header (it was 10px on the sensors, lights, switch and environment cards), and the mini cards' badge sits 12px from the top-left corner (it was 8px / 10px, centred on the row).
- Overview: the **Turn off** button of the plug confirmation is tinted with the primary color instead of filled.

## 1.14.1 - 2026-10-25

### Fixes
- Environment cards: the noise thresholds were too low — normal conversation or the TV made a room *Noisy*. A room is now noisy from 70 dB (vacuum, loud TV) and very noisy from 85 dB (where long exposure harms hearing): `[70, 85]` instead of `[55, 70]`. Set your own with `thresholds: { noise: [...] }`.
- Environment cards: outdoors (*Terrasse*, *Jardin*, *Balcon*…), noise is information only, like temperature and humidity: street noise no longer makes a terrace *Noisy*, unless you set `noise` thresholds.

## 1.14.0 - 2026-10-25

### Changes
- Visual editors: every option of every card is now in its editor. A folded **Advanced** section holds the `language` (Automatic, English, Français) and, edited as YAML, `entities` (room cards), `thresholds` (Environment cards) and `rooms` (overviews).
- Sensors and Sensors mini cards: `navigation_path` (tap the title to open a dashboard) in the editor, as on the other room cards.
- Mini cards: `columns` in the editor (columns of the zoomed-in view); Environment mini: `show_gauge` too.

### Fixes
- Environment cards: an outdoor area (*Terrasse*, *Jardin*, *Balcon*, *Patio*, *Extérieur*, *Terrace*, *Garden*, *Balcony*, *Outdoor*…, found from its name) no longer shows *Too cold* at 15 °C: its temperature and humidity are information only, unless you set `thresholds` for them.

### Maintenance
- Tests checking that each editor offers every option of its card, and the outdoor areas (58 tests in all).

## 1.13.0 - 2026-10-25

### Changes
- Every card with a zoom or detail button — Sensors mini, Environment mini, Overview, Environment overview — goes back to its compact view on a click anywhere else, as an unfolded room already did. Clicks inside the card or in a dialog opened from it (more-info) leave it as it is.

## 1.12.0 - 2026-10-25

### Changes
- Overview and Environment overview: only the rooms needing attention show — something open, on or detected on the Overview, a reading out of the comfort range on the Environment overview. A **detail** button at the top right shows every room, and back. `zoom: false` shows every room, always, with no button.
- The `only_active` (Overview) and `only_alerts` (Environment overview) options are gone: the default view does what they did; left in YAML, they are ignored.
- Environment overview: the header averages always count every room, even the ones not shown.

## 1.11.0 - 2026-10-25

### Changes
- Sensors mini card: the compact view only shows what needs a look — open, leaking or detecting sensors. Quiet sensors show once zoomed in, so a quiet room is a single line.
- Sensors mini card: no more `only_alerts` option (it is what the compact view does); an `only_alerts` left in its YAML is ignored. The Environment mini card is unchanged: every reading, with `only_alerts` as before.

## 1.10.0 - 2026-10-25

### What's new
- New **Sensors mini** card (`custom:room-sensors-mini-card`): the sensors of a room on two lines — room badge, title and status, then one chip per sensor (a plain icon when quiet, a tinted pill with its name when open, leaking or detecting) — with the same zoom button to the full Sensors card. Same options as the Sensors card, plus `zoom`.
- Environment mini card: a zoom button (top right) switches the card to the full Environment card — tiles, comfort words and gauges — and back. On by default; `zoom: false` removes it (also in the visual editor). `columns` and `show_gauge` shape the zoomed-in view. Zoomed in, a mini card shows every sensor or reading: `only_alerts` and `hide_when_clear` only apply to the compact view.

### Maintenance
- The mini cards share their layout, chips and zoom in `shared.js` (`rcMini`); tests for both (51 in all); the screenshot script clicks like a mouse, so no focus ring is left in the shots.

## 1.9.1 - 2026-10-25

### Fixes
- Environment cards: a bathroom, shower room or laundry (found from the room name) no longer shows *Too humid* at 61 %: humidity there is a warning from 70 % and an alert from 80 % (`[25, 35, 70, 80]`), unless you set your own `humidity` thresholds.

### What's new
- Environment overview: `thresholds` per room in `rooms` (`- area: cellar` / `thresholds: { humidity: [30, 40, 75, 85] }`), on top of the card's; the unfolded room uses them too.

## 1.9.0 - 2026-10-25

### What's new
- New **Environment overview** card (`custom:room-environment-overview-card`): one tile per room with environment sensors, coloured by the reading that needs a look first, with its temperature, humidity, CO₂ and any reading out of range; the header counts the rooms to check and shows the home's average temperature and humidity. Tap a room to unfold its Environment card. Options: `columns`, `sort`, `only_alerts`, `thresholds`, `exclude_areas`, `exclude`, `rooms`.

### Changes
- Environment cards: several sensors of the same kind in a room now make one reading, their mean, instead of one tile each.
- Environment cards: unavailable and unknown sensors are ignored (left out of the mean; a kind with no sensor left is not shown).
- Environment cards: the CO₂ label is written *CO2*, the subscript ₂ being missing from some fonts.

### Maintenance
- Room icons, room sorting, the room grid and the editor fields shared by both overviews moved to `shared.js`; tests for the means and the new card (44 in all) and its screenshots.

## 1.8.0 - 2026-10-25

### What's new
- New **Environment** card (`custom:room-environment-card`): temperature, humidity, CO₂, PM2.5, PM10, VOC, air quality index, noise and light level of a room, compact tiles with the value and a thin gauge, plus a comfort word when the reading is off. The header pill names the reading that needs a look first (*Ventilate*, *Too humid*, *Too cold*…), coloured from blue (cool) to red. Comfort thresholds can be set per kind (`thresholds`), °F and ppb sensors are handled; `only_alerts` keeps only the readings outside the comfort range. Same look, discovery rules and visual editor as the other room cards.
- New **Environment mini** card (`custom:room-environment-mini-card`): the same readings on a single line — room badge, title and status, then one chip per reading (icon and value), tinted only when the reading needs a look.

### Maintenance
- The include picker of a card can be narrowed to the entities it accepts (only environment sensors on the Environment card); tests for the new cards (40 in all) and its screenshots.

## 1.7.1 - 2026-10-25

### Fixes
- Overview: with a room unfolded, a double click on OK in the "Turn all plugs off" popup no longer also toggles the light, plug or sensor of the room details lying under the button.

### Maintenance
- Test for that case (28 in all); duplication checks run on Node 22.

## 1.7.0 - 2026-10-24

### Changes
- Overview: the "Turn all plugs off" button (`plugs_off_button`) now asks for confirmation in a small popup at the top of the card, listing every plug it will turn off with its room and power draw. OK turns them off; Cancel, Escape or a click outside does nothing. The lights button still turns the lights off at once.
- Overview: the plugs button has its own icon (`mdi:power-plug-off`) instead of the power icon of the lights button, and both header buttons are easier to tap (32 px tall hit area, same look).
- Overview on a narrow card (340 px or less): tighter header spacing and the small power icons of the header buttons are hidden, so nothing overflows.

### Fixes
- A tap on a header button is no longer lost when a plug's power reading changes during the press.
- A double click on OK in the confirmation popup no longer also hits the header or the room tile underneath.
- Pressing a tile and sliding off it cancels the press: no more-info, no toggle.
- A new `language`, `presence`, `exclude` or `plugs_off_button` set in the editor reaches the room cards already unfolded in the Overview.
- An Overview removed from the page in the middle of a press on its header no longer stays frozen once shown again.

### Maintenance
- Tests for the header buttons and the confirmation (27 in all); the screenshot script renders each capture in its own page, and the overview screenshots show the new plugs icon; lockfile synced and the duplicate-code check ignores test folders.

## 1.6.0 - 2026-10-24

### What's new
- Overview: `plugs_off_button` turns every plug off from the header, like the lights: the plugs chip becomes a button (with a power icon) that turns off every plug the card counts, and the Plugs card of the room details gets its turn-everything-off pill. Off by default, since a plug may feed a camera or a network switch: leave those out with `exclude`. In the visual editor: *“Turn all plugs off” button*.

## 1.5.0 - 2026-10-24

### Fixes
- A tap on a tile is no longer lost when the card updates between press and release (frequent on the Plugs card, whose tiles show the live power), and it no longer opens more-info by mistake.
- The Overview counts the same sensors as the Sensors card it unfolds: a door or window sensor flagged as diagnostic now shows on the room tile too.
- The Overview passes its `language` to the room cards shown in its details.
- The Overview no longer folds when you click inside the more-info dialog, and its plain list (no room card installed) refreshes when a sensor changes, for example when it becomes unavailable.
- Holding Enter on a tile no longer toggles it repeatedly, and a header with `navigation_path` can be reached and opened with the keyboard.
- A failed service call no longer leaves an error in the browser console (Home Assistant still shows its own message).
- Card size in masonry dashboards counts only the tiles shown with `only_on` / `only_alerts`, and is 0 when the card is hidden.

### Changes
- Faster updates: rooms and entities are looked up again only when the entity, device or area registries change, not on every state change, and the visual editor no longer rebuilds its form on every update.
- README: the sliding-door icon rule is described as it works (`porte_fenetre`, `baie`, `sliding` or `patio` in the entity ID); the behaviour itself is unchanged.

### Maintenance
- Shared code for the four cards (translations, editors, Lights/Plugs drawing, status line); no visible change.
- CI: actions pinned by commit SHA, read-only token permissions, Dependabot for GitHub Actions, duplicate-code annotations, and a `node --test` suite run on every push.

## 1.4.0 - 2026-10-24

### Changes
- Same compact header as the other ha-* cards: 36 px icon, 16 px title, 12 px card padding; medium weight for titles, pills, chips and room names.

### Maintenance
- README follows the common plan: Features, Configuration, Screenshots and How it works, with one sub-section per card.

## 1.3.0 - 2026-10-24

### What's new
- Overview card: tapping the lights chip of the header turns every light the card counts off (excluded rooms and entities stay as they are). On by default, `all_off_button: false` turns it into a plain counter again.

## 1.2.2 - 2026-10-24

### Fixes
- Sensors and Overview cards: *All closed* only when the room or home has door or window sensors; with only leak or presence sensors the status reads *All quiet*.

## 1.2.1 - 2026-10-24

### Fixes
- Overview card with *Hide idle rooms*: when every room is idle, the card shrinks to its header instead of saying no room was found, and the header says *All closed* again when the home has door or window sensors.

## 1.2.0 - 2026-10-24

### What's new
- `exclude` on the Overview card: entities left out of the tiles, the header totals and the room details (the Sensors, Lights and Plugs cards unfolded for a room get the same exclusions). The visual editor offers the entities the card counts in the rooms it shows, plus the ones already excluded.

## 1.1.0 - 2026-10-24

### What's new
- `include` on the Sensors, Lights and Plugs cards: entities added to the ones found in the room, from another room, without a room, or not recognised by the discovery (a switch that is not named as a plug, say). Each item is an entity ID or `{entity, name, icon}`, like in `entities`. A card can also be made of `include` alone.
- The visual editors have an *add* list next to the *exclude* one: it offers the entities of the card's domains (binary sensors, lights and switches, or switches) that the card does not show yet, configuration entities left out.

## 1.0.1 - 2026-10-24

### Changes
- Smarter exclude lists in the visual editors: the Sensors, Lights and Plugs cards only offer the entities they find in the chosen room, with their own rules (sensors of the right kind without the camera detections, lights without light groups, plugs without light switches); the Overview card only offers the rooms it finds. Entities and rooms already excluded stay in the list. The exclude list appears once a room is chosen.

## 1.0.0 - 2026-10-24

First release of **ha-room-card**: the room cards in a single HACS download.

### What's new
- Four cards in one file, `ha-room-card.js`: `room-overview-card`, `room-sensors-card`, `room-lights-card` and `room-switch-card`. The card types are unchanged, so dashboards using the former room-sensors-card, room-lights-card or room-switch-card repositories keep working.
- **Overview** (new): one compact tile per room, coloured by what matters most (leak, open, presence), with chips for the lights and plugs that are on and the power drawn; header with the home status and totals; tap a room to unfold its Sensors, Lights and Plugs cards at the top of the card, tap again or anywhere else to fold it back. `rooms` for the order, names, icons or a `navigation_path`, `exclude_areas`, `only_active`, `sort: state`.
- **Sensors**: leak, door, window, opening and presence sensors of a room (from room-sensors-card 1.1.2): open sensors first with how long they have been open, presence in blue, camera detections left out; `only_alerts`, `hide_when_clear` (hidden only when everything is closed and dry and nobody is there), `presence`, `blink`.
- **Lights**: lights and light switches of a room (from room-lights-card 1.0.1): tap to toggle, drag to dim, hold for details, colour and brightness on the tile, turn everything off from the pill.
- **Plugs**: smart plugs of a room with their power draw (from room-switch-card 1.0.1): tap to toggle, hold for details, total power in the header, optional turn-everything-off.
- Same visual editor options wording on every card, labels in English and French, light and dark themes.
