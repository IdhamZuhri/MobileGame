// Gear: slots, rarities, random generation, and effective-stat calculation.
export const SLOTS = {
  weapon:  { label: 'Weapon',  icon: '🗡️', bases: ['Wand', 'Staff', 'Bow', 'Dagger', 'Spear'], primary: 'dmg' },
  armor:   { label: 'Armor',   icon: '🛡️', bases: ['Vest', 'Cloak', 'Plate', 'Robe', 'Mail'], primary: 'maxHp' },
  trinket: { label: 'Trinket', icon: '💍', bases: ['Amulet', 'Ring', 'Charm', 'Talisman'],     primary: 'speedPct' },
};

export const RARITIES = [
  { id: 'common',    name: 'Common',    color: '#b8bec6', mult: 1.0, weight: 60,   affixes: 0, prefixes: ['Worn', 'Plain', 'Crude'] },
  { id: 'uncommon',  name: 'Uncommon',  color: '#5fd16a', mult: 1.25, weight: 26,  affixes: 1, prefixes: ['Sturdy', 'Sound', 'Keen'] },
  { id: 'rare',      name: 'Rare',      color: '#4aa3ff', mult: 1.55, weight: 10,  affixes: 2, prefixes: ['Fine', 'Gleaming', 'Tempered'] },
  { id: 'epic',      name: 'Epic',      color: '#b66dff', mult: 1.95, weight: 3.2, affixes: 3, prefixes: ['Runed', 'Arcane', 'Savage'] },
  { id: 'legendary', name: 'Legendary', color: '#ffa23a', mult: 2.5, weight: 0.8,  affixes: 4, prefixes: ['Mythic', 'Ancient', 'Godforged'] },
];

// Every stat a piece of gear can roll. `base` is the value at item level 1, `per` the growth per level.
export const STATS = {
  dmg:         { label: 'Damage',        base: 3,   per: 1.4, int: true },
  maxHp:       { label: 'Max HP',        base: 12,  per: 4.5, int: true },
  armor:       { label: 'Armor',         base: 1,   per: 0.5, int: true },
  regen:       { label: 'HP/sec',        base: 0.3, per: 0.12, dec: 1 },
  speedPct:    { label: 'Move speed %',  base: 4,   per: 0.5, int: true },
  atkSpeedPct: { label: 'Attack speed %', base: 5,  per: 0.6, int: true },
  rangePct:    { label: 'Range %',       base: 5,   per: 0.5, int: true },
  magnetPct:   { label: 'Pickup range %', base: 12, per: 1.5, int: true },
  dmgPct:      { label: 'Damage %',      base: 4,   per: 0.7, int: true },
};
const AFFIX_POOL = Object.keys(STATS);

function weightedRarity(level) {
  // Higher player level nudges odds away from common.
  const w = RARITIES.map((r, i) => r.weight * (1 + i * level * 0.03));
  let roll = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { roll -= w[i]; if (roll <= 0) return i; }
  return 0;
}

function rollValue(key, ilvl, mult) {
  const d = STATS[key];
  const v = (d.base + d.per * (ilvl - 1)) * mult * (0.85 + Math.random() * 0.3);
  return d.dec ? Math.round(v * 10 ** d.dec) / 10 ** d.dec : Math.max(1, Math.round(v));
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function generateItem(ilvl, opts = {}) {
  const slotId = opts.slot || pick(Object.keys(SLOTS));
  const slot = SLOTS[slotId];
  const rIdx = opts.rarity ?? Math.max(opts.minRarity || 0, weightedRarity(ilvl));
  const rar = RARITIES[rIdx];
  const stats = { [slot.primary]: rollValue(slot.primary, ilvl, rar.mult) };
  const pool = AFFIX_POOL.filter(k => k !== slot.primary);
  for (let i = 0; i < rar.affixes && pool.length; i++) {
    const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    stats[k] = rollValue(k, ilvl, rar.mult * 0.7);
  }
  return { slot: slotId, rarity: rIdx, ilvl, name: `${pick(rar.prefixes)} ${pick(slot.bases)}`, stats };
}

export function describeStat(key, val) {
  return `+${val} ${STATS[key].label}`;
}

// Combine base stats (level + upgrades) with equipped gear into the numbers combat uses.
export function computeEffective(base, equipped) {
  const g = {};
  for (const item of Object.values(equipped)) {
    if (!item) continue;
    for (const [k, v] of Object.entries(item.stats)) g[k] = (g[k] || 0) + v;
  }
  const e = { ...base };
  e.dmg = (base.dmg + (g.dmg || 0)) * (1 + (g.dmgPct || 0) / 100);
  e.maxHp = base.maxHp + (g.maxHp || 0);
  e.armor = g.armor || 0;
  e.regen = base.regen + (g.regen || 0);
  e.speed = base.speed * (1 + (g.speedPct || 0) / 100);
  e.attackCd = Math.max(0.15, base.attackCd / (1 + (g.atkSpeedPct || 0) / 100));
  e.range = base.range * (1 + (g.rangePct || 0) / 100);
  e.magnet = base.magnet * (1 + (g.magnetPct || 0) / 100);
  e.dmg = Math.round(e.dmg);
  return e;
}

// Chance an enemy drops gear, scaled by how tough it is.
export function dropChance(enemy) { return Math.min(0.35, 0.05 + enemy.xp * 0.006); }

export function sellPrice(item) { return Math.round((2 + item.ilvl * 2) * (1 + item.rarity * 1.6)); }
