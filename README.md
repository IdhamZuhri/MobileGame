# MobileGame

Top-down open-world action RPG for phones, built with plain HTML5 Canvas (no build step).

## Run
Serve the folder with any static server and open it on your phone or desktop:

    python3 -m http.server 8000

Controls: drag anywhere (virtual joystick) or WASD / arrow keys.

## Structure
- `js/rng.js` – seeded noise
- `js/world.js` – procedural chunked world + data-driven biome table
- `js/input.js` – joystick + keyboard
- `js/enemies.js` – data-driven enemy table, biome-based spawning, chase AI
- `js/combat.js` – player stats, auto-attack projectiles, XP gems, damage text
- `js/main.js` – game loop, player, camera

## Roadmap
1. ✅ Core movement + procedural world
2. ✅ Combat: auto-attack, enemies, XP
3. Progression: levels, stats, saving
4. Gear + inventory
5. Bosses, quests, village hub
6. PWA + GitHub Pages deploy
