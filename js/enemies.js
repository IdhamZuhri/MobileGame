import { TILE } from './world.js';

// Data-driven enemy table. `biomes` lists the tile ids where each type spawns.
export const ENEMY_TYPES = {
  slime:    { color: '#7ad36a', r: 9,  hp: 20, speed: 45, dmg: 5,  xp: 4,  biomes: ['grass', 'sand'] },
  goblin:   { color: '#4f9d3a', r: 9,  hp: 30, speed: 65, dmg: 7,  xp: 7,  biomes: ['forest'] },
  scorpion: { color: '#c0652a', r: 8,  hp: 28, speed: 75, dmg: 8,  xp: 8,  biomes: ['desert'] },
  wolf:     { color: '#9aa7b5', r: 10, hp: 40, speed: 95, dmg: 10, xp: 12, biomes: ['snow'] },
};

// Bosses guard lairs scattered across the world. `ring` = bullets per burst.
export const BOSS_TYPES = {
  slimeking: { name: 'Slime King',   color: '#59c957', r: 24, hp: 400, speed: 38, dmg: 12, xp: 80,  ring: 8,  biomes: ['grass', 'sand'] },
  treant:    { name: 'Elder Treant', color: '#2f6b34', r: 26, hp: 550, speed: 32, dmg: 14, xp: 110, ring: 10, biomes: ['forest'] },
  wyrm:      { name: 'Sand Wyrm',    color: '#c0652a', r: 24, hp: 500, speed: 60, dmg: 15, xp: 110, ring: 8,  biomes: ['desert'] },
  giant:     { name: 'Frost Giant',  color: '#8fc8ee', r: 28, hp: 650, speed: 45, dmg: 18, xp: 130, ring: 12, biomes: ['snow'] },
};

export class Enemies {
  constructor(world) {
    this.world = world;
    this.list = [];
    this.shots = []; // hostile projectiles fired by bosses
    this.timer = 0;
    this.max = 40;
  }

  spawnNear(px, py, viewR) {
    const a = Math.random() * Math.PI * 2;
    const d = viewR + 40 + Math.random() * 80;
    const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    const tileId = this.world.tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
    if (this.world.isSolid(x, y) || this.world.inHaven(x, y)) return;
    const types = Object.entries(ENEMY_TYPES).filter(([, t]) => t.biomes.includes(tileId));
    if (!types.length) return;
    const [name, t] = types[Math.floor(Math.random() * types.length)];
    const k = this.world.danger(x, y);   // tougher far from home
    this.list.push({ type: name, ...t, x, y, hp: Math.round(t.hp * k), maxHp: Math.round(t.hp * k), dmg: Math.round(t.dmg * k), xp: Math.round(t.xp * k), hit: 0 });
  }

  spawnBoss(key, type, x, y) {
    const t = BOSS_TYPES[type], k = this.world.danger(x, y);
    const hp = Math.round(t.hp * k);
    this.list.push({ type, boss: true, lairKey: key, ...t, x, y, hp, maxHp: hp, dmg: Math.round(t.dmg * k), xp: Math.round(t.xp * k), hit: 0, shotTimer: 2 });
  }

  update(dt, player, level) {
    this.timer -= dt;
    if (this.timer <= 0 && this.list.length < this.max) {
      this.timer = Math.max(0.35, 1.2 - level * 0.05);
      const before = this.list.length;
      for (let i = 0; i < 12 && this.list.length === before; i++)
        this.spawnNear(player.x, player.y, Math.hypot(innerWidth, innerHeight) / 2);
    }
    for (const e of this.list) {
      const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.boss) {
        e.shotTimer -= dt;
        if (e.shotTimer <= 0 && d < 520) {
          e.shotTimer = 3;
          const off = Math.random() * 6.28;
          for (let i = 0; i < e.ring; i++) {
            const a = off + i / e.ring * 6.2832;
            this.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, life: 3, dmg: Math.round(e.dmg * 0.7) });
          }
        }
      } else if (d > 700) { e.dead = true; continue; } // despawn when far away
      if (this.world.inHaven(e.x, e.y)) { e.dead = true; continue; } // monsters vanish at the edge of the peaceful zone
      if (d > e.r + player.r - 2) {
        const nx = e.x + (dx / d) * e.speed * dt, ny = e.y + (dy / d) * e.speed * dt;
        if (!this.world.isSolid(nx, e.y) && !this.world.inVillage(nx, e.y)) e.x = nx;
        if (!this.world.isSolid(e.x, ny) && !this.world.inVillage(e.x, ny)) e.y = ny;
      }
      e.hit = Math.max(0, e.hit - dt);
    }
    // Soft separation so enemies don't stack on one pixel.
    for (let i = 0; i < this.list.length; i++)
      for (let j = i + 1; j < this.list.length; j++) {
        const a = this.list[i], b = this.list[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.r + b.r;
        if (d < min) {
          const push = (min - d) / 2 * 0.5;
          a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
        }
      }
    this.list = this.list.filter(e => !e.dead);
    for (const sh of this.shots) { sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt; }
    this.shots = this.shots.filter(sh => sh.life > 0);
  }

  nearest(x, y, range) {
    let best = null, bd = range;
    for (const e of this.list) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  draw(ctx, camX, camY) {
    ctx.fillStyle = '#ff5a5a';
    for (const sh of this.shots) { ctx.beginPath(); ctx.arc(sh.x - camX, sh.y - camY, 5, 0, 7); ctx.fill(); }
    for (const e of this.list) {
      const sx = e.x - camX, sy = e.y - camY;
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(sx, sy + e.r, e.r, 3.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = e.hit > 0 ? '#fff' : e.color;
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, e.r, 0, 7); ctx.fill(); ctx.stroke();
      if (e.hp < e.maxHp) {
        const bw = Math.max(20, e.r * 2);
        ctx.fillStyle = '#300'; ctx.fillRect(sx - bw / 2, sy - e.r - 8, bw, 3);
        ctx.fillStyle = '#e44'; ctx.fillRect(sx - bw / 2, sy - e.r - 8, bw * e.hp / e.maxHp, 3);
      }
    }
  }
}
