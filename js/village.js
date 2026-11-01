import { TILE } from './world.js';

// The safe hub: three NPC stations laid out around the village centre (offsets in tiles).
export const STATIONS = [
  { id: 'shop',   name: 'Merchant',    icon: '🏪', color: '#b5651d', dx: -3.5, dy: -2.5 },
  { id: 'healer', name: 'Healer',      icon: '⛲', color: '#3a8fb7', dx: 3.5,  dy: -2.5 },
  { id: 'board',  name: 'Quest Board', icon: '📜', color: '#7a4f9a', dx: 0,    dy: 3.2 },
];

export class Village {
  constructor(world) {
    this.world = world;
    const c = world.villagePx();
    this.stations = STATIONS.map(s => ({ ...s, x: c.x + s.dx * TILE, y: c.y + s.dy * TILE }));
  }

  nearest(player, range = 54) {
    let best = null, bd = range;
    for (const s of this.stations) { const d = Math.hypot(s.x - player.x, s.y - player.y); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  // Two stone towers and a wooden beam over each of the four gates.
  drawGates(ctx, camX, camY) {
    const v = this.world.village, c = this.world.villagePx(), reach = (v.r + 0.5) * TILE, half = 1.5 * TILE;
    for (const [ux, uy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
      const gx = c.x + ux * reach - camX, gy = c.y + uy * reach - camY;
      const px = -uy, py = ux; // perpendicular to the gate direction
      const towers = [[gx + px * half, gy + py * half], [gx - px * half, gy - py * half]];
      ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(towers[0][0], towers[0][1] - 26); ctx.lineTo(towers[1][0], towers[1][1] - 26); ctx.stroke();
      for (const [tx, ty] of towers) {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(tx - 11, ty + 12, 22, 7);
        ctx.fillStyle = '#7d7468'; ctx.fillRect(tx - 10, ty - 30, 20, 44);
        ctx.fillStyle = '#5c544a'; ctx.fillRect(tx - 10, ty - 30, 20, 7);
        ctx.fillStyle = '#8f8678';
        for (let i = 0; i < 3; i++) ctx.fillRect(tx - 10 + i * 8, ty - 36, 5, 7);      // battlements
        ctx.fillStyle = '#c0392b'; ctx.fillRect(tx - 1, ty - 52, 2, 16); ctx.fillRect(tx + 1, ty - 52, 9, 6); // flag
      }
    }
  }

  draw(ctx, camX, camY) {
    this.drawGates(ctx, camX, camY);
    for (const s of this.stations) {
      const x = s.x - camX, y = s.y - camY;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 22, y + 14, 44, 6);
      ctx.fillStyle = s.color; ctx.fillRect(x - 20, y - 14, 40, 30);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - 20, y - 14, 40, 8);
      ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(s.icon, x, y + 10);
      ctx.font = 'bold 11px system-ui';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(s.name, x, y - 20);
      ctx.fillText(s.name, x, y - 20);
    }
  }
}
