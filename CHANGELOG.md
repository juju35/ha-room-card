# Changelog

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
