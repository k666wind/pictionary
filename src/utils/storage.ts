import type { LeaderboardEntry, WordBank } from '../types';

const KEYS = {
  LEADERBOARD: 'pictionary_leaderboard',
  CUSTOM_BANKS: 'pictionary_custom_banks',
};

// Leaderboard
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.LEADERBOARD);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: LeaderboardEntry): void {
  const entries = getLeaderboard();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  const top50 = entries.slice(0, 50);
  localStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(top50));
}

export function clearLeaderboard(): void {
  localStorage.removeItem(KEYS.LEADERBOARD);
}

// Custom word banks
export function getCustomWordBanks(): WordBank[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_BANKS);
    return raw ? (JSON.parse(raw) as WordBank[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomWordBanks(banks: WordBank[]): void {
  localStorage.setItem(KEYS.CUSTOM_BANKS, JSON.stringify(banks));
}

// JSON export / import for custom word banks
export function exportCustomBanksToJSON(banks: import('../types').WordBank[]): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    banks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pictionary-wordbanks-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  imported: number;
  error?: string;
}

export async function importCustomBanksFromJSON(file: File): Promise<{ banks: import('../types').WordBank[]; result: ImportResult }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const parsed = JSON.parse(raw) as { version?: number; banks?: unknown[] };
        if (!parsed.banks || !Array.isArray(parsed.banks)) {
          resolve({ banks: [], result: { success: false, imported: 0, error: '無效格式 Invalid format' } });
          return;
        }
        // Basic validation
        const banks = parsed.banks.filter((b): b is import('../types').WordBank =>
          typeof (b as Record<string, unknown>).id === 'string' &&
          typeof (b as Record<string, unknown>).name === 'object' &&
          Array.isArray((b as Record<string, unknown>).words)
        ).map((b) => ({ ...b, isCustom: true }));

        resolve({ banks, result: { success: true, imported: banks.length } });
      } catch {
        resolve({ banks: [], result: { success: false, imported: 0, error: '解析失敗 Parse error' } });
      }
    };
    reader.readAsText(file);
  });
}
