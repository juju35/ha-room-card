// ── Editor ───────────────────────────────────────────────────────────────────
// Entities the card counts in the rooms it shows, plus the ones already excluded.
import { RoomOverviewCard } from "./card.js";
import { RO_I18N } from "./i18n/ro-i18n.js";

export const roExcludeField = (hass, config) => {
  if (!hass) return [];
  const rooms = rcProbe(RoomOverviewCard, hass, { ...config, exclude: [], zoom: false })._collect();
  const ids = rooms.flatMap((x) => [...x.sensors, ...x.presence, ...x.lights, ...x.plugs].map((e) => e.id));
  for (const id of config?.exclude || []) if (!ids.includes(id)) ids.push(id);
  return rcEntitiesField("exclude", ids);
};

export const RoomOverviewCardEditor = rcEditor({
  card: RoomOverviewCard,
  helpers: ["title", "columns", "presence", "zoom", "all_off_button", "plugs_off_button", "exclude", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcOverviewFields(RO_I18N, lang),
    { name: "show_title", selector: { boolean: {} } },
    { name: "presence", selector: { boolean: {} } },
    { name: "zoom", selector: { boolean: {} } },
    { name: "all_off_button", selector: { boolean: {} } },
    { name: "plugs_off_button", selector: { boolean: {} } },
    ...rcIllustrationFields(RO_I18N, lang),
    {
      name: "exclude_areas",
      // The rooms the card finds, excluded ones included.
      selector: {
        select: {
          multiple: true,
          mode: "dropdown",
          options: hass
            ? rcProbe(RoomOverviewCard, hass, { ...config, exclude_areas: [], zoom: false })
                ._collect()
                .map((x) => ({ value: x.id, label: x.name }))
            : [],
        },
      },
    },
    ...roExcludeField(hass, config),
    ...rcAdvanced(RO_I18N, lang, "rooms", "language"),
  ],
});

rcRegister(
  RoomOverviewCard,
  RoomOverviewCardEditor,
  "Room Overview Card",
  "Every room at a glance: openings, presence, lights and plugs; tap a room for its details",
);
