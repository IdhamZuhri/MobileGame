# Data tables

Where each table lives in code is shown in the heading.

## Terrain (`world.js` TILES)
| Id | Name | Solid | Decoration |
|---|---|---|---|
| deepwater | Deep Water | yes | |
| water | Water | yes | |
| sand | Beach | | |
| grass | Plains | | |
| forest | Forest | | tree |
| desert | Desert | | cactus |
| snow | Tundra | | pine |
| mountain | Mountains | yes | |
| plaza | Home Village | | |
| wall | Village Wall | yes | brick pattern |
| gate | Village Gate | | plank pattern |

## Enemies (`enemies.js` ENEMY_TYPES)
Base values before danger scaling.

| Id | HP | Speed | Damage | XP | Biomes |
|---|---|---|---|---|---|
| slime | 20 | 45 | 5 | 4 | plains, beach |
| goblin | 30 | 65 | 7 | 7 | forest |
| scorpion | 28 | 75 | 8 | 8 | desert |
| wolf | 40 | 95 | 10 | 12 | tundra |

## Bosses (`enemies.js` BOSS_TYPES)
| Id | Name | HP | Speed | Damage | XP | Radius | Bullets per ring | Biomes |
|---|---|---|---|---|---|---|---|---|
| slimeking | Slime King | 400 | 38 | 12 | 80 | 24 | 8 | plains, beach |
| treant | Elder Treant | 550 | 32 | 14 | 110 | 26 | 10 | forest |
| wyrm | Sand Wyrm | 500 | 60 | 15 | 110 | 24 | 8 | desert |
| giant | Frost Giant | 650 | 45 | 18 | 130 | 28 | 12 | tundra |

## Player base stats (`combat.js` makePlayerStats)
| Stat | Start |
|---|---|
| level | 1 |
| hp / maxHp | 100 |
| dmg | 12 |
| attackCd (seconds) | 0.7 |
| range (px) | 190 |
| projSpeed (px/s) | 380 |
| regen (HP/s) | 0.5 |
| speed (px/s) | 150 |
| multi (projectiles) | 1 |
| magnet (px) | 70 |

## Upgrades (`upgrades.js`)
| Id | Name | Effect | Max picks |
|---|---|---|---|
| power | Power | +20% damage (+1) | unlimited |
| rapid | Rapid Fire | attack cooldown x0.85 (min 0.2 s) | 8 |
| vitality | Vitality | +30 max HP and heal 30 | unlimited |
| swift | Swift | +8% move speed | 8 |
| reach | Reach | +15% attack range | 6 |
| multi | Multishot | +1 projectile | 4 |
| regen | Regrowth | +0.6 HP/s | 8 |
| magnet | Magnet | +40% pickup range | 5 |

## Rarities (`items.js` RARITIES)
| Index | Name | Colour | Stat multiplier | Base weight | Extra affixes |
|---|---|---|---|---|---|
| 0 | Common | grey | 1.00 | 60 | 0 |
| 1 | Uncommon | green | 1.25 | 26 | 1 |
| 2 | Rare | blue | 1.55 | 10 | 2 |
| 3 | Epic | purple | 1.95 | 3.2 | 3 |
| 4 | Legendary | orange | 2.50 | 0.8 | 4 |

## Gear slots (`items.js` SLOTS)
| Slot | Primary stat | Example base names |
|---|---|---|
| weapon | Damage | Wand, Staff, Bow, Dagger, Spear |
| armor | Max HP | Vest, Cloak, Plate, Robe, Mail |
| trinket | Move speed % | Amulet, Ring, Charm, Talisman |

## Gear stats (`items.js` STATS)
Value at item level `L` = `base + per * (L - 1)`, then multiplied as described in [systems.md](systems.md#gear-itemsjs-lootjs-inventoryjs).

| Key | Label | Base | Per level |
|---|---|---|---|
| dmg | Damage | 3 | 1.4 |
| maxHp | Max HP | 12 | 4.5 |
| armor | Armor | 1 | 0.5 |
| regen | HP/sec | 0.3 | 0.12 |
| speedPct | Move speed % | 4 | 0.5 |
| atkSpeedPct | Attack speed % | 5 | 0.6 |
| rangePct | Range % | 5 | 0.5 |
| magnetPct | Pickup range % | 12 | 1.5 |
| dmgPct | Damage % | 4 | 0.7 |

## Economy
| Item | Price |
|---|---|
| Supply Crate (uncommon or better) | 60 + 12 x level |
| Knight Crate (rare or better) | 220 + 35 x level |
| Royal Crate (epic or better) | 800 + 100 x level |
| Sell any item | `round((2 + 2 x ilvl) x (1 + 1.6 x rarity))` |

## Village stations (`village.js` STATIONS)
| Id | Name | Offset from centre (tiles) |
|---|---|---|
| shop | Merchant | -3.5, -2.5 |
| healer | Healer | 3.5, -2.5 |
| board | Quest Board | 0, 3.2 |
