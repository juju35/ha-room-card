# Changelog

## 1.4.0

### Changes
- Same compact header as the other ha-* cards: 36 px icon, 16 px title, 12 px card padding; medium weight for titles, pills, chips and room names.

### Maintenance
- README follows the common plan: Features, Configuration, Screenshots and How it works, with one sub-section per card.

## 1.3.0

### What's new
- Overview card: tapping the lights chip of the header turns every light the card counts off (excluded rooms and entities stay as they are). On by default, `all_off_button: false` turns it into a plain counter again.

## 1.2.2

### Fixes
- Sensors and Overview cards: *All closed* only when the room or home has door or window sensors; with only leak or presence sensors the status reads *All quiet*.

## 1.2.1

### Fixes
- Overview card with *Hide idle rooms*: when every room is idle, the card shrinks to its header instead of saying no room was found, and the header says *All closed* again when the home has door or window sensors.

## 1.2.0

### What's new
- `exclude` on the Overview card: entities left out of the tiles, the header totals and the room details (the Sensors, Lights and Plugs cards unfolded for a room get the same exclusions). The visual editor offers the entities the card counts in the rooms it shows, plus the ones already excluded.

## 1.1.0

### What's new
- `include` on the Sensors, Lights and Plugs cards: entities added to the ones found in the room, from another room, without a room, or not recognised by the discovery (a switch that is not named as a plug, say). Each item is an entity ID or `{entity, name, icon}`, like in `entities`. A card can also be made of `include` alone.
- The visual editors have an *add* list next to the *exclude* one: it offers the entities of the card's domains (binary sensors, lights and switches, or switches) that the card does not show yet, configuration entities left out.

## 1.0.1

### Changes
- Smarter exclude lists in the visual editors: the Sensors, Lights and Plugs cards only offer the entities they find in the chosen room, with their own rules (sensors of the right kind without the camera detections, lights without light groups, plugs without light switches); the Overview card only offers the rooms it finds. Entities and rooms already excluded stay in the list. The exclude list appears once a room is chosen.

## 1.0.0

First release of **ha-room-card**: the room cards in a single HACS download.

### What's new
- Four cards in one file, `ha-room-card.js`: `room-overview-card`, `room-sensors-card`, `room-lights-card` and `room-switch-card`. The card types are unchanged, so dashboards using the former room-sensors-card, room-lights-card or room-switch-card repositories keep working.
- **Overview** (new): one compact tile per room, coloured by what matters most (leak, open, presence), with chips for the lights and plugs that are on and the power drawn; header with the home status and totals; tap a room to unfold its Sensors, Lights and Plugs cards at the top of the card, tap again or anywhere else to fold it back. `rooms` for the order, names, icons or a `navigation_path`, `exclude_areas`, `only_active`, `sort: state`.
- **Sensors**: leak, door, window, opening and presence sensors of a room (from room-sensors-card 1.1.2): open sensors first with how long they have been open, presence in blue, camera detections left out; `only_alerts`, `hide_when_clear` (hidden only when everything is closed and dry and nobody is there), `presence`, `blink`.
- **Lights**: lights and light switches of a room (from room-lights-card 1.0.1): tap to toggle, drag to dim, hold for details, colour and brightness on the tile, turn everything off from the pill.
- **Plugs**: smart plugs of a room with their power draw (from room-switch-card 1.0.1): tap to toggle, hold for details, total power in the header, optional turn-everything-off.
- Same visual editor options wording on every card, labels in English and French, light and dark themes.
