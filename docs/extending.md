# Extending the game

Most content is data. Each recipe lists the file to edit. Test by loading the page and checking the browser console for errors.

## Add a biome
1. `world.js` TILES: add an entry `{ name, color, solid?, deco? }`.
2. `world.js` `generate()`: add the rule that returns its id.
3. If it has a `deco`, add a draw case in `drawDeco`.
4. Add enemies that list it in `biomes` (below), otherwise nothing spawns there.

## Add an enemy
`enemies.js` ENEMY_TYPES: add `id: { color, r, hp, speed, dmg, xp, biomes: [...] }`. It spawns automatically and can be used by "kill type" quests.

## Add a boss
`enemies.js` BOSS_TYPES: add an entry with a `ring` count and `biomes`. Lairs pick the first boss whose `biomes` contains the lair tile, so a biome should have at most one boss, or edit `lairAt` in `bosses.js` to choose by hash.

## Add an upgrade
`upgrades.js` UPGRADES: add `{ icon, name, desc, apply(stats), max? }`. `apply` edits the **base** `stats`. If it needs a new stat, add it to `makePlayerStats()` in `combat.js` and use it through `player.eff` (extend `computeEffective` if gear should affect it).

## Add a gear stat
1. `items.js` STATS: add `{ label, base, per, int? | dec? }`.
2. `computeEffective`: apply it to `e`.
3. Use the new `eff` value where needed (combat, movement).

## Add a gear slot
1. `items.js` SLOTS: add `{ label, icon, bases, primary }`.
2. `main.js`: add the key to the `equipped` objects (new game and load).
3. `inventory.js` and `town.js` read `SLOTS` automatically.

## Add a village station
1. `village.js` STATIONS: add `{ id, name, icon, color, dx, dy }`.
2. `town.js`: add a method for it and register it in the `render()` lookup.

## Add a quest type
1. `quests.js` `makeQuest`: add a branch that builds the quest object.
2. Add a hook (like `onKill` or `onPickup`) and call it from `main.js` where the event happens.

## Add a stat to the save file
Add the field to `snapshot()` and read it in the load block in `main.js`. Always supply a default for old saves.

## Change balance
Numbers worth tuning: enemy `hp/dmg` tables, danger divisor in `world.danger`, `dropChance` and rarity `weight` in `items.js`, crate prices in `town.js`, XP curve in `combat.js`.
