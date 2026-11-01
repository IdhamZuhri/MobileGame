import { World, TILE, TILES } from './world.js';
import { Input } from './input.js';
import { Enemies } from './enemies.js';
import { Combat, makePlayerStats, xpForLevel } from './combat.js';
import { UPGRADES, rollChoices, applyUpgrade } from './upgrades.js';
import { generateItem, computeEffective, dropChance, RARITIES } from './items.js';
import { BOSS_TYPES } from './enemies.js';
import { Loot } from './loot.js';
import { Village } from './village.js';
import { Quests } from './quests.js';
import { Bosses } from './bosses.js';
import { Town } from './town.js';
import { InventoryUI, BAG_SIZE } from './inventory.js';
import { loadSave, writeSave, clearSave } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudBiome = document.getElementById('hud-biome');
const hudPos = document.getElementById('hud-pos');
const hudFps = document.getElementById('hud-fps');

const world = new World(1337);
const input = new Input(canvas);
const site = world.findVillageSite();
world.setVillage(site.x, site.y, 6);
const village = new Village(world);
const spawn = world.villagePx();
const player = { x: spawn.x, y: spawn.y, r: 9, stats: makePlayerStats(), picks: {}, equipped: { weapon: null, armor: null, trinket: null }, bag: [], eff: null, gold: 0,
  // Recompute effective stats whenever gear or upgrades change.
  recalc() { this.eff = computeEffective(this.stats, this.equipped); this.stats.hp = Math.min(this.stats.hp, this.eff.maxHp); } };
player.recalc();
const enemies = new Enemies(world);
const combat = new Combat(player, enemies);
combat.isSafe = () => world.inVillage(player.x, player.y);
const quests = new Quests(() => player.stats.level);
const bosses = new Bosses(world, enemies);

// ---- Save / load ----
function snapshot() {
  return { v: 1, x: player.x, y: player.y, stats: player.stats, picks: player.picks, kills: combat.kills, pending: combat.pendingLevelUps, equipped: player.equipped, bag: player.bag, gold: player.gold, quests: quests.list, bossCd: bosses.cooldowns };
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
  player.equipped = { weapon: null, armor: null, trinket: null, ...(saved.equipped || {}) };
  player.bag = saved.bag || [];
  player.gold = saved.gold || 0;
  quests.load(saved.quests);
  bosses.cooldowns = saved.bossCd || {};
  player.recalc();
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
      applyUpgrade(player.stats, player.picks, id); player.recalc();
      combat.pendingLevelUps--;
      choosing = false; overlay.style.display = 'none'; save();
    };
    cardsEl.appendChild(b);
  }
  overlay.style.display = 'flex';
}
// ---- Loot & inventory ----
const loot = new Loot();
const inventory = new InventoryUI(player, { onChange: () => { player.recalc(); save(); } });
const bagBtn = document.getElementById('bag-btn');
function pickup(item) {
  if (player.bag.length >= BAG_SIZE) {
    if (!pickup.warned || performance.now() - pickup.warned > 2000) { combat.text(player.x, player.y - 20, 'Bag full!', '#ff6b6b'); pickup.warned = performance.now(); }
    return false;
  }
  if (!player.equipped[item.slot]) { player.equipped[item.slot] = item; player.recalc(); }   // auto-equip into empty slots
  else player.bag.push(item);
  combat.text(player.x, player.y - 20, item.name, RARITIES[item.rarity].color);
  quests.onPickup();
  save();
  return true;
}
function giveItem(item) {
  if (player.bag.length >= BAG_SIZE) return false;
  if (!player.equipped[item.slot]) { player.equipped[item.slot] = item; player.recalc(); } else player.bag.push(item);
  return true;
}
combat.onKill = e => {
  const gold = e.boss ? 40 + e.xp : Math.max(1, Math.round(e.xp * 0.6));
  player.gold += gold; combat.text(e.x, e.y - e.r - 14, `+${gold}g`, '#ffd24a');
  quests.onKill(e);
  if (e.boss) {
    bosses.killed(e);
    combat.text(e.x, e.y - 30, `${BOSS_TYPES[e.type].name} defeated!`, '#ffd24a');
    for (let i = 0; i < 2; i++) {
      const r = Math.random();
      loot.add(e.x + (i ? 18 : -18), e.y, generateItem(player.stats.level + 2, { rarity: r < 0.12 ? 4 : r < 0.45 ? 3 : 2 }));
    }
  } else if (Math.random() < dropChance(e)) loot.add(e.x, e.y, generateItem(player.stats.level));
};
const town = new Town({ player, combat, quests, loot, giveItem, BAG_SIZE, save: () => save() });
const interactBtn = document.getElementById('interact');
let nearStation = null;
interactBtn.onclick = () => { if (nearStation) town.show(nearStation); };
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
  if (choosing || inventory.open || town.open) return;
  if (combat.pendingLevelUps > 0) { showChoices(); return; }
  const a = input.axis();
  const nx = player.x + a.x * player.eff.speed * dt;
  const ny = player.y + a.y * player.eff.speed * dt;
  if (!blocked(nx, player.y)) player.x = nx;
  if (!blocked(player.x, ny)) player.y = ny;
  bosses.update(player);
  enemies.update(dt, player, player.stats.level);
  combat.update(dt);
  loot.update(dt, player, pickup);
  bagBtn.textContent = `🎒 ${player.bag.length}`;
  nearStation = village.nearest(player);
  interactBtn.style.display = nearStation ? 'block' : 'none';
  if (nearStation) interactBtn.textContent = `${nearStation.icon} ${nearStation.name}`;
}

