// The card source the tests evaluate: src/ assembled into one classic script as scripts/build.mjs does
// (scripts/bundle.mjs), placeholders (__VERSION__ and the like) left as they are.
import { bundle } from "../scripts/bundle.mjs";

export const roomCardSource = bundle("src/room-card/index.js");
export const roomEnvironmentCardSource = bundle("src/room-environment-card/index.js");
export const roomLightsCardSource = bundle("src/room-lights-card/index.js");
export const roomOverviewCardSource = bundle("src/room-overview-card/index.js");
export const roomSensorsCardSource = bundle("src/room-sensors-card/index.js");
export const sharedSource = bundle("src/shared/index.js");
// by former file name, for loaders that took one
export const sources = { "room-card.js": roomCardSource, "room-environment-card.js": roomEnvironmentCardSource, "room-lights-card.js": roomLightsCardSource, "room-overview-card.js": roomOverviewCardSource, "room-sensors-card.js": roomSensorsCardSource, "shared.js": sharedSource };
