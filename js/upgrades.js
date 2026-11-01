// Data-driven upgrade pool. Add an entry here and it can show up at level-up.
// `max` limits how many times it can be picked (omit for unlimited).
export const UPGRADES = {
  power:    { icon: '⚔️', name: 'Power',      desc: '+20% damage',          apply: s => { s.dmg = Math.round(s.dmg * 1.2 + 1); } },
  rapid:    { icon: '⚡', name: 'Rapid Fire', desc: '+15% attack speed',    apply: s => { s.attackCd = Math.max(0.2, s.attackCd * 0.85); }, max: 8 },
  vitality: { icon: '❤️', name: 'Vitality',   desc: '+30 max HP, heal 30',  apply: s => { s.maxHp += 30; s.hp += 30; /* clamped to effective max by recalc */ } },
  swift:    { icon: '👟', name: 'Swift',      desc: '+8% move speed',       apply: s => { s.speed *= 1.08; }, max: 8 },
  reach:    { icon: '🎯', name: 'Reach',      desc: '+15% attack range',    apply: s => { s.range *= 1.15; }, max: 6 },
  multi:    { icon: '🔱', name: 'Multishot',  desc: '+1 projectile',        apply: s => { s.multi += 1; }, max: 4 },
  regen:    { icon: '🌿', name: 'Regrowth',   desc: '+0.6 HP/sec',          apply: s => { s.regen += 0.6; }, max: 8 },
  magnet:   { icon: '🧲', name: 'Magnet',     desc: '+40% pickup range',    apply: s => { s.magnet *= 1.4; }, max: 5 },
};

// Pick up to n distinct upgrades the player can still take.
export function rollChoices(picks, n = 3) {
  const pool = Object.keys(UPGRADES).filter(id => !UPGRADES[id].max || (picks[id] || 0) < UPGRADES[id].max);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
}

export function applyUpgrade(stats, picks, id) {
  UPGRADES[id].apply(stats);
  picks[id] = (picks[id] || 0) + 1;
}