function restart() {
  const sp = world.villagePx();
  player.x = sp.x; player.y = sp.y + 40; player.stats.hp = player.eff.maxHp;
  enemies.list = []; enemies.shots = []; combat.projectiles = []; combat.gems = []; combat.texts = []; loot.drops = [];
  combat.dead = false; combat.iframes = 1; save();
}
addEventListener('pointerdown', () => { if (combat.dead && performance.now() - combat.diedAt > 600) restart(); });
addEventListener('keydown', e => { if (combat.dead && e.key === ' ') restart(); });

function draw() {
  const camX = player.x - W / 2, camY = player.y - H / 2;
  world.draw(ctx, camX, camY, W, H);
  village.draw(ctx, camX, camY);
  loot.draw(ctx, camX, camY);
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
  ctx.fillStyle = '#e44'; ctx.fillRect(pad, y, bw * st.hp / player.eff.maxHp, 16);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(`HP ${Math.ceil(st.hp)}/${Math.round(player.eff.maxHp)}`, pad + 6, y + 12);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(pad, y + 20, bw, 10);
  ctx.fillStyle = '#4fd1ff'; ctx.fillRect(pad, y + 20, bw * st.xp / xpForLevel(st.level), 10);
  ctx.fillStyle = '#fff'; ctx.fillText(`Lv ${st.level}   Kills ${combat.kills}   💰 ${player.gold}`, pad, y + 46);
  ctx.font = '12px system-ui';
  quests.list.forEach((q, i) => {
    const done = quests.done(q);
    ctx.fillStyle = done ? '#6bff8a' : 'rgba(255,255,255,.85)';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    const t = done ? `✓ ${q.text} (claim in village)` : `${q.text}  ${q.have}/${q.need}`;
    ctx.strokeText(t, pad, y + 112 + i * 16); ctx.fillText(t, pad, y + 112 + i * 16);
  });
  const boss = bosses.current(player);
  if (boss) {
    const bw2 = Math.min(W - 40, 300), bx = (W - bw2) / 2, by = H - 40;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw2, 14);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(bx, by, bw2 * boss.hp / boss.maxHp, 14);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 12px system-ui';
    ctx.fillText(`${boss.name}  ${Math.ceil(boss.hp)}/${boss.maxHp}`, W / 2, by + 11);
    ctx.textAlign = 'left';
  }
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
    hudPos.textContent = world.inVillage(player.x, player.y) ? '🏠 safe' : `⚠ x${world.danger(player.x, player.y).toFixed(1)}`;
    hudBiome.textContent = world.tileAtPx(player.x, player.y).name;
    fpsAcc = 0; fpsN = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook
window.__game = { player, world, TILES, enemies, combat, loot, inventory, quests, bosses, village, town };
