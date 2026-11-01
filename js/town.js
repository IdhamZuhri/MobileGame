import { generateItem, sellPrice, RARITIES, SLOTS } from './items.js';

const CRATES = [
  { name: 'Supply Crate', min: 1, price: l => 60 + l * 12,  note: 'Uncommon or better' },
  { name: 'Knight Crate', min: 2, price: l => 220 + l * 35, note: 'Rare or better' },
  { name: 'Royal Crate',  min: 3, price: l => 800 + l * 100, note: 'Epic or better' },
];

// Village dialogs: merchant (buy/sell), healer, quest board.
export class Town {
  constructor(g) {
    this.g = g; this.station = null;
    this.root = document.getElementById('dialog');
    this.title = document.getElementById('dlg-title');
    this.body = document.getElementById('dlg-body');
    document.getElementById('dlg-close').onclick = () => this.close();
  }

  get open() { return this.root.style.display === 'flex'; }
  close() { this.root.style.display = 'none'; this.station = null; this.g.save(); }

  show(station) {
    this.station = station; this.root.style.display = 'flex';
    this.title.textContent = `${station.icon} ${station.name}`;
    this.render();
  }

  btn(label, onclick, cls = '', disabled = false) {
    const b = document.createElement('button');
    b.textContent = label; b.className = cls; b.disabled = disabled; b.onclick = onclick;
    return b;
  }

  row(html, ...buttons) {
    const d = document.createElement('div'); d.className = 'line';
    const t = document.createElement('div'); t.className = 'txt'; t.innerHTML = html;
    d.appendChild(t); buttons.forEach(b => d.appendChild(b)); this.body.appendChild(d);
  }

  head(text) { const h = document.createElement('h4'); h.textContent = text; this.body.appendChild(h); }

  render() {
    this.body.innerHTML = '';
    const p = this.g.player;
    const gold = document.createElement('div'); gold.className = 'gold'; gold.textContent = `💰 ${p.gold} gold`;
    this.body.appendChild(gold);
    ({ shop: () => this.shop(), healer: () => this.healer(), board: () => this.board() })[this.station.id]();
  }

  // ---- Merchant ----
  shop() {
    const { player: p, giveItem, BAG_SIZE } = this.g, lvl = p.stats.level;
    this.head('Buy');
    for (const c of CRATES) {
      const price = c.price(lvl);
      this.row(`<b>${c.name}</b><br><small>${c.note} · item level ${lvl}</small>`,
        this.btn(`${price}g`, () => {
          if (p.gold < price || p.bag.length >= BAG_SIZE) return;
          p.gold -= price;
          giveItem(generateItem(lvl, { minRarity: c.min }));
          this.render();
        }, '', p.gold < price || p.bag.length >= BAG_SIZE));
    }
    this.head('Sell');
    if (!p.bag.length) this.row('<small>Your bag is empty.</small>');
    const commons = p.bag.filter(i => i.rarity === 0);
    if (commons.length > 1) this.row(`<small>Sell all ${commons.length} common items</small>`,
      this.btn(`${commons.reduce((a, i) => a + sellPrice(i), 0)}g`, () => {
        p.gold += commons.reduce((a, i) => a + sellPrice(i), 0);
        p.bag = p.bag.filter(i => i.rarity !== 0); this.render();
      }));
    p.bag.forEach((item, idx) => {
      const r = RARITIES[item.rarity];
      this.row(`<span style="color:${r.color}">${SLOTS[item.slot].icon} <b>${item.name}</b></span><br><small>${r.name} · iLvl ${item.ilvl}</small>`,
        this.btn(`${sellPrice(item)}g`, () => { p.gold += sellPrice(item); p.bag.splice(idx, 1); this.render(); }));
    });
  }

  // ---- Healer ----
  healer() {
    const { player: p, combat } = this.g, full = p.stats.hp >= p.eff.maxHp - 0.5;
    this.head('Rest & recover');
    this.row(`<small>HP ${Math.ceil(p.stats.hp)} / ${Math.round(p.eff.maxHp)}</small>`,
      this.btn(full ? 'Healthy' : 'Heal (free)', () => { p.stats.hp = p.eff.maxHp; combat.text(p.x, p.y - 20, 'Healed!', '#6bff8a'); this.render(); }, '', full));
  }

  // ---- Quest board ----
  board() {
    const { quests, player: p, combat, giveItem, loot } = this.g;
    this.head('Quests');
    quests.list.forEach((q, i) => {
      const done = quests.done(q);
      const reward = `💰${q.gold} ✨${q.xp}` + (q.item ? ` 🎁 <span style="color:${RARITIES[q.item.rarity].color}">${RARITIES[q.item.rarity].name} ${SLOTS[q.item.slot].label}</span>` : '');
      this.row(`<b>${q.text}</b><br><small>${q.have}/${q.need} · ${reward}</small>`,
        this.btn(done ? 'Claim' : '…', () => {
          const r = quests.claim(i);
          p.gold += r.gold; combat.gainXp(r.xp);
          if (r.item && !giveItem(r.item)) loot.add(p.x, p.y, r.item);   // bag full: drop at your feet
          this.render();
        }, done ? 'go' : '', !done));
    });
    this.row('<small>New quests appear after you claim one.</small>');
  }
}
