import { RARITIES, SLOTS } from './items.js';

// Gear lying on the ground until the player walks over it.
export class Loot {
  constructor() { this.drops = []; }
  add(x, y, item) { this.drops.push({ x, y, item, t: 0 }); }

  update(dt, player, onPickup) {
    for (const d of this.drops) {
      d.t += dt;
      if (Math.hypot(d.x - player.x, d.y - player.y) < player.r + 12 && onPickup(d.item)) d.taken = true;
    }
    this.drops = this.drops.filter(d => !d.taken && d.t < 180); // despawn after 3 minutes
  }

  draw(ctx, camX, camY) {
    for (const d of this.drops) {
      const col = RARITIES[d.item.rarity].color;
      const x = d.x - camX, y = d.y - camY + Math.sin(d.t * 4) * 2;
      ctx.fillStyle = col; ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.arc(x, y, 14 + d.item.rarity * 2, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = '16px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(SLOTS[d.item.slot].icon, x, y + 6);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.stroke();
    }
  }
}
