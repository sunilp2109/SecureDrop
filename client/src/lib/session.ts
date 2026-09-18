import type { SavedDrop } from '../types';

const KEY = 'securedrop.drops';

function read(): SavedDrop[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedDrop[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(rows: SavedDrop[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export const dropSession = {
  list: read,
  save(drop: SavedDrop) {
    const rows = read().filter((row) => row.id !== drop.id);
    rows.unshift(drop);
    write(rows.slice(0, 50));
  },
  get(manageToken: string) {
    return read().find((row) => row.manageToken === manageToken);
  },
  remove(manageToken: string) {
    write(read().filter((row) => row.manageToken !== manageToken));
  },
};
