# Architecture

## File layout
```
index.html        page shell: canvas, HUD, overlays (level-up, inventory, dialog), buttons
style.css         all styling
js/
  main.js         entry point: wiring, game loop, HUD, save/load, level-up UI, loot rules
  rng.js          seeded hash + value noise (deterministic world)
  world.js        tiles, biome table, chunked generation, village override, danger
  input.js        virtual joystick + keyboard
  enemies.js      ENEMY_TYPES, BOSS_TYPES, spawning, chase AI, boss bullet rings
  bosses.js       deterministic boss lairs, spawn/despawn, respawn cooldowns
  combat.js       player stats, auto-attack, projectiles, XP gems, damage text, level-ups
  upgrades.js     upgrade pool and level-up roll
  items.js        slots, rarities, stat definitions, item generation, effective stats, prices
  loot.js         ground drops and pickup
  inventory.js    inventory screen
  village.js      village stations (positions and drawing)
  town.js         village dialogs: shop, healer, quest board
  quests.js       quest generation and progress
  save.js         localStorage wrapper
docs/             this documentation
```

## Module dependencies
```
main ──┬─ world ── rng
       ├─ input
       ├─ enemies ── world
       ├─ bosses ── world, enemies, rng
       ├─ combat
       ├─ upgrades
       ├─ items ──── (used by loot, inventory, town, quests)
       ├─ loot, inventory, village, town, quests
       └─ save
```
`main.js` creates every object and connects them. Other modules receive what they need through constructors or callbacks (for example `combat.onKill`, `combat.isSafe`, `Town({...})`), so they do not import `main.js`.

## Game loop (`main.js`)
Each `requestAnimationFrame`:
1. `dt` = elapsed seconds, capped at 0.05.
2. `update(dt)`, skipped when dead or while any overlay (level-up, inventory, village dialog) is open:
   1. If level-ups are pending, show the choice overlay and stop.
   2. Move the player with axis-separated tile collision.
   3. `bosses.update` then `enemies.update` then `combat.update` then `loot.update`.
   4. Update the 🎒 count and the village interact button.
3. `draw()`: world, village, loot, enemies, combat effects, player, HUD.
4. Every 0.5 s the top-left text (biome, danger, fps) refreshes.

## Player object
```js
player = {
  x, y, r,
  stats,     // base: level, xp, hp, maxHp, dmg, attackCd, range, projSpeed, regen, speed, multi, magnet
  picks,     // upgrade id -> times chosen
  equipped,  // { weapon, armor, trinket }
  bag,       // array of items (max 20)
  gold,
  eff,       // EFFECTIVE stats = base + gear. Combat reads this.
  recalc(),  // recompute eff; call after any change to stats or gear
}
```
Rule: **upgrades and level-ups change `stats`; gear never does.** `eff = computeEffective(stats, equipped)`. Call `player.recalc()` after changing either. `hp`, `xp`, `level` live in `stats`.

## World coordinates
- Tile size 32 px. Chunks are 16x16 tiles, generated lazily and cached.
- Positions are in world pixels. The camera is centred on the player.
- Only tiles inside the screen are drawn.

## Rendering
Everything is drawn on one canvas, scaled by `devicePixelRatio` (capped at 2). Overlays (level-up cards, inventory, dialogs) are DOM elements above the canvas.

## Save data
`localStorage` key `mobilegame.save.v1`. See [systems.md](systems.md#saving).
