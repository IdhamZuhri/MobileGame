# Overview

**MobileGame** is a top-down, open-world action RPG built for phones. It is plain HTML5 Canvas with ES modules: no engine, no build step, no dependencies.

## Core loop
1. Leave the **village** and explore the open world.
2. Your character **auto-attacks** the nearest enemy. You only steer.
3. Kills give **XP**, **gold** and sometimes **gear**.
4. Each **level-up** lets you pick 1 of 3 upgrades.
5. Equip better gear, complete **quests**, defeat **bosses**.
6. Return to the village to sell, buy, heal and claim quest rewards.
7. Go farther from home for tougher enemies and better rewards.

## Controls
| Input | Action |
|---|---|
| Drag anywhere on screen | Virtual joystick (touch or mouse) |
| WASD / arrow keys | Move (desktop) |
| 🎒 button (bottom right) | Open inventory |
| Button at bottom centre | Appears near a village station: tap to interact |
| ⟲ button (top right) | Reset all progress (asks to confirm) |
| Tap after dying | Respawn in the village (progress kept) |

## Current features
- Infinite procedural world, 7 terrain types plus the village plaza
- Auto-attack combat with biome-specific enemies
- XP, levels, 8 upgrades chosen at level-up
- 3 gear slots, 5 rarities, random affixes, compare-and-equip inventory
- Walled safe village with four gates, Merchant, Healer and Quest Board with a peaceful no-enemy, no-shooting zone around it
- 4 bosses guarding lairs across the world
- Rolling quests, gold economy
- Difficulty that grows with distance from the village
- Autosave in the browser (`localStorage`)

## Hosting
Served by GitHub Pages from the `main` branch root: `https://idhamzuhri.github.io/MobileGame/`. Merging to `main` redeploys in 1-2 minutes.
