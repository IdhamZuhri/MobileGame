import { TILE } from './world.js';

// Data-driven enemy table. `biomes` lists the tile ids where each type spawns.
export const ENEMY_TYPES = {
  slime:    { color: '#7ad36a', r: 9,  hp: 20, speed: 45, dmg: 5,  xp: 4,  biomes: ['grass', 'sand'] },
  goblin:   { color: '#4f9d3a', r: 9,  hp: 30, speed: 65, dmg: 7,  xp: 7,  biomes: ['forest'] },
  scorpion: { color: '#c0652a', r: 8,  hp: 28, speed: 75, dmg: 8,  xp: 8,  biomes: ['desert'] },
  wolf:     { color: '#9aa7b5', r: 10, hp: 40, speed: 95, dmg: 10, xp: 12, biomes: ['snow'] },
};

export class Enemies {
  constructor(world) {
    this.world = world;
    this.list = [];
    this.timer = 0;
    this.max = 40;
  }

  spawnNear(px, py, viewR) {
    const a = Math.random() * Math.PI * 2;
    const d = viewR + 40 + Math.random() * 80;
    const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    const tileId = this.world.tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
    if (this.world.isSolid(x, y)) return;
    const types = Object.entries(ENEMY_TYPES).filter(([, t]) => t.biomes.includes(tileId));
    if (!types.length) return;
    const [name, t] = types[Math.floor(Math.random() * types.length)];
    this.list.push({ type: name, ...t, x, y, maxHp: t.hp, hit: 0 });
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
      if (d > 700) { e.dead = true; continue; } // despawn when far away
      if (d > e.r + player.r - 2) {
        const nx = e.x + (dx / d) * e.speed * dt, ny = e.y + (dy / d) * e.speed * dt;
        if (!this.world.isSolid(nx, e.y)) e.x = nx;
        if (!this.world.isSolid(e.x, ny)) e.y = ny;
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
    for (const e of this.list) {
      const sx = e.x - camX, sy = e.y - camY;
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(sx, sy + e.r, e.r, 3.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = e.hit > 0 ? '#fff' : e.color;
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, e.r, 0, 7); ctx.fill(); ctx.stroke();
      if (e.hp < e.maxHp) {
        ctx.fillStyle = '#300'; ctx.fillRect(sx - 10, sy - e.r - 8, 20, 3);
        ctx.fillStyle = '#e44'; ctx.fillRect(sx - 10, sy - e.r - 8, 20 * e.hp / e.maxHp, 3);
      }
    }
  }
}
