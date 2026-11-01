import { generateItem } from './items.js';
import { ENEMY_TYPES, BOSS_TYPES } from './enemies.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const SLOTS = 3;

function makeQuest(level) {
  const roll = Math.random();
  const q = { gold: 0, xp: 0, have: 0 };
  if (roll < 0.15) {
    q.type = 'boss'; q.need = 1; q.text = 'Defeat a boss';
    q.gold = 120 + level * 25; q.xp = 60 + level * 15;
    q.item = generateItem(level + 1, { minRarity: 2 });   // bosses are worth a real gear reward
  } else if (roll < 0.30) {
    q.type = 'gear'; q.need = 3; q.text = 'Find 3 pieces of gear';
    q.gold = 40 + level * 10; q.xp = 20 + level * 6;
  } else if (roll < 0.60) {
    q.type = 'kill'; q.target = 'any'; q.need = 8 + level * 2; q.text = `Defeat ${q.need} monsters`;
  } else {
    const t = pick(Object.keys(ENEMY_TYPES));
    q.type = 'kill'; q.target = t; q.need = 5 + level; q.text = `Defeat ${q.need} ${t}s`;
  }
  if (q.type === 'kill') { q.gold = Math.round(q.need * 5 * (1 + level * 0.1)); q.xp = Math.round(q.need * 3); }
  return q;
}

export class Quests {
  constructor(getLevel) { this.getLevel = getLevel; this.list = []; this.fill(); }

  fill() { while (this.list.length < SLOTS) this.list.push(makeQuest(this.getLevel())); }

  bump(q) { if (q.have < q.need) q.have++; }
  onKill(e) {
    for (const q of this.list) {
      if (q.type === 'kill' && !e.boss && (q.target === 'any' || q.target === e.type)) this.bump(q);
      else if (q.type === 'boss' && e.boss) this.bump(q);
    }
  }
  onPickup() { for (const q of this.list) if (q.type === 'gear') this.bump(q); }

  done(q) { return q.have >= q.need; }
  claim(i) { const q = this.list[i]; this.list.splice(i, 1); this.fill(); return q; }
  load(arr) { if (Array.isArray(arr) && arr.length) { this.list = arr; this.fill(); } }
}
