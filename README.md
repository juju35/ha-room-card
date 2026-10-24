# ha-room-card

[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HACS Validation](https://github.com/juju35/ha-room-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-room-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-room-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-room-card/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-room-card)](https://github.com/juju35/ha-room-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Compact Lovelace cards for Home Assistant, **room by room**: sensors, lights, plugs, and an overview of every room. Add a card, pick a room, it finds the entities by itself.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-room-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [Overview](#overview) | `custom:room-overview-card` | Every room at a glance: one tile per room, tap a room to unfold its sensors, lights and plugs. |
| [Sensors](#sensors) | `custom:room-sensors-card` | Leak, door, window, opening and presence sensors of a room: what is open comes first, with how long it has been open. |
| [Lights](#lights) | `custom:room-lights-card` | Lights of a room: tap to toggle, drag to dim, turn everything off from the header. |
| [Plugs](#plugs) | `custom:room-switch-card` | Smart plugs of a room with their power draw: what is on comes first, the most power-hungry first. |

| Every room | Sensors | Lights | Plugs |
|---|---|---|---|
| ![Overview](https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-all.png) | ![Sensors](https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-open.png) | ![Lights](https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-on.png) | ![Plugs](https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-on.png) |

All four cards share the same look (header with a status pill, compact tiles), a visual editor in the dashboard UI, English and French labels following the Home Assistant language, light and dark themes, and come in a single HACS download with no dependency.

## Features

### Overview

`custom:room-overview-card` — Every room at a glance: one tile per room, tap a room to unfold its sensors, lights and plugs.

- One compact tile per room, coloured by what matters most: *Water leak* (red, blinking), *1 open* (orange), *Presence* (blue), otherwise *All closed* / *All quiet*
- Small chips on each tile for the lights that are on, the plugs that are on with their power draw, and presence when an alert is already shown
- Header with the home status and totals: occupied rooms, lights on, power drawn by the plugs
- **Tap** the lights chip of the header to turn every light the card counts off (`all_off_button`)
- **Tap** a room to unfold its details at the top of the card: the Sensors, Lights and Plugs cards of that room; tap it again or anywhere else to fold it back
- Automatic discovery: every area with door, window, leak or presence sensors, lights or plugs becomes a room, with an icon picked from its name
- Same rules as the room cards: camera detections, configuration entities and light groups are skipped, light switches count as lights
- Show only the rooms with something open, on or detected (`only_active`), or list them first (`sort: state`)

### Sensors

`custom:room-sensors-card` — Leak, door, window, opening and presence sensors of a room: what is open comes first, with how long it has been open.

- Header with an icon and a status pill coloured by the room state: *All closed* (green), *1 open* (orange), *Water leak* (red, pulsing)
- Open sensors listed first, leaks before doors and windows, with a blinking icon and how long they have been open
- Presence and motion sensors in blue (*Detected* / *Clear*), with a person icon next to the pill while someone is in the room; they are not alerts and never blink
- Icon picked from the sensor: sliding door, window, door, garage door, water drop, person, motion sensor
- Clean names: the `Sensor` / `Capteur` prefix, the area name and the trailing device-class word are removed (*Capteur Porte Fenêtre Cuisine Porte* → *Porte Fenêtre Cuisine*)
- Show only the open or active sensors (`only_alerts`), or hide the whole card when everything is closed, dry and nobody is there (`hide_when_clear`)
- Tap a sensor to open its details
- Automatic discovery from the area, or an explicit list with name and icon overrides

### Lights

`custom:room-lights-card` — Lights of a room: tap to toggle, drag to dim, turn everything off from the header.

- Header with an icon and a status pill: *All off*, or *2 on* with a power button that turns every light of the room off
- Lights that are on listed first, tinted with their actual colour, brightness shown as a bar behind the tile
- **Tap** a light to toggle it, **drag** it sideways to set its brightness, **hold** it to open its details
- Lights and light switches: a `switch` whose name says it drives a light (*Lumière Canapé*, *Desk Lamp*) is picked up too
- Clean names: the `Lumière` / `Light` prefix and the area name are removed (*Lumière Canapé* → *Canapé*)
- Show only the lights that are on (`only_on`), or hide the whole card when everything is off (`hide_when_off`)
- Tap the title to open a dashboard (`navigation_path`)
- Automatic discovery from the area, or an explicit list with name and icon overrides (custom icon sets supported)

### Plugs

`custom:room-switch-card` — Smart plugs of a room with their power draw: what is on comes first, the most power-hungry first.

- Header with an icon and a status pill: *All off*, or *3 on · 1.2 kW*
- Power draw of each plug, read from the power sensor of the same device, and the total in the header
- Plugs that are on listed first, the most power-hungry first
- **Tap** a plug to toggle it, **hold** it to open its details
- Optional power button on the status pill to turn every plug of the room off (`all_off_button`, off by default: a plug may feed a camera or a network switch)
- Plugs found by device class `outlet`, or by a name that says so (*Prise Terrasse*, *Desk Plug*); switches driving a light are left to [room-lights-card](#lights)
- Clean names: the `Prise` / `Plug` prefix or suffix and the area name are removed (*Prise Machine à café* → *Machine à café*)
- Show only the plugs that are on (`only_on`), or hide the whole card when everything is off (`hide_when_off`)
- Tap the title to open a dashboard (`navigation_path`)
- Automatic discovery from the area, or an explicit list with name, icon and power sensor overrides

## Prerequisites

- Home Assistant 2024.8 or later
- Areas set on the sensors, lights and plugs or on their devices, for the automatic discovery; otherwise list the entities by hand

## Installation

### Via HACS (recommended)

Click the button below to add the repository directly:

[![Add to HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-room-card&category=plugin)

Or manually:

1. Open HACS → **Frontend** → **⋮** → **Custom repositories**
2. Add `https://github.com/juju35/ha-room-card` — Category: **Dashboard** (Lovelace)
3. Search for **Room Cards** and install it
4. Clear your browser cache and refresh

HACS registers the dashboard resource for you; the single file provides the four cards.

### Manual

1. Download `ha-room-card.js` from the [latest release](https://github.com/juju35/ha-room-card/releases/latest)
2. Copy it to `/config/www/`
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-room-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

### Coming from room-sensors-card, room-lights-card or room-switch-card

Remove the old repository and its resource from HACS, then install this one: the card types are unchanged, so your dashboards keep working as they are.

## Configuration

### Common options

The Sensors, Lights and Plugs cards share these options; each card below lists its own.

| Option | Required | Default | Description |
|---|---|---|---|
| `area` | ✅* | — | Area ID; its entities are found automatically |
| `include` | ✅* | — | Entities added to the ones found in the area: from another room, without a room, or not recognised (a switch that is not named as a plug, say); each item is an entity ID or `{entity, name, icon}`. The visual editor offers the entities of the card's domains that it does not show yet |
| `entities` | ✅* | — | Explicit list, replaces the discovery; each item is an entity ID or `{entity, name, icon}` (plus `power` on the Plugs card) |
| `title` | ❌ | Area name | Card title |
| `columns` | ❌ | `2` | Number of tile columns (1–4) |
| `exclude` | ❌ | — | Entities left out of the automatic discovery; the visual editor only offers the ones the card finds in the chosen room |
| `navigation_path` | ❌ | — | Lights and Plugs cards: dashboard opened when tapping the title, e.g. `/light` |
| `only_on` | ❌ | `false` | Lights and Plugs cards: show only what is on (and unavailable entities) |
| `hide_when_off` | ❌ | `false` | Lights and Plugs cards: hide the whole card when everything is off |
| `all_off_button` | ❌ | Lights `true`, Plugs `false` | Lights and Plugs cards: the status pill turns everything of the card off when tapped (off by default on Plugs: a plug may feed a camera or a network switch) |
| `language` | ❌ | Auto | Force language: `fr` or `en` (auto-detects from HA settings); also on the Overview card |

\* `area`, `include` or `entities` is required.

### Overview

Minimal:

```yaml
type: custom:room-overview-card
```

Full options:

```yaml
type: custom:room-overview-card
title: Home
columns: 3
sort: name
presence: true
only_active: false
all_off_button: true
exclude_areas:
  - garage
exclude:
  - light.living_room_camera_floodlight
rooms:
  - area: living_room
  - area: kitchen
  - area: bedroom_1
    name: Bedroom
    icon: mdi:bed-king-outline
  - area: office
    navigation_path: /dashboard-home/office
```

#### Options reference

| Option | Required | Default | Description |
|---|---|---|---|
| `title` | ❌ | `Home` | Card title |
| `columns` | ❌ | `3` | Number of room columns (1–6); when empty, 3, or 2 on narrow screens |
| `sort` | ❌ | `name` | `name`, or `state` to list the rooms needing attention first (leak, open, presence, something on) |
| `presence` | ❌ | `true` | Include the presence and motion sensors (camera detections are always left out) |
| `only_active` | ❌ | `false` | Show only the rooms with something open, on or detected |
| `all_off_button` | ❌ | `true` | Tapping the lights chip of the header turns every light the card counts off |
| `exclude_areas` | ❌ | — | Rooms left out; the visual editor only offers the rooms the card finds |
| `exclude` | ❌ | — | Entities left out of the tiles, the totals and the room details; the visual editor only offers the entities the card counts in the rooms it shows |
| `rooms` | ❌ | — | Room order and overrides, see below; the other rooms follow |
| `language` | ❌ | Auto | Force language: `fr` or `en` (auto-detects from HA settings) |

**Room options**

| Option | Description |
|---|---|
| `area` | Area ID of the room |
| `name` | Room name; defaults to the area name |
| `icon` | Room icon; defaults to the area icon, or one picked from the name |
| `navigation_path` | Dashboard opened on tap instead of the details, e.g. `/dashboard-home/office` |

### Sensors

Minimal:

```yaml
type: custom:room-sensors-card
area: living_room
```

Full options:

```yaml
type: custom:room-sensors-card
area: living_room
title: Living room
columns: 2
only_alerts: false
hide_when_clear: false
presence: true
blink: true
exclude:
  - binary_sensor.living_room_tv_cabinet
```

#### Alerts only

Shows only what is open, leaking or detecting someone, and hides the card when the room is idle:

```yaml
type: custom:room-sensors-card
area: living_room
only_alerts: true
hide_when_clear: true
```

#### Options reference

In addition to the [common options](#common-options):

| Option | Required | Default | Description |
|---|---|---|---|
| `only_alerts` | ❌ | `false` | Show only the open, leaking, active (presence detected) or unavailable sensors |
| `hide_when_clear` | ❌ | `false` | Hide the whole card when everything is closed and dry and no presence is detected |
| `presence` | ❌ | `true` | Include the presence and motion sensors of the area |
| `blink` | ❌ | `true` | Blink the icon of open sensors (also stops when the system asks for reduced motion) |

### Lights

Minimal:

```yaml
type: custom:room-lights-card
area: living_room
```

Full options:

```yaml
type: custom:room-lights-card
area: living_room
title: Living room
navigation_path: /light
columns: 2
only_on: false
hide_when_off: false
show_brightness: true
all_off_button: true
exclude:
  - light.living_room_camera_floodlight
```

#### Explicit lights

```yaml
type: custom:room-lights-card
title: Living room
entities:
  - entity: light.kitchen
    icon: phu:ikea-jakobsbyn
  - entity: light.living_room
    icon: phu:ikea-jakobsbyn
  - entity: switch.sofa_lamp
    name: Sofa
  - entity: light.night_light
    name: Night light
    icon: mdi:lightbulb-night
```

#### Options reference

In addition to the [common options](#common-options):

| Option | Required | Default | Description |
|---|---|---|---|
| `show_brightness` | ❌ | `true` | Brightness bar and drag-to-dim on dimmable lights |

### Plugs

Minimal:

```yaml
type: custom:room-switch-card
area: living_room
```

Full options:

```yaml
type: custom:room-switch-card
area: living_room
title: Living room
navigation_path: /energy
columns: 2
only_on: false
hide_when_off: false
show_power: true
all_off_button: false
exclude:
  - switch.living_room_router
```

#### Explicit plugs

```yaml
type: custom:room-switch-card
title: Living room
entities:
  - entity: switch.microwave
    icon: mdi:microwave
  - entity: switch.tv
    name: TV
    power: sensor.tv_power
  - switch.coffee_machine_plug
```

#### Options reference

In addition to the [common options](#common-options):

| Option | Required | Default | Description |
|---|---|---|---|
| `show_power` | ❌ | `true` | Power draw of each plug and total in the header |

## Screenshots

### Overview

| Every room | Room details |
|---|---|
| ![Every room](screenshots/overview-all.png) | ![Room details](screenshots/overview-details.png) |
| ![Every room dark](screenshots/overview-all-dark.png) | ![Room details dark](screenshots/overview-details-dark.png) |

### Sensors

| A door open | Water leak |
|---|---|
| ![A door open](screenshots/sensors-open.png) | ![Water leak](screenshots/sensors-leak.png) |
| ![A door open dark](screenshots/sensors-open-dark.png) | ![Water leak dark](screenshots/sensors-leak-dark.png) |

### Lights

| Lights on | All off |
|---|---|
| ![Lights on](screenshots/lights-on.png) | ![All off](screenshots/lights-off.png) |
| ![Lights on dark](screenshots/lights-on-dark.png) | ![All off dark](screenshots/lights-off-dark.png) |

### Plugs

| Plugs on | All off |
|---|---|
| ![Plugs on](screenshots/switch-on.png) | ![All off](screenshots/switch-off.png) |
| ![Plugs on dark](screenshots/switch-on-dark.png) | ![All off dark](screenshots/switch-off-dark.png) |

## How it works

### Overview

The card goes through every entity with an area (set on the entity or on its device), with the same rules as the room cards:

- **Sensors**: `binary_sensor` with device class `moisture`, `door`, `window`, `opening` or `garage_door`
- **Presence**: `binary_sensor` with device class `occupancy`, `presence` or `motion`, except the ones of a device that has a `camera` entity
- **Lights**: every `light` except light groups, and every `switch` whose name contains *lumière*, *lampe*, *lamp*, *light*, *veilleuse* or *guirlande*
- **Plugs**: every other `switch` with device class `outlet`, or whose name contains *prise*, *plug*, *outlet* or *socket*, with the power sensor of the same device

Hidden entities and configuration or diagnostic entities are skipped. A room is shown when it has at least one of them.

A tile shows the most important state of the room: a wet leak sensor, then open doors and windows, then presence, otherwise *All closed* (or *All quiet* for a room without door or window sensors). The details of a room are the Sensors, Lights and Plugs cards of that area, for the kinds of entities the room has.

### Sensors

The card keeps every `binary_sensor` of the area whose device class is `moisture`, `door`, `window`, `opening` or `garage_door`, and with `presence` (the default) `occupancy`, `presence` or `motion` (the area set on the entity, or on its device). Hidden entities are skipped, and so are the motion and person detections of cameras (a sensor whose device also has a `camera` entity): list them in `entities` to show them.

The room is **in alert** when a sensor is open (orange) and **critical** when a leak sensor is wet (red). Presence and motion are information, not alerts: shown in blue, they never change the header colour. Wet leak sensors come first, then open doors and windows, then detected presence, then the others by name. The icon follows the sensor: a `door` sensor whose entity ID contains `porte_fenetre`, `sliding` or `patio` gets a sliding door, a `window` sensor (or a `door` sensor with `fenetre` / `window` in its ID) gets a window.

### Lights

The card keeps every `light` of the area (the area set on the entity, or on its device), plus every `switch` of the area whose name contains *lumière*, *lampe*, *lamp*, *light*, *veilleuse* or *guirlande* as a word. Hidden entities, configuration and diagnostic entities (such as indicator LEDs) and light groups are skipped.

Lights that are on come first, then by name. A tap calls `homeassistant.toggle`; dragging a dimmable light sideways shows the brightness under the finger and calls `light.turn_on` with `brightness_pct` on release; a hold opens the more-info dialog. The pill calls `homeassistant.turn_off` on the lights of the card that are on.

### Plugs

The card keeps every `switch` of the area (the area set on the entity, or on its device) whose device class is `outlet`, or whose name contains *prise*, *multiprise*, *plug*, *outlet* or *socket* as a word. Hidden entities and configuration or diagnostic entities are skipped, and so are switches whose name says they drive a light (*lumière*, *lampe*, *lamp*, *light*, *veilleuse*, *guirlande*): those belong to [room-lights-card](#lights).

The power draw comes from the first sensor of the same device with the `power` device class (W or kW), or from the `power` sensor set on the entity. Plugs that are on come first, the most power-hungry first, then by name. A tap calls `homeassistant.toggle`, a hold opens the more-info dialog, and the pill calls `homeassistant.turn_off` on the plugs of the card that are on when `all_off_button` is set.

## Development

```bash
npm install
npm run build        # bundles src/*.js into dist/ha-room-card.js and stamps the version of package.json
npm run check        # builds and checks the bundle (run in CI)
npm run screenshots  # renders every card with mock data into screenshots/
```

Each card has its own source in `src/`; the build wraps each one in its own block and concatenates them into the single HACS file. `dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where HACS downloads it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the bundle, creates the tag and the GitHub release with the changelog section as notes, and attaches `ha-room-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |

Contributions for additional languages are welcome!

## License

[MIT](LICENSE)
