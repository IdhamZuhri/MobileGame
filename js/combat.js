// Player stats, auto-attack projectiles, XP gems, floating damage text.
export function xpForLevel(l) { return Math.round(10 + 8 * (l - 1) + 2 * (l - 1) ** 2); }

export function makePlayerStats() {
  return { level: 1, xp: 0, hp: 100, maxHp: 100, dmg: 12, attackCd: 0.7, range: 190, projSpeed: 380, regen: 0.5, speed: 150, multi: 1, magnet: 70 };
}

export class Combat {
  constructor(player, enemies) {
    this.player = player; this.enemies = enemies;
    this.projectiles = []; this.gems = []; this.texts = [];
    this.pendingLevelUps = 0; this.cd = 0; this.iframes = 0; this.dead = false; this.kills = 0;
  }

  update(dt) {
    const p = this.player, s = p.stats;
    if (this.dead) return;
    s.hp = Math.min(s.maxHp, s.hp + s.regen * dt);
    this.iframes = Math.max(0, this.iframes - dt);

    // Auto-attack the nearest enemy in range.
    this.cd -= dt;
    if (this.cd <= 0) {
      const t = this.enemies.nearest(p.x, p.y, s.range);
      if (t) {
        const base = Math.atan2(t.y - p.y, t.x - p.x), spread = 0.2;
        for (let i = 0; i < s.multi; i++) {
          const a = base + (i - (s.multi - 1) / 2) * spread;
          this.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * s.projSpeed, vy: Math.sin(a) * s.projSpeed, life: s.range / s.projSpeed + 0.15, dmg: s.dmg });
        }
        this.cd = s.attackCd;
      }
    }

    for (const pr of this.projectiles) {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      for (const e of this.enemies.list) {
        if (e.dead) continue;
        if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.r + 4) {
          this.damage(e, pr.dmg); pr.life = 0; break;
        }
      }
    }
    this.projectiles = this.projectiles.filter(pr => pr.life > 0);

    // Enemy contact damage.
    for (const e of this.enemies.list) {
      if (this.iframes <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r) {
        s.hp -= e.dmg; this.iframes = 0.6;
        this.text(p.x, p.y - 14, '-' + e.dmg, '#ff6b6b');
        if (s.hp <= 0) { s.hp = 0; this.dead = true; }
      }
    }

    // Gems get pulled toward the player and collected.
    for (const g of this.gems) {
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy);
      if (d < s.magnet) { const sp = 260 * dt; g.x += dx / d * sp; g.y += dy / d * sp; }
      if (d < p.r + 5) { g.taken = true; this.gainXp(g.xp); }
    }
    this.gems = this.gems.filter(g => !g.taken);

    for (const t of this.texts) { t.y -= 28 * dt; t.life -= dt; }
    this.texts = this.texts.filter(t => t.life > 0);
  }

  damage(e, amount) {
    e.hp -= amount; e.hit = 0.1;
    this.text(e.x, e.y - e.r - 6, String(amount), '#fff');
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; this.kills++;
      this.gems.push({ x: e.x, y: e.y, xp: e.xp });
    }
  }

  gainXp(n) {
    const s = this.player.stats;
    s.xp += n;
    while (s.xp >= xpForLevel(s.level)) {
      s.xp -= xpForLevel(s.level);
      s.level++;
      s.maxHp += 10; s.hp = s.maxHp;
      this.pendingLevelUps++;
      this.text(this.player.x, this.player.y - 26, 'LEVEL ' + s.level + '!', '#ffd24a');
    }
  }

  text(x, y, str, color) { this.texts.push({ x, y, str, color, life: 0.8 }); }

  draw(ctx, camX, camY) {
    for (const g of this.gems) {
      ctx.fillStyle = '#4fd1ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(g.x - camX, g.y - camY, 4, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#fff6b0';
    for (const pr of this.projectiles) { ctx.beginPath(); ctx.arc(pr.x - camX, pr.y - camY, 4, 0, 7); ctx.fill(); }
    ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(t.str, t.x - camX, t.y - camY);
      ctx.fillStyle = t.color; ctx.fillText(t.str, t.x - camX, t.y - camY);
    }
    ctx.globalAlpha = 1;
  }
}
