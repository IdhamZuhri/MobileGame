import { World, TILE, TILES } from './world.js';
import { Input } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudBiome = document.getElementById('hud-biome');
const hudPos = document.getElementById('hud-pos');
const hudFps = document.getElementById('hud-fps');

const world = new World(1337);
const input = new Input(canvas);
const spawn = world.findSpawn();
const player = { x: spawn.x, y: spawn.y, r: 9, speed: 150 };

let W = 0, H = 0;
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

// Axis-separated collision against solid tiles (checks the 4 corners of the player box).
function blocked(x, y) {
  const r = player.r;
  return world.isSolid(x - r, y - r) || world.isSolid(x + r, y - r) ||
         world.isSolid(x - r, y + r) || world.isSolid(x + r, y + r);
}

function update(dt) {
  const a = input.axis();
  const nx = player.x + a.x * player.speed * dt;
  const ny = player.y + a.y * player.speed * dt;
  if (!blocked(nx, player.y)) player.x = nx;
  if (!blocked(player.x, ny)) player.y = ny;
}

function draw() {
  const camX = player.x - W / 2, camY = player.y - H / 2;
  world.draw(ctx, camX, camY, W, H);
  // player
  const sx = W / 2, sy = H / 2;
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(sx, sy + player.r, player.r, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = '#7a4b00'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(sx, sy, player.r, 0, 7); ctx.fill(); ctx.stroke();
}

let last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  draw();
  fpsAcc += dt; fpsN++;
  if (fpsAcc >= 0.5) {
    hudFps.textContent = Math.round(fpsN / fpsAcc) + ' fps';
    hudPos.textContent = `${Math.floor(player.x / TILE)}, ${Math.floor(player.y / TILE)}`;
    hudBiome.textContent = world.tileAtPx(player.x, player.y).name;
    fpsAcc = 0; fpsN = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook
window.__game = { player, world, TILES };
