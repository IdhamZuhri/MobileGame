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

  draw(ctx, camX, camY) {
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
