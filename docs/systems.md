# Systems

All numbers below match the code at the time of writing. If you change a number in code, update it here.

## World (`world.js`, `rng.js`)
- Seed `1337` (fixed). Value-noise fractal (`fbm`) gives three fields per tile: elevation `e`, moisture `m`, temperature `t`.
- Tile decision, first match wins:

| Condition | Tile |
|---|---|
| within 6 tiles of the village centre | plaza |
| 6-7 tiles from the centre | wall (solid), or gate on the 4 compass openings (3 tiles wide) |
| e < 0.30 | deep water (solid) |
| e < 0.38 | water (solid) |
| e < 0.42 | beach |
| e > 0.72 | mountains (solid) |
| t < 0.33 | tundra (snow) |
| t > 0.66 and m < 0.5 | desert |
| m > 0.55 | forest |
| otherwise | plains |

- Decorations (trees, cactus, pines) appear on about 35% of forest, desert and tundra tiles.
- **Danger** at a point = `1 + min(3, distanceFromVillage / 3500)`. It multiplies enemy HP, damage and XP.

## Movement (`main.js`, `input.js`)
- Speed = `eff.speed` (base 150 px/s).
- X and Y movement are tested separately, so you slide along walls. The player box is 4 corners at radius 9.
- Joystick radius is 50 px. Keyboard and joystick are combined and clamped to length 1.

## Combat (`combat.js`, `enemies.js`)
- **Auto-attack:** every `attackCd` seconds, fire at the nearest enemy within `range`. `multi` projectiles are fanned 0.2 rad apart. Projectile speed 380 px/s.
- **Contact damage:** an enemy touching you deals `max(1, enemy.dmg - armor)`, then you get 0.6 s of invulnerability.
- **Regeneration:** `regen` HP per second, capped at effective max HP.
- **Death:** the death screen appears. Tapping respawns you in the village at full HP. Nothing is lost.
- **Peaceful zone:** within 7 tiles beyond the plaza edge (13 tiles from the village centre) no enemy spawns, and any enemy that walks in vanishes. You cannot auto-attack there either, so you can't shoot monsters from the edge. The top bar shows 🛡 peaceful.
- **Safe zone:** inside the plaza, contact damage and enemy bullets are ignored, and enemies cannot enter. **You cannot auto-attack here or in the peaceful zone**, so the village is a refuge and not a place to farm from. Fight beyond the peaceful zone.
- **Enemy spawning:** one spawn attempt every `max(0.35, 1.2 - 0.05 * level)` seconds, up to 40 enemies. They appear 40-120 px beyond the screen edge, on non-solid, non-village tiles, with a type matching the biome. Enemies farther than 700 px are removed. They also never spawn in the peaceful zone.
- **Enemy AI:** walk straight at the player, blocked by solid tiles and the village. Soft separation stops them stacking.
- **XP gems:** dropped on death, pulled toward you inside `magnet` range (base 70 px), collected on touch.

## Levels and upgrades (`combat.js`, `upgrades.js`)
- XP needed for the next level: `10 + 8(L-1) + 2(L-1)^2`.
- Each level: +10 max HP, full heal, and one upgrade choice. Several level-ups queue, one overlay each.
- Choices: 3 random upgrades from those not yet at their `max`. Picking applies it and resumes the game.
- Upgrades are listed in [data-tables.md](data-tables.md#upgrades).

## Gear (`items.js`, `loot.js`, `inventory.js`)
- **Slots:** weapon (primary stat Damage), armor (Max HP), trinket (Move speed %).
- **Item** = `{ slot, rarity (0-4), ilvl, name, stats }`.
- **Generation:** pick rarity, then roll the primary stat, then roll `affixes` extra distinct stats from the pool.
- **Rarity roll:** weights 60 / 26 / 10 / 3.2 / 0.8. Weight of rarity `i` is multiplied by `1 + i * playerLevel * 0.03`, so higher levels shift odds toward rarer items.
- **Stat value:** `(base + per * (ilvl - 1)) * rarityMult * random(0.85-1.15)`. Affixes use an extra 0.7 multiplier.
- **Effective stats** (`computeEffective`): flat damage is added first, then Damage % multiplies it. Attack speed % divides the cooldown (minimum 0.15 s). Armor comes only from gear.
- **Drops:** a kill drops gear with chance `min(0.35, 0.05 + 0.006 * enemy.xp)`. Item level = player level.
- **Pickup:** walk over the drop. An empty slot auto-equips it, otherwise it goes to the bag (max 20). A full bag leaves the item on the ground. Ground items vanish after 3 minutes.
- **Inventory UI:** tap an item to see its stats. Green and red arrows compare it to the item you wear in that slot. Actions: Equip (swaps with the worn item), Unequip, Discard.

## Village (`village.js`, `town.js`)
- A flat plaza of radius 6 tiles, placed at the first flat grass area found by spiralling out from the origin.
- A stone wall ring surrounds the plaza. It has four 3-tile-wide gates (north, south, east, west), each with two towers and a wooden beam. The wall blocks the player, so you must leave through a gate.
- Stations (tap the bottom-centre button within 54 px):
  - **Merchant:** buy crates, sell bag items, sell all commons.
  - **Healer:** free full heal.
  - **Quest Board:** view and claim quests.
- Prices and sell values are in [data-tables.md](data-tables.md#economy).

## Quests (`quests.js`)
- Always 3 active quests. Claiming one pays out and creates a replacement.
- Types:

| Type | Goal | Reward |
|---|---|---|
| kill any | `8 + 2*level` monsters | gold `5*need*(1+0.1*level)`, XP `3*need` |
| kill type | `5 + level` of one enemy type | same formula |
| gear | pick up 3 items | 40 + 10*level gold, 20 + 6*level XP |
| boss | defeat 1 boss | 120 + 25*level gold, 60 + 15*level XP, plus a rare+ item |

- Progress counts only while the quest is active. Bosses count only toward boss quests, not kill quests.
- A full bag on claim drops the reward item at your feet.

## Bosses (`bosses.js`, `enemies.js`)
- The world is divided into **40x40 tile regions**. Each has a 60% chance of a lair at a fixed tile, if that tile is walkable, belongs to a biome that has a boss, and is more than 30 tiles from the village.
- A boss spawns when you come within 420 px of its lair. If you move farther than 1000 px away, it despawns and resets.
- After a kill the lair is on cooldown for 10 minutes.
- **Attack:** every 3 s (only if you are within 520 px) it fires a ring of bullets at 130 px/s, each dealing 70% of the boss's damage. It also hurts on contact.
- **Rewards:** gold `40 + xp`, a big XP gem, two items at level + 2 with rarity 55% rare, 33% epic, 12% legendary.
- A boss bar appears at the bottom of the screen when one is within 650 px.

## Gold
- Normal kills: `max(1, round(xp * 0.6))`. Bosses: `40 + xp`.
- Spent on crates. Earned from kills, quests and selling.

## Saving (`save.js`, `main.js`)
- Key: `mobilegame.save.v1` in `localStorage`.
- Saved: position, `stats`, `picks`, kills, pending level-ups, `equipped`, `bag`, `gold`, `quests`, boss cooldowns.
- When: every 5 seconds, on tab hide, on page close, after picking an upgrade, on equip changes, when closing a village dialog and on respawn.
- Loading merges saved stats over fresh defaults, so adding a new stat in a later version does not break old saves.
- Not saved while dead. The reset button sets a flag so the closing autosave cannot rewrite the save.
- Saves live in one browser on one device. Clearing site data erases them.
