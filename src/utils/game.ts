import type { Word, WordBank, Difficulty, Category } from '../types';

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function filterWords(
  banks: WordBank[],
  difficulty: Difficulty | 'all',
  categories: Category[]
): Word[] {
  let words = banks.flatMap((b) => b.words);
  if (difficulty !== 'all') {
    words = words.filter((w) => w.difficulty === difficulty);
  }
  if (categories.length > 0) {
    words = words.filter((w) => categories.includes(w.category));
  }
  return shuffleArray(words);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const TEAM_COLORS = [
  '#FF6B6B',
  '#4D96FF',
  '#6BCB77',
  '#FFD93D',
  '#C77DFF',
  '#FF9F43',
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  animals: '🐾',
  food: '🍎',
  sports: '⚽',
  home: '🏠',
  places: '🌍',
  actions: '🎬',
  nature: '🌈',
  custom: '⭐',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#6BCB77',
  medium: '#FFD93D',
  hard: '#FF6B6B',
};
