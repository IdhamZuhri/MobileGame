import { fbm, hash2 } from './rng.js';

export const TILE = 32;

// Data-driven biome table: add a biome here and it appears in the world.
export const TILES = {
  deepwater: { name: 'Deep Water', color: '#1d4e89', solid: true },
  water:     { name: 'Water',      color: '#2f7fc1', solid: true },
  sand:      { name: 'Beach',      color: '#e3d08f' },
  grass:     { name: 'Plains',     color: '#6bb35a' },
  forest:    { name: 'Forest',     color: '#3f8a45', deco: 'tree' },
  desert:    { name: 'Desert',     color: '#d9b25f', deco: 'cactus' },
  snow:      { name: 'Tundra',     color: '#e8f1f5', deco: 'pine' },
  mountain:  { name: 'Mountains',  color: '#7b7f86', solid: true },
  plaza:     { name: 'Home Village', color: '#c9b98f' },
};

export class World {
  constructor(seed = 1337) {
    this.seed = seed;
    this.cache = new Map(); // chunk key -> Uint8 array of tile ids
    this.ids = Object.keys(TILES);
    this.village = null; // { cx, cy, r } in tiles; the safe hub
  }

  setVillage(cx, cy, r) { this.village = { cx, cy, r }; this.cache.clear(); }

  villagePx() { return { x: (this.village.cx + 0.5) * TILE, y: (this.village.cy + 0.5) * TILE }; }
  inVillage(x, y) {
    const v = this.village;
    return !!v && Math.hypot(x / TILE - v.cx - 0.5, y / TILE - v.cy - 0.5) <= v.r;
  }
  // Enemies get tougher the farther you roam from the village.
  danger(x, y) {
    if (!this.village) return 1;
    const c = this.villagePx();
    return 1 + Math.min(3, Math.hypot(x - c.x, y - c.y) / 3500);
  }

  // Find a flat, walkable site (prefer grass) for the village hub.
  findVillageSite() {
    const flat = (tx, ty) => {
      for (let dy = -7; dy <= 7; dy += 2) for (let dx = -7; dx <= 7; dx += 2)
        if (TILES[this.generate(tx + dx, ty + dy)].solid) return false;
      return true;
    };
    for (const wantGrass of [true, false])
      for (let r = 0; r < 150; r += 2)
        for (let a = 0; a < 24; a++) {
          const tx = Math.round(Math.cos(a / 24 * 6.2832) * r), ty = Math.round(Math.sin(a / 24 * 6.2832) * r);
          if (wantGrass && this.generate(tx, ty) !== 'grass') continue;
          if (flat(tx, ty)) return { x: tx, y: ty };
        }
    return { x: 0, y: 0 };
  }

  // Procedurally decide a tile from elevation / moisture / temperature noise.
  generate(tx, ty) {
    if (this.village && Math.hypot(tx - this.village.cx, ty - this.village.cy) <= this.village.r) return 'plaza';
    const s = this.seed;
    const e = fbm(tx / 40, ty / 40, s, 4);
    const m = fbm(tx / 55, ty / 55, s + 7, 3);
    const t = fbm(tx / 90, ty / 90, s + 13, 2);
    if (e < 0.30) return 'deepwater';
    if (e < 0.38) return 'water';
    if (e < 0.42) return 'sand';
    if (e > 0.72) return 'mountain';
    if (t < 0.33) return 'snow';
    if (t > 0.66 && m < 0.5) return 'desert';
    if (m > 0.55) return 'forest';
    return 'grass';
  }

  tileAt(tx, ty) {
    const CH = 16;
    const cx = Math.floor(tx / CH), cy = Math.floor(ty / CH);
    const key = cx + ',' + cy;
    let chunk = this.cache.get(key);
    if (!chunk) {
      chunk = new Array(CH * CH);
      for (let j = 0; j < CH; j++)
        for (let i = 0; i < CH; i++)
          chunk[j * CH + i] = this.generate(cx * CH + i, cy * CH + j);
      this.cache.set(key, chunk);
    }
    return chunk[(ty - cy * CH) * CH + (tx - cx * CH)];
  }

  tileAtPx(x, y) { return TILES[this.tileAt(Math.floor(x / TILE), Math.floor(y / TILE))]; }
  isSolid(x, y) { return !!this.tileAtPx(x, y).solid; }

  // Find a walkable spawn point near the origin.
  findSpawn() {
    for (let r = 0; r < 200; r++)
      for (let a = 0; a < 16; a++) {
        const tx = Math.round(Math.cos(a) * r), ty = Math.round(Math.sin(a) * r);
        if (!TILES[this.tileAt(tx, ty)].solid) return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
      }
    return { x: 0, y: 0 };
  }

  draw(ctx, camX, camY, w, h) {
    const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
    const x1 = Math.floor((camX + w) / TILE), y1 = Math.floor((camY + h) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const tile = TILES[this.tileAt(tx, ty)];
        const px = Math.floor(tx * TILE - camX), py = Math.floor(ty * TILE - camY);
        const shade = (hash2(tx, ty, this.seed) - 0.5) * 0.08;
        ctx.fillStyle = tile.color;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
        ctx.fillRect(px, py, TILE, TILE);
        if (tile.deco && hash2(tx, ty, this.seed + 99) < 0.35) this.drawDeco(ctx, tile.deco, px, py);
      }
    }
  }

  drawDeco(ctx, kind, px, py) {
    const cx = px + TILE / 2;
    if (kind === 'tree') {
      ctx.fillStyle = '#5a3b1f'; ctx.fillRect(cx - 2, py + 18, 4, 9);
      ctx.fillStyle = '#245c2c'; ctx.beginPath(); ctx.arc(cx, py + 14, 9, 0, 7); ctx.fill();
    } else if (kind === 'cactus') {
      ctx.fillStyle = '#3c7a3a'; ctx.fillRect(cx - 2, py + 8, 4, 16); ctx.fillRect(cx - 7, py + 13, 5, 3); ctx.fillRect(cx + 2, py + 11, 5, 3);
    } else if (kind === 'pine') {
      ctx.fillStyle = '#2d5a45';
      ctx.beginPath(); ctx.moveTo(cx, py + 4); ctx.lineTo(cx + 8, py + 24); ctx.lineTo(cx - 8, py + 24); ctx.fill();
    }
  }
}
