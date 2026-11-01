import { World, TILE, TILES } from './world.js';
import { Input } from './input.js';
import { Enemies } from './enemies.js';
import { Combat, makePlayerStats, xpForLevel } from './combat.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudBiome = document.getElementById('hud-biome');
const hudPos = document.getElementById('hud-pos');
const hudFps = document.getElementById('hud-fps');

const world = new World(1337);
const input = new Input(canvas);
const spawn = world.findSpawn();
const player = { x: spawn.x, y: spawn.y, r: 9, speed: 150, stats: makePlayerStats() };
const enemies = new Enemies(world);
const combat = new Combat(player, enemies);

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
  if (combat.dead) return;
  const a = input.axis();
  const nx = player.x + a.x * player.speed * dt;
  const ny = player.y + a.y * player.speed * dt;
  if (!blocked(nx, player.y)) player.x = nx;
  if (!blocked(player.x, ny)) player.y = ny;
  enemies.update(dt, player, player.stats.level);
  combat.update(dt);
}

function restart() {
  const sp = world.findSpawn();
  player.x = sp.x; player.y = sp.y; player.stats = makePlayerStats();
  enemies.list = []; combat.projectiles = []; combat.gems = []; combat.texts = [];
  combat.dead = false; combat.kills = 0; combat.iframes = 1;
}
addEventListener('pointerdown', () => { if (combat.dead && performance.now() - combat.diedAt > 600) restart(); });
addEventListener('keydown', e => { if (combat.dead && e.key === ' ') restart(); });

function draw() {
  const camX = player.x - W / 2, camY = player.y - H / 2;
  world.draw(ctx, camX, camY, W, H);
  enemies.draw(ctx, camX, camY);
  combat.draw(ctx, camX, camY);
  // player
  const sx = W / 2, sy = H / 2;
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(sx, sy + player.r, player.r, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = '#7a4b00'; ctx.lineWidth = 2;
  ctx.globalAlpha = combat.iframes > 0 && Math.floor(performance.now() / 80) % 2 ? 0.4 : 1;
  ctx.beginPath(); ctx.arc(sx, sy, player.r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
  drawHud();
}

function drawHud() {
  const st = player.stats, pad = 12, bw = Math.min(W - pad * 2, 320);
  const y = Math.max(8, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 8);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(pad, y, bw, 16);
  ctx.fillStyle = '#e44'; ctx.fillRect(pad, y, bw * st.hp / st.maxHp, 16);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(`HP ${Math.ceil(st.hp)}/${st.maxHp}`, pad + 6, y + 12);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(pad, y + 20, bw, 10);
  ctx.fillStyle = '#4fd1ff'; ctx.fillRect(pad, y + 20, bw * st.xp / xpForLevel(st.level), 10);
  ctx.fillStyle = '#fff'; ctx.fillText(`Lv ${st.level}   Kills ${combat.kills}`, pad, y + 46);
  if (combat.dead) {
    ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = 'bold 32px system-ui'; ctx.fillText('You died', W / 2, H / 2 - 20);
    ctx.font = '16px system-ui';
    ctx.fillText(`Level ${st.level} · ${combat.kills} kills`, W / 2, H / 2 + 10);
    ctx.fillText('Tap to restart', W / 2, H / 2 + 40);
  }
}

let last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const wasDead = combat.dead;
  update(dt);
  if (!wasDead && combat.dead) combat.diedAt = performance.now();
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
window.__game = { player, world, TILES, enemies, combat };
