import { SLOTS, RARITIES, STATS, describeStat } from './items.js';

export const BAG_SIZE = 20;

// DOM-based inventory screen: equipped slots, bag grid, item detail with compare.
export class InventoryUI {
  constructor(player, { onChange }) {
    this.player = player; this.onChange = onChange;
    this.root = document.getElementById('inventory');
    this.selected = null; // { from: 'bag'|'slot', key }
    document.getElementById('bag-btn').onclick = () => this.toggle();
    document.getElementById('inv-close').onclick = () => this.close();
  }

  get open() { return this.root.style.display === 'flex'; }
  toggle() { this.open ? this.close() : this.show(); }
  close() { this.root.style.display = 'none'; this.selected = null; }
  show() { this.root.style.display = 'flex'; this.render(); }

  itemOf(sel) { return sel.from === 'bag' ? this.player.bag[sel.key] : this.player.equipped[sel.key]; }

  tile(item, emptyLabel, selected) {
    const b = document.createElement('button');
    b.className = 'tile' + (selected ? ' sel' : '');
    if (item) {
      b.style.borderColor = RARITIES[item.rarity].color;
      b.innerHTML = `<span class="ic">${SLOTS[item.slot].icon}</span><small>${item.ilvl}</small>`;
    } else b.innerHTML = `<small class="empty">${emptyLabel}</small>`;
    return b;
  }

  render() {
    const p = this.player;
    const eq = document.getElementById('inv-equipped'); eq.innerHTML = '';
    for (const slot of Object.keys(SLOTS)) {
      const t = this.tile(p.equipped[slot], SLOTS[slot].icon, this.selected?.from === 'slot' && this.selected.key === slot);
      t.onclick = () => { if (p.equipped[slot]) { this.selected = { from: 'slot', key: slot }; this.render(); } };
      eq.appendChild(t);
    }
    const bag = document.getElementById('inv-bag'); bag.innerHTML = '';
    document.getElementById('inv-count').textContent = `Bag ${p.bag.length}/${BAG_SIZE}`;
    for (let i = 0; i < BAG_SIZE; i++) {
      const t = this.tile(p.bag[i], '', this.selected?.from === 'bag' && this.selected.key === i);
      if (p.bag[i]) t.onclick = () => { this.selected = { from: 'bag', key: i }; this.render(); };
      bag.appendChild(t);
    }
    const s = p.eff;
    document.getElementById('inv-stats').textContent =
      `DMG ${s.dmg} · HP ${Math.round(s.maxHp)} · Armor ${s.armor} · Speed ${Math.round(s.speed)} · Atk/s ${(1 / s.attackCd).toFixed(2)}`;
    this.renderDetail();
  }

  renderDetail() {
    const el = document.getElementById('inv-detail');
    if (!this.selected || !this.itemOf(this.selected)) { this.selected = null; el.innerHTML = '<p class="hint">Tap an item to inspect it.</p>'; return; }
    const item = this.itemOf(this.selected), r = RARITIES[item.rarity];
    const cur = this.player.equipped[item.slot];
    let html = `<h3 style="color:${r.color}">${item.name}</h3><div class="sub">${r.name} ${SLOTS[item.slot].label} · iLvl ${item.ilvl}</div><ul>`;
    for (const [k, v] of Object.entries(item.stats)) {
      let diff = '';
      if (this.selected.from === 'bag') {
        const d = +(v - (cur?.stats[k] || 0)).toFixed(1);
        diff = d ? ` <em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</em>` : '';
      }
      html += `<li>${describeStat(k, v)}${diff}</li>`;
    }
    if (this.selected.from === 'bag' && cur) for (const [k, v] of Object.entries(cur.stats))
      if (!(k in item.stats)) html += `<li class="lost">−${v} ${STATS[k].label} (lost)</li>`;
    html += '</ul><div class="btns">';
    html += this.selected.from === 'bag'
      ? '<button id="b-equip">Equip</button><button id="b-drop" class="danger">Discard</button>'
      : '<button id="b-unequip">Unequip</button>';
    el.innerHTML = html + '</div>';
    const act = id => document.getElementById(id);
    if (act('b-equip')) act('b-equip').onclick = () => this.equip(this.selected.key);
    if (act('b-drop')) act('b-drop').onclick = () => { this.player.bag.splice(this.selected.key, 1); this.selected = null; this.changed(); };
    if (act('b-unequip')) act('b-unequip').onclick = () => this.unequip(this.selected.key);
  }

  equip(i) {
    const p = this.player, item = p.bag[i];
    p.bag.splice(i, 1);
    const old = p.equipped[item.slot];
    p.equipped[item.slot] = item;
    if (old) p.bag.push(old);
    this.selected = { from: 'slot', key: item.slot };
    this.changed();
  }

  unequip(slot) {
    const p = this.player;
    if (p.bag.length >= BAG_SIZE) return;
    p.bag.push(p.equipped[slot]); p.equipped[slot] = null; this.selected = null;
    this.changed();
  }

  changed() { this.onChange(); this.render(); }
}
