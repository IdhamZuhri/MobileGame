import { World, TILE, TILES } from './world.js';
import { Input } from './input.js';
import { Enemies } from './enemies.js';
import { Combat, makePlayerStats, xpForLevel } from './combat.js';
import { UPGRADES, rollChoices, applyUpgrade } from './upgrades.js';
import { loadSave, writeSave, clearSave } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudBiome = document.getElementById('hud-biome');
const hudPos = document.getElementById('hud-pos');
const hudFps = document.getElementById('hud-fps');

const world = new World(1337);
const input = new Input(canvas);
const spawn = world.findSpawn();
const player = { x: spawn.x, y: spawn.y, r: 9, stats: makePlayerStats(), picks: {} };
const enemies = new Enemies(world);
const combat = new Combat(player, enemies);

// ---- Save / load ----
function snapshot() {
  return { v: 1, x: player.x, y: player.y, stats: player.stats, picks: player.picks, kills: combat.kills, pending: combat.pendingLevelUps };
}
let resetting = false;
function save() { if (!combat.dead && !resetting) writeSave(snapshot()); }
const saved = loadSave();
if (saved) {
  Object.assign(player.stats, saved.stats);          // defaults fill any new stats from future updates
  player.picks = saved.picks || {};
  if (!world.isSolid(saved.x, saved.y)) { player.x = saved.x; player.y = saved.y; }
  combat.kills = saved.kills || 0;
  combat.pendingLevelUps = saved.pending || 0;
}
setInterval(save, 5000);
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ---- Level-up choice overlay ----
const overlay = document.getElementById('levelup');
const cardsEl = document.getElementById('cards');
let choosing = false;
function showChoices() {
  choosing = true;
  document.getElementById('lu-title').textContent = `Level ${player.stats.level}! Choose an upgrade`;
  cardsEl.innerHTML = '';
  for (const id of rollChoices(player.picks)) {
    const u = UPGRADES[id], n = player.picks[id] || 0;
    const b = document.createElement('button');
    b.className = 'card';
    b.innerHTML = `<span class="ic">${u.icon}</span><span><b>${u.name}</b>${n ? ` <i>Lv ${n + 1}</i>` : ''}<br>${u.desc}</span>`;
    b.onclick = () => {
      applyUpgrade(player.stats, player.picks, id);
      combat.pendingLevelUps--;
      choosing = false; overlay.style.display = 'none'; save();
    };
    cardsEl.appendChild(b);
  }
  overlay.style.display = 'flex';
}
document.getElementById('reset').onclick = () => {
  if (confirm('Delete your progress and start over?')) { resetting = true; clearSave(); location.reload(); }
};

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
  if (choosing) return;
  if (combat.pendingLevelUps > 0) { showChoices(); return; }
  const a = input.axis();
  const nx = player.x + a.x * player.stats.speed * dt;
  const ny = player.y + a.y * player.stats.speed * dt;
  if (!blocked(nx, player.y)) player.x = nx;
  if (!blocked(player.x, ny)) player.y = ny;
  enemies.update(dt, player, player.stats.level);
  combat.update(dt);
}

function restart() {
  const sp = world.findSpawn();
  player.x = sp.x; player.y = sp.y; player.stats.hp = player.stats.maxHp;
  enemies.list = []; combat.projectiles = []; combat.gems = []; combat.texts = [];
  combat.dead = false; combat.iframes = 1; save();
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
    ctx.fillText('Tap to respawn (progress is kept)', W / 2, H / 2 + 40);
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
