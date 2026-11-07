# ha-room-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-room-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-room-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-room-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-room-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-room-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-room-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-room-card)](https://github.com/juju35/ha-room-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-room-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

Compact Lovelace cards for Home Assistant, **room by room**: sensors, lights, plugs, environment readings, and an overview of every room. Add a card, pick a room, it finds the entities by itself.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-room-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [Overview](#overview) | `custom:room-overview-card` | Every room at a glance: one tile per room, tap a room to unfold its sensors, lights and plugs. |
| [Sensors](#sensors) | `custom:room-sensors-card` | Leak, door, window, opening and presence sensors of a room: what is open comes first, with how long it has been open. |
| [Sensors mini](#sensors-mini) | `custom:room-sensors-mini-card` | The same sensors on two lines, with a zoom to the full card. |
| [Lights](#lights) | `custom:room-lights-card` | Lights of a room: tap to toggle, drag to dim, turn everything off from the header. |
| [Lights mini](#lights-mini) | `custom:room-lights-mini-card` | The same lights on two lines: how many are on, a button to turn them all off, a zoom to the full card. |
| [Plugs](#plugs) | `custom:room-switch-card` | Smart plugs of a room with their power draw: what is on comes first, the most power-hungry first. |
| [Plugs mini](#plugs-mini) | `custom:room-switch-mini-card` | The same plugs on two lines: how many are on and their power draw, with a zoom to the full card. |
| [Environment](#environment) | `custom:room-environment-card` | Temperature, humidity, air quality, noise and light level of a room, coloured by comfort. |
| [Environment mini](#environment-mini) | `custom:room-environment-mini-card` | The same readings on a single line, for a compact dashboard. |
| [Environment overview](#environment-overview) | `custom:room-environment-overview-card` | The indoor climate of every room at a glance; tap a room to unfold its readings. |

| Every room | Sensors | Lights | Plugs | Environment |
|---|---|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-all.png" alt="Overview" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-open.png" alt="Sensors" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-on.png" alt="Lights" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-on.png" alt="Plugs" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-stuffy.png" alt="Environment" width="400"> |

All the cards share the same look (header with a status pill, compact tiles), a visual editor in the dashboard UI covering every option (lists and maps such as `entities`, `thresholds` and `rooms` in its folded **Advanced** section, as YAML), English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek labels following the Home Assistant language, light and dark themes, and come in a single Marketplace install with no dependency.

## Features

### Overview

`custom:room-overview-card` — Every room at a glance: one tile per room, tap a room to unfold its sensors, lights and plugs.

- One compact tile per room, coloured by what matters most: *Water leak* (red, blinking), *1 open* (orange), *Presence* (blue), otherwise *All closed* / *All quiet*
- Small chips on each tile for the lights that are on, the plugs that are on with their power draw, and presence when an alert is already shown
- Header with the home status and totals: occupied rooms, lights on, power drawn by the plugs; on a narrow card (6 columns of a Sections view) the totals move to a line of their own under the title
- **Tap** the lights chip of the header to turn every light the card counts off (`all_off_button`), and the plugs chip to turn every plug off once confirmed in a popup listing them (`plugs_off_button`, off by default: a plug may feed a camera or a network switch)
- **Tap** a room to unfold its details at the top of the card: the Sensors, Lights and Plugs cards of that room; tap it again or anywhere else to fold it back
- Automatic discovery: every area with door, window, leak or presence sensors, lights or plugs becomes a room, with an icon picked from its name
- Same rules as the room cards: hidden entities and camera detections are skipped, and so are light groups and the configuration and diagnostic entities of lights and plugs (door, window, leak and presence sensors count whatever their category); light switches count as lights
- Only the rooms with something open, on or detected show; the **detail** button (top right) shows every room, and back, as does a click anywhere else (`zoom: false`: every room, always, no button); `sort: state` lists the rooms needing attention first

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

### Sensors mini

`custom:room-sensors-mini-card` — Only what is open or detected, for a compact dashboard; zoom in for every sensor.

- Room badge coloured like the Sensors card, the title and the status (*1 open*, *Water leak*) on the first line
- On the second line, a tinted pill with its name for each open, leaking or detecting sensor (blinking unless `blink: false`); quiet sensors are hidden, so a quiet room is a single line
- **Zoom** button (top right) switches the card to the full [Sensors card](#sensors) — every sensor, with how long it has been open — and back, as does a click anywhere else (`zoom: false` removes it)
- Same discovery and options as the Sensors card: `hide_when_clear` (compact view only), `presence`, `blink`, `include` / `exclude`
- Tap a sensor to open its details

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

### Lights mini

`custom:room-lights-mini-card` — The lights of a room on two lines, for a compact dashboard; zoom in to toggle and dim them.

- Room badge coloured like the Lights card, the title and the status on the first line: *All off*, or how many lights are on out of the total (*2/4 on*)
- The status doubles as a power button turning every light of the room off (`all_off_button`, on by default)
- On the second line, a pill tinted with its colour and showing its name for each light that is on, the icon alone for the others (`only_on` hides them)
- **Zoom** button (top right) switches the card to the full [Lights card](#lights) — tap to toggle, drag to dim — and back, as does a click anywhere else (`zoom: false` removes it)
- Same discovery and options as the Lights card: `only_on`, `hide_when_off`, `include` / `exclude`, `navigation_path`
- Tap a light to open its details

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

### Plugs mini

`custom:room-switch-mini-card` — The plugs of a room on two lines, for a compact dashboard; zoom in to toggle them.

- Room badge coloured like the Plugs card, the title and the status on the first line: *All off*, or how many plugs are on out of the total and their power draw (*2/4 on · 1.2 kW*)
- With `all_off_button: true`, the status doubles as a power button turning every plug of the room off (off by default, like the Plugs card)
- On the second line, a pill with its name and power draw for each plug that is on (*Coffee Machine 1.2 kW*), the icon alone for the others (`only_on` hides them)
- **Zoom** button (top right) switches the card to the full [Plugs card](#plugs) and back, as does a click anywhere else (`zoom: false` removes it)
- Same discovery and options as the Plugs card: `only_on`, `hide_when_off`, `show_power`, `include` / `exclude`, `navigation_path`
- Tap a plug to open its details

### Environment

`custom:room-environment-card` — Temperature, humidity, air quality, noise and light level of a room, coloured by comfort.

- Header with an icon and a status pill coloured by the reading that needs a look first: *Comfortable* (green), *Cool* (blue), *Ventilate*, *Too humid*, *Noisy* (orange), up to red past the alert thresholds, with `+N` when several readings are off
- One tile per reading, in a fixed order: temperature, humidity, CO₂, PM2.5, PM10, VOC, air quality index, noise, light level
- Each tile shows the value as Home Assistant formats it, with a thin gauge underneath; a comfort word (*Dry*, *Moderate*, *Noisy*…) is added when the reading is off, and to the light level (*Dark*, *Dim*, *Bright*)
- Only what is outside the comfort range is tinted; cold readings are blue, the light level is information only and never alerts
- Built-in comfort thresholds (WHO and common indoor guidelines), adjustable per kind with `thresholds`; °F and ppb sensors are handled
- Several sensors of the same kind in a room make **one reading: their mean** (three thermometers, one *Temperature* tile); unavailable and unknown sensors are left out of it
- Show only the readings outside the comfort range (`only_alerts`)
- Tap a reading to open its details and history; tap the title to open a dashboard (`navigation_path`)
- Automatic discovery from the area, or an explicit list with name and icon overrides

### Environment mini

`custom:room-environment-mini-card` — The same readings on a single line, for a compact dashboard.

- Room badge coloured by the reading that needs a look first, the title and the status on the first line
- One chip per reading on the second line: icon and value, the unit kept small (*21,4°*, *640 ppm*); comfortable readings are plain, the others get a tinted pill
- Same discovery, thresholds, `only_alerts`, `include` / `exclude` and `navigation_path` as the Environment card; the chips wrap onto another line when the card is narrow or the room has many sensors
- Tap a reading to open its details and history
- **Zoom** button (top right) switches the card to the full [Environment card](#environment) — tiles, comfort words, gauges — and back, as does a click anywhere else (`zoom: false` removes it); zoomed in, every reading is shown, `only_alerts` only filtering the compact view

### Environment overview

`custom:room-environment-overview-card` — The indoor climate of every room at a glance; tap a room to unfold its readings.

- One tile per room with environment sensors, coloured by the reading that needs a look first: *Ventilate*, *Too humid*, *Poor air* (orange to red), *Cool* (blue), otherwise *Comfortable*
- On each tile: temperature, humidity and CO₂, plus any other reading outside the comfort range (PM2.5, noise…); same means and thresholds as the Environment card
- Header with the number of rooms to check and the home's average temperature and humidity
- **Tap** a room to unfold its Environment card at the top of the card; tap it again or anywhere else to fold it back
- Only the rooms needing a look show; the **detail** button (top right) shows every room, and back, as does a click anywhere else (`zoom: false`: every room, always, no button); `sort: state` lists them first; room order, names and icons with `rooms`, like the [Overview](#overview)

## Prerequisites

- Home Assistant 2024.8 or later
- Areas set on the sensors, lights and plugs or on their devices, for the automatic discovery; otherwise list the entities by hand

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-room-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-room-card` — Category: **Dashboard** (Lovelace)
3. Open **Room Cards** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you; the single file provides every card.

### Manual

1. Download `ha-room-card.js` from the [latest release](https://github.com/juju35/ha-room-card/releases/latest)
2. Copy it to `/config/www/`
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-room-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

### Coming from room-sensors-card, room-lights-card or room-switch-card

Uninstall the old repository (and its resource) in **Settings → Marketplace**, then install this one: the card types are unchanged, so your dashboards keep working as they are.

## Configuration

### Common options

The Sensors, Lights, Plugs and Environment cards share these options; each card below lists its own.

| Option | Required | Default | Description |
|---|---|---|---|
| `area` | ✅* | — | Area ID; its entities are found automatically |
| `include` | ✅* | — | Entities added to the ones found in the area: from another room, without a room, or not recognised (a switch that is not named as a plug, say); each item is an entity ID or `{entity, name, icon}`. The visual editor offers the entities of the card's domains that it does not show yet |
| `entities` | ✅* | — | Explicit list, replaces the discovery; each item is an entity ID or `{entity, name, icon}` (plus `power` on the Plugs card) |
| `title` | ❌ | Area name | Card title |
| `columns` | ❌ | `2` | Number of tile columns (1–4) |
| `exclude` | ❌ | — | Entities left out of the automatic discovery; the visual editor only offers the ones the card finds in the chosen room |
| `navigation_path` | ❌ | — | Dashboard opened when tapping the title, e.g. `/light` |
| `only_on` | ❌ | `false` | Lights and Plugs cards: show only what is on (and unavailable entities) |
| `hide_when_off` | ❌ | `false` | Lights and Plugs cards: hide the whole card when everything is off |
| `all_off_button` | ❌ | Lights `true`, Plugs `false` | Lights and Plugs cards: the status pill turns everything of the card off when tapped (off by default on Plugs: a plug may feed a camera or a network switch) |
| `language` | ❌ | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings); also on the Overview card |

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
zoom: true
all_off_button: true
plugs_off_button: false
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
| `columns` | ❌ | `3` | Number of room columns (1–6); on a card of 340 px or less at most 2, and 1 at 260 px or less (6 columns of a Sections view on a phone) |
| `sort` | ❌ | `name` | `name`, or `state` to list the rooms needing attention first (leak, open, presence, something on) |
| `presence` | ❌ | `true` | Include the presence and motion sensors (camera detections are always left out) |
| `zoom` | ❌ | `true` | Show only the rooms with something open, on or detected, with a detail button showing every room; `false` shows every room, always |
| `all_off_button` | ❌ | `true` | Tapping the lights chip of the header turns every light the card counts off |
| `plugs_off_button` | ❌ | `false` | Tapping the plugs chip of the header opens a confirmation listing every plug the card counts that is on, and turns them off on OK (Cancel, Escape or a tap outside do nothing); the Plugs card of the room details gets its turn-everything-off pill too, behind the same confirmation. Off by default: a plug may feed a camera or a network switch, leave those out with `exclude` |
| `exclude_areas` | ❌ | — | Rooms left out; the visual editor only offers the rooms the card finds |
| `exclude` | ❌ | — | Entities left out of the tiles, the totals and the room details; the visual editor only offers the entities the card counts in the rooms it shows |
| `rooms` | ❌ | — | Room order and overrides, see below; the other rooms follow |
| `language` | ❌ | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

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

### Sensors mini

Same options as the [Sensors card](#sensors) except `only_alerts` (the compact view always hides quiet sensors), plus `zoom`; `columns` only shapes the zoomed-in view:

```yaml
type: custom:room-sensors-mini-card
area: living_room
hide_when_clear: true
zoom: true
```

| Option | Required | Default | Description |
|---|---|---|---|
| `zoom` | ❌ | `true` | Zoom button switching to the full Sensors card and back |

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

### Lights mini

Same options as the [Lights card](#lights), `all_off_button` included (the power button on the status), plus:

| Option | Required | Default | Description |
|---|---|---|---|
| `zoom` | ❌ | `true` | Zoom button switching to the full Lights card and back (`columns` and `show_brightness` only shape that view) |

For example, a living room showing only the lights that are on, the title opening the lights dashboard:

```yaml
type: custom:room-lights-mini-card
area: living_room
navigation_path: /light
only_on: true
```

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

### Plugs mini

Same options as the [Plugs card](#plugs), `show_power` included (the total in the status, each plug's draw on its chip), plus:

| Option | Required | Default | Description |
|---|---|---|---|
| `zoom` | ❌ | `true` | Zoom button switching to the full Plugs card and back (`columns` only shapes that view) |

For example, with the power button on the status, leaving out the router plug:

```yaml
type: custom:room-switch-mini-card
area: living_room
all_off_button: true
exclude:
  - switch.living_room_router
```

### Environment

Minimal:

```yaml
type: custom:room-environment-card
area: living_room
```

Full options:

```yaml
type: custom:room-environment-card
area: living_room
title: Living room
navigation_path: /dashboard-home/living-room
columns: 2
only_alerts: false
show_gauge: true
thresholds:
  temperature: [17, 19, 24, 27]
  co2: [800, 1200]
exclude:
  - sensor.living_room_tv_temperature
```

#### Thresholds

Each kind has four limits — alert low, warning low, warning high, alert high — or two (warning, alert) for the kinds that only go wrong upwards. Set your own under `thresholds`, in the unit of the sensor; `null` leaves a side out.

| Kind | Key | Device class | Default | Below / between / above |
|---|---|---|---|---|
| Temperature | `temperature` | `temperature` | `[16, 18, 25, 28]` °C | Cold · Cool · Comfortable · Warm · Hot |
| Humidity | `humidity` | `humidity` | `[25, 35, 60, 70]` % | Very dry · Dry · Comfortable · Humid · Very humid |
| CO₂ | `co2` | `carbon_dioxide` | `[1000, 1500]` ppm | Good · Moderate · Poor |
| PM2.5 | `pm25` | `pm25` | `[15, 35]` µg/m³ | Good · Moderate · Poor |
| PM10 | `pm10` | `pm10` | `[45, 100]` µg/m³ | Good · Moderate · Poor |
| VOC | `voc` | `volatile_organic_compounds`, `volatile_organic_compounds_parts` | `[300, 1000]` µg/m³ (`[220, 660]` ppb) | Good · Moderate · Poor |
| Air quality index | `aqi` | `aqi` | `[100, 150]` | Good · Moderate · Poor |
| Noise | `noise` | `sound_pressure` | `[70, 85]` dB | Quiet · Noisy · Very noisy |
| Light level | — | `illuminance` | 10 and 200 lx | Dark · Dim · Bright (information only) |

A temperature sensor in °F gets the default limits converted; a cool room (warning low band) is information, not a warning.

**Outdoor areas.** In an area whose name says it is outside (*Terrasse*, *Jardin*, *Balcon*, *Patio*, *Extérieur*, *Terrace*, *Garden*, *Balcony*, *Outdoor*…), temperature, humidity and noise are information only — the weather and the street, not a comfort issue: they never tint the card nor make the room one to check. Set `thresholds` for them (on the card, or per room on the overview) to bring the levels back.

**Wet rooms.** In a room whose name says it is a bathroom, a shower room or a laundry (*Salle de bain*, *Salle d'eau*, *Douche*, *Buanderie*, *Bathroom*, *Shower*, *Laundry*), humidity defaults to `[25, 35, 70, 80]`: 61 % after a shower is fine there. Your own `humidity` thresholds always win.

#### Options reference

The Environment card takes these options on top of the [common options](#common-options):

| Option | Required | Default | Description |
|---|---|---|---|
| `only_alerts` | ❌ | `false` | Keep only the readings outside the comfort range |
| `show_gauge` | ❌ | `true` | Thin gauge under each reading |
| `thresholds` | ❌ | See above | Comfort limits per kind, in the sensor's unit |

### Environment mini

Same options as the [Environment card](#environment), plus `zoom`; `columns` and `show_gauge` only shape the zoomed-in view:

```yaml
type: custom:room-environment-mini-card
area: living_room
navigation_path: /dashboard-home/living-room
zoom: true
exclude:
  - sensor.living_room_pm25
```

| Option | Required | Default | Description |
|---|---|---|---|
| `zoom` | ❌ | `true` | Zoom button switching to the full Environment card and back |

### Environment overview

Minimal:

```yaml
type: custom:room-environment-overview-card
```

Full options:

```yaml
type: custom:room-environment-overview-card
title: Indoor climate
columns: 3
sort: state
zoom: true
thresholds:
  co2: [800, 1200]
exclude_areas:
  - garage
exclude:
  - sensor.living_room_tv_temperature
rooms:
  - area: living_room
  - area: bedroom_1
    name: Bedroom
  - area: office
    navigation_path: /dashboard-home/office
  - area: cellar
    thresholds:
      humidity: [30, 40, 75, 85]
```

#### Options reference

| Option | Required | Default | Description |
|---|---|---|---|
| `title` | ❌ | `Indoor climate` | Card title |
| `columns` | ❌ | `3` | Number of room columns (1–6); on a card of 340 px or less at most 2, and 1 at 260 px or less (6 columns of a Sections view on a phone) |
| `sort` | ❌ | `name` | `name`, or `state` to list the rooms needing a look first |
| `zoom` | ❌ | `true` | Show only the rooms with a reading outside the comfort range, with a detail button showing every room; `false` shows every room, always |
| `thresholds` | ❌ | See [Thresholds](#thresholds) | Comfort limits per kind, also used by the unfolded room |
| `exclude_areas` | ❌ | — | Rooms left out; the visual editor only offers the rooms the card finds |
| `exclude` | ❌ | — | Sensors left out of the tiles, the averages and the room details |
| `rooms` | ❌ | — | Room order and overrides (`area`, `name`, `icon`, `navigation_path`, as on the [Overview](#overview)), plus `thresholds` for that room only, on top of the card's |
| `language` | ❌ | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

## Screenshots

### Animations

One GIF per animated state, recorded from the real cards with mock data:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-blink.gif" alt="Open sensors blinking" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-blink-dark.gif" alt="Open sensors blinking, dark theme" width="400"> |

Open doors and windows blink (`rc-blink`) until they are closed; `blink: false` keeps them still.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-alert.gif" alt="Water leak alert" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-alert-dark.gif" alt="Water leak alert, dark theme" width="400"> |

A water leak pulses the header badge (`rc-pulse`) while the leaking sensor blinks.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-dim.gif" alt="Drag to dim" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-dim-dark.gif" alt="Drag to dim, dark theme" width="400"> |

Dragging a dimmable light sideways sets its brightness, the bar and the percentage following the finger.

### Overview

| Active rooms (default) | Every room (detail button) | Room details |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-active.png" alt="Active rooms" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-all.png" alt="Every room" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-details.png" alt="Room details" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-active-dark.png" alt="Active rooms dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-all-dark.png" alt="Every room dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/overview-details-dark.png" alt="Room details dark" width="400"> |

### Sensors

| A door open | Water leak |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-open.png" alt="A door open" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-leak.png" alt="Water leak" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-open-dark.png" alt="A door open dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-leak-dark.png" alt="Water leak dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-mini-open.png" alt="Mini a door open" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-mini-leak.png" alt="Mini water leak" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-mini-open-dark.png" alt="Mini a door open dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-mini-leak-dark.png" alt="Mini water leak dark" width="400"> |

| Mini card zoomed in | |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-mini-zoom.png" alt="Mini zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/sensors-mini-zoom-dark.png" alt="Mini zoomed in dark" width="400"> |

### Lights

| Lights on | All off |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-on.png" alt="Lights on" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-off.png" alt="All off" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-on-dark.png" alt="Lights on dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-off-dark.png" alt="All off dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-mini-on.png" alt="Mini lights on" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-mini-off.png" alt="Mini all off" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-mini-on-dark.png" alt="Mini lights on dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-mini-off-dark.png" alt="Mini all off dark" width="400"> |

| Mini card zoomed in | |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-mini-zoom.png" alt="Mini zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/lights-mini-zoom-dark.png" alt="Mini zoomed in dark" width="400"> |

### Plugs

| Plugs on | All off |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-on.png" alt="Plugs on" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-off.png" alt="All off" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-on-dark.png" alt="Plugs on dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-off-dark.png" alt="All off dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-mini-on.png" alt="Mini plugs on" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-mini-off.png" alt="Mini all off" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-mini-on-dark.png" alt="Mini plugs on dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-mini-off-dark.png" alt="Mini all off dark" width="400"> |

| Mini card zoomed in | |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-mini-zoom.png" alt="Mini zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/switch-mini-zoom-dark.png" alt="Mini zoomed in dark" width="400"> |

### Environment

| Comfortable | Stuffy room |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-comfort.png" alt="Comfortable" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-stuffy.png" alt="Stuffy room" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-comfort-dark.png" alt="Comfortable dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-stuffy-dark.png" alt="Stuffy room dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-mini-comfort.png" alt="Mini comfortable" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-mini-stuffy.png" alt="Mini stuffy room" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-mini-comfort-dark.png" alt="Mini comfortable dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-mini-stuffy-dark.png" alt="Mini stuffy room dark" width="400"> |

| Mini card zoomed in | |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-mini-zoom.png" alt="Mini zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-mini-zoom-dark.png" alt="Mini zoomed in dark" width="400"> |

### Environment overview

| Rooms to check (default) | Every room (detail button) | Room details |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-overview-check.png" alt="Rooms to check" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-overview-all.png" alt="Every room" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-overview-details.png" alt="Room details" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-overview-check-dark.png" alt="Rooms to check dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-overview-all-dark.png" alt="Every room dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-room-card/main/screenshots/environment-overview-details-dark.png" alt="Room details dark" width="400"> |

## How it works

### Overview

The card goes through every entity with an area (set on the entity or on its device), with the same rules as the room cards:

- **Sensors**: `binary_sensor` with device class `moisture`, `door`, `window`, `opening` or `garage_door`
- **Presence**: `binary_sensor` with device class `occupancy`, `presence` or `motion`, except the ones of a device that has a `camera` entity
- **Lights**: every `light` except light groups, and every `switch` whose name contains *lumière*, *lampe*, *lamp*, *light*, *veilleuse* or *guirlande*
- **Plugs**: every other `switch` with device class `outlet`, or whose name contains *prise*, *multiprise*, *plug*, *outlet* or *socket*, with the power sensor of the same device

Hidden entities are skipped, and so are the configuration and diagnostic entities of lights and plugs (an indicator LED, say); door, window, leak and presence sensors count whatever their entity category, like on the Sensors card. A room is shown when it has at least one of them.

A tile shows the most important state of the room: a wet leak sensor, then open doors and windows, then presence, otherwise *All closed* (or *All quiet* for a room without door or window sensors). The details of a room are the Sensors, Lights and Plugs cards of that area, for the kinds of entities the room has.

### Sensors

The card keeps every `binary_sensor` of the area whose device class is `moisture`, `door`, `window`, `opening` or `garage_door`, and with `presence` (the default) `occupancy`, `presence` or `motion` (the area set on the entity, or on its device). Hidden entities are skipped, and so are the motion and person detections of cameras (a sensor whose device also has a `camera` entity): list them in `entities` to show them.

The room is **in alert** when a sensor is open (orange) and **critical** when a leak sensor is wet (red). Presence and motion are information, not alerts: shown in blue, they never change the header colour. Wet leak sensors come first, then open doors and windows, then detected presence, then the others by name. The icon follows the sensor: a sensor whose entity ID contains `porte_fenetre`, `baie`, `sliding` or `patio` gets a sliding door, whatever its device class (garage doors, leak, presence and motion sensors excepted), a `window` sensor (or a `door` sensor with `fenetre` / `window` in its ID) gets a window.

### Lights

The card keeps every `light` of the area (the area set on the entity, or on its device), plus every `switch` of the area whose name contains *lumière*, *lampe*, *lamp*, *light*, *veilleuse* or *guirlande* as a word. Hidden entities, configuration and diagnostic entities (such as indicator LEDs) and light groups are skipped.

Lights that are on come first, then by name. A tap calls `homeassistant.toggle`; dragging a dimmable light sideways shows the brightness under the finger and calls `light.turn_on` with `brightness_pct` on release; a hold opens the more-info dialog. The pill calls `homeassistant.turn_off` on the lights of the card that are on.

### Plugs

The card keeps every `switch` of the area (the area set on the entity, or on its device) whose device class is `outlet`, or whose name contains *prise*, *multiprise*, *plug*, *outlet* or *socket* as a word. Hidden entities and configuration or diagnostic entities are skipped, and so are switches whose name says they drive a light (*lumière*, *lampe*, *lamp*, *light*, *veilleuse*, *guirlande*): those belong to [room-lights-card](#lights).

The power draw comes from the first sensor of the same device with the `power` device class (W or kW), or from the `power` sensor set on the entity. Plugs that are on come first, the most power-hungry first, then by name. A tap calls `homeassistant.toggle`, a hold opens the more-info dialog, and the pill calls `homeassistant.turn_off` on the plugs of the card that are on when `all_off_button` is set.

### Environment

The card keeps every `sensor` of the area (the area set on the entity, or on its device) whose device class is `temperature`, `humidity`, `carbon_dioxide`, `pm25`, `pm10`, `volatile_organic_compounds`, `volatile_organic_compounds_parts`, `aqi`, `sound_pressure` or `illuminance`. Hidden entities and configuration or diagnostic entities (a battery or CPU temperature, say) are skipped: list another one in `exclude` if a device reports a reading that does not describe the room.

The sensors of a same kind make one reading: the mean of the ones reporting a number (unavailable and unknown sensors are left out, and a kind with none left is not shown); a single sensor keeps Home Assistant's formatting, a mean is shown with one decimal for temperature and none for the others. A tap opens the details of the first sensor of the reading.

Each reading falls in one of five bands of its [thresholds](#thresholds). The header takes the reading with the highest severity (alert, then warning, then information), the kind order breaking ties. Values are formatted by Home Assistant (number format and display precision of the entity); a tap opens the more-info dialog with its history.

### Environment overview

The card finds the rooms the way the Environment card does, area by area, and shows each with the same readings and levels. A room needs a look when one of its readings is in a warning or alert band; the header counts those rooms, and its averages count each room once (its mean temperature and humidity).

## Development

```bash
npm install
npm run build        # bundles src/*.js into dist/ha-room-card.js and stamps the version of package.json
npm run check        # builds and checks the bundle (run in CI)
npm run screenshots  # renders every card with mock data into screenshots/, and the animation GIFs (needs ffmpeg)
```

Each card has its own source in `src/`; the build wraps each one in its own block and concatenates them into the single file the Marketplace installs. `dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where the Marketplace installs it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-room-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the bundle, creates the tag and the GitHub release with the changelog section as notes, and attaches `ha-room-card.js`

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

A regional variant uses its base language (`fr-FR` → `fr`, `de-CH` → `de`, and `pt-BR` → `pt`, European Portuguese); a language without translations falls back to English.

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-room-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
