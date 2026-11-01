import { TILE, TILES } from './world.js';
import { hash2 } from './rng.js';
import { BOSS_TYPES } from './enemies.js';

const REGION = 40;              // tiles per lair region
const RESPAWN_MS = 10 * 60 * 1000;

// Deterministic boss lairs: each region may hold one, spawned when the player approaches.
export class Bosses {
  constructor(world, enemies) {
    this.world = world; this.enemies = enemies;
    this.cooldowns = {};        // lairKey -> timestamp when the boss may return
    this.lairs = new Map();
  }

  lairAt(rx, ry) {
    const key = rx + ',' + ry;
    if (this.lairs.has(key)) return this.lairs.get(key);
    const w = this.world, seed = w.seed;
    let lair = null;
    if (hash2(rx, ry, seed + 555) < 0.6) {
      const tx = rx * REGION + 3 + Math.floor(hash2(rx, ry, seed + 556) * (REGION - 6));
      const ty = ry * REGION + 3 + Math.floor(hash2(rx, ry, seed + 557) * (REGION - 6));
      const tile = w.tileAt(tx, ty);
      const type = Object.keys(BOSS_TYPES).find(k => BOSS_TYPES[k].biomes.includes(tile));
      const farFromHome = !w.village || Math.hypot(tx - w.village.cx, ty - w.village.cy) > 30;
      if (type && !TILES[tile].solid && farFromHome) lair = { key, type, x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
    }
    this.lairs.set(key, lair);
    return lair;
  }

  nearbyLairs(player) {
    const rx = Math.floor(player.x / TILE / REGION), ry = Math.floor(player.y / TILE / REGION), out = [];
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const l = this.lairAt(rx + i, ry + j); if (l) out.push(l); }
    return out;
  }

  update(player) {
    const now = Date.now();
    for (const l of this.nearbyLairs(player)) {
      if ((this.cooldowns[l.key] || 0) > now) continue;
      const d = Math.hypot(l.x - player.x, l.y - player.y);
      const boss = this.enemies.list.find(e => e.lairKey === l.key && !e.dead);
      if (!boss && d < 420) this.enemies.spawnBoss(l.key, l.type, l.x, l.y);
      else if (boss && d > 1000) boss.dead = true;        // player ran away: the boss resets
    }
  }

  killed(boss) { this.cooldowns[boss.lairKey] = Date.now() + RESPAWN_MS; }

  // The closest living boss within sight, for the HUD bar.
  current(player) {
    let best = null, bd = 650;
    for (const e of this.enemies.list) {
      if (!e.boss || e.dead) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
}
