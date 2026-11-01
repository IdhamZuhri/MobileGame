// localStorage persistence with safe fallbacks (private mode, blocked storage).
const KEY = 'mobilegame.save.v1';

export function loadSave() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}
export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
