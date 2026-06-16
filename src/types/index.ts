export type Difficulty = 'easy' | 'medium' | 'hard';

export type Category =
  | 'animals'
  | 'food'
  | 'sports'
  | 'home'
  | 'places'
  | 'actions'
  | 'nature'
  | 'custom';

export interface Word {
  id: string;
  en: string;
  zh: string;
  difficulty: Difficulty;
  category: Category;
}

export interface WordBank {
  id: string;
  name: { en: string; zh: string };
  isCustom: boolean;
  words: Word[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  playerIds: string[];
  color: string;
}

export type GameMode = 'teams' | 'individuals';

export interface GameSettings {
  mode: GameMode;
  timerSeconds: number;
  totalRounds: number;
  difficulty: Difficulty | 'all';
  categories: Category[];
  wordBankIds: string[];
  canvasEnabled: boolean;
}

export interface RoundResult {
  round: number;
  teamId: string;
  drawerId: string;
  wordId: string;
  guessed: boolean;
  skipped: boolean;
  timeLeft: number;
}

export type Screen =
  | 'home'
  | 'setup'
  | 'team-display'
  | 'word-card'
  | 'timer'
  | 'round-result'
  | 'game-over'
  | 'leaderboard'
  | 'word-bank-manager'
  | 'add-word'
  | 'settings'
  | 'local-draw';

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  score: number;
  date: string;
  mode: GameMode;
}

// ─── Canvas / Drawing ───────────────────────────────────────────

export interface DrawPoint {
  x: number; // 0–1 normalised
  y: number; // 0–1 normalised
}

export type DrawTool = 'pen' | 'eraser';

export interface Stroke {
  id: string;
  tool: DrawTool;
  size: number;
  points: DrawPoint[];
}

// Messages emitted by useCanvas, consumed by network layer
export type DrawEvent =
  | { type: 'DRAW_START'; stroke: Omit<Stroke, 'points'>; x: number; y: number }
  | { type: 'DRAW_MOVE';  points: DrawPoint[] }
  | { type: 'DRAW_END' }
  | { type: 'DRAW_UNDO' }
  | { type: 'DRAW_CLEAR' };
