const fs = require('fs');
let text = fs.readFileSync('LEVEL_DESIGN.md', 'utf8');

const target = `- **Prank types:** \`runningFloor\`, \`popupSpikes\`, \`speechSign\`, \`runawayGoal\`, \`fakeHazard\`, \`wallAppear\`, \`shiftPlatform\`, and the existing \`vanishingRoad\`, \`shiftDown\` and \`reappearingPlatform\`.`;

const replacement = `- **Prank types:** \`runningFloor\`, \`popupSpikes\`, \`speechSign\`, \`runawayGoal\`, \`fakeHazard\`, \`wallAppear\`, \`shiftPlatform\`, \`falseAlarm\`, and the existing \`vanishingRoad\`, \`shiftDown\` and \`reappearingPlatform\`.
  - \`falseAlarm {x, triggerX or triggerPlatform, tellMs (default 322), bubbleText}\`: A fake threat that looks and sounds like the tell of a stalactiteDrop but nothing ever falls. When it fires (the player's body center passes triggerX moving right, or he stands on triggerPlatform), for tellMs (default 322) a dust trickle (6 to 8 pooled particles, the same look as the stalactiteDrop tell) falls from the ceiling at x, the camera trembles about 2 px, and a soft rumble plays if the sound system has one. When the tell ends, a speech bubble with bubbleText appears at x, above head height, for 1.5 seconds, using the same readable look as the signs (dark panel, light text, at least 16 px, kept inside the camera and below the top HUD). Nothing else happens: no hitbox, no collider, no change to any surface; it never kills and never changes a platform. It fires once per attempt.
  - \`vanishingRoad {x, w, triggerX, tellMs, fallMs}\`: Ground tiles (built from the ground art, never stretched more than 15 percent) shake for tellMs with dust and rumble, then all fall and fade at once, the collider switches off, and they return on death, respawn and restart.`;

const ruleTarget = `- **Stalactite pranks:**`;
const ruleInsert = `- **False alarms:** a harmless prank that copies the tell of a dangerous one. At most two per level, never in two consecutive levels, never within 700 px of a real prank, and its bubble text is a short friendly joke. A level that uses a false alarm also uses at least one real prank.\n- **Stalactite pranks:**`;

text = text.replace(target, replacement);
text = text.replace(ruleTarget, ruleInsert);

fs.writeFileSync('LEVEL_DESIGN.md', text, 'utf8');
console.log('LEVEL_DESIGN.md updated successfully');

