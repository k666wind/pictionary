import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Screen,
  GameSettings,
  Team,
  Player,
  Word,
  WordBank,
  RoundResult,
  LeaderboardEntry,
  Category,
} from '../types';
import { BUILT_IN_WORD_BANKS } from '../data/wordBanks';
import { filterWords, generateId, shuffleArray } from '../utils/game';
import { getCustomWordBanks, saveCustomWordBanks, getLeaderboard, saveLeaderboardEntry } from '../utils/storage';

interface GameState {
  // Navigation
  screen: Screen;

  // Preferences
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  setVibrationEnabled: (v: boolean) => void;

  // Settings
  settings: GameSettings;

  // Players & Teams
  players: Player[];
  teams: Team[];

  // Word banks
  customWordBanks: WordBank[];

  // Active game state
  wordQueue: Word[];
  currentWordIndex: number;
  currentTeamIndex: number;
  currentRound: number;
  roundResults: RoundResult[];
  isTimerRunning: boolean;
  timeLeft: number;

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // Actions — Navigation
  setScreen: (screen: Screen) => void;

  // Actions — Settings
  updateSettings: (partial: Partial<GameSettings>) => void;

  // Actions — Players & Teams
  setPlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;

  // Actions — Game flow
  startGame: () => void;
  markGuessed: () => void;
  markSkipped: () => void;
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  timeUp: () => void;
  nextTurn: () => void;
  endGame: () => void;
  resetGame: () => void;

  // Actions — Word banks
  addCustomWordBank: (bank: WordBank) => void;
  deleteCustomWordBank: (bankId: string) => void;
  addWordToBank: (bankId: string, word: Word) => void;
  deleteWordFromBank: (bankId: string, wordId: string) => void;

  // Computed helpers
  getCurrentTeam: () => Team | null;
  getCurrentWord: () => Word | null;
  getAllWordBanks: () => WordBank[];
}

const DEFAULT_SETTINGS: GameSettings = {
  mode: 'teams',
  timerSeconds: 90,
  totalRounds: 3,
  difficulty: 'all',
  categories: ['animals', 'food', 'sports', 'home', 'places', 'actions', 'nature'],
  wordBankIds: ['animals', 'food', 'sports', 'home', 'places', 'actions', 'nature'],
  canvasEnabled: false,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'home',
      soundEnabled: true,
      vibrationEnabled: true,
      settings: DEFAULT_SETTINGS,
      players: [],
      teams: [],
      customWordBanks: getCustomWordBanks(),
      wordQueue: [],
      currentWordIndex: 0,
      currentTeamIndex: 0,
      currentRound: 1,
      roundResults: [],
      isTimerRunning: false,
      timeLeft: DEFAULT_SETTINGS.timerSeconds,
      leaderboard: getLeaderboard(),

      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setVibrationEnabled: (v) => set({ vibrationEnabled: v }),

      setScreen: (screen) => set({ screen }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      setPlayers: (players) => set({ players }),

      setTeams: (teams) => set({ teams }),

      startGame: () => {
        const { settings, customWordBanks } = get();
        const allBanks = [...BUILT_IN_WORD_BANKS, ...customWordBanks];
        const selectedBanks = allBanks.filter((b) =>
          settings.wordBankIds.includes(b.id)
        );
        const words = filterWords(selectedBanks, settings.difficulty, settings.categories as Category[]);

        set({
          wordQueue: words,
          currentWordIndex: 0,
          currentTeamIndex: 0,
          currentRound: 1,
          roundResults: [],
          timeLeft: settings.timerSeconds,
          isTimerRunning: false,
          screen: 'team-display',
        });
      },

      markGuessed: () => {
        const { currentTeamIndex, currentWordIndex, wordQueue, teams, currentRound, timeLeft, roundResults } = get();
        const word = wordQueue[currentWordIndex];
        if (!word) return;

        const team = teams[currentTeamIndex];
        const updatedTeams = teams.map((t) =>
          t.id === team.id ? { ...t, score: t.score + 1 } : t
        );

        const result: RoundResult = {
          round: currentRound,
          teamId: team.id,
          drawerId: team.playerIds[0] ?? '',
          wordId: word.id,
          guessed: true,
          skipped: false,
          timeLeft,
        };

        set({
          teams: updatedTeams,
          roundResults: [...roundResults, result],
          isTimerRunning: false,
          screen: 'round-result',
        });
      },

      markSkipped: () => {
        const { currentTeamIndex, currentWordIndex, wordQueue, teams, currentRound, timeLeft, roundResults } = get();
        const word = wordQueue[currentWordIndex];
        if (!word) return;

        const team = teams[currentTeamIndex];
        const result: RoundResult = {
          round: currentRound,
          teamId: team.id,
          drawerId: team.playerIds[0] ?? '',
          wordId: word.id,
          guessed: false,
          skipped: true,
          timeLeft,
        };

        set({
          roundResults: [...roundResults, result],
          isTimerRunning: false,
          screen: 'round-result',
        });
      },

      tickTimer: () => {
        const { timeLeft, isTimerRunning } = get();
        if (!isTimerRunning) return;
        if (timeLeft <= 1) {
          get().timeUp();
        } else {
          set({ timeLeft: timeLeft - 1 });
        }
      },

      pauseTimer: () => set({ isTimerRunning: false }),
      resumeTimer: () => set({ isTimerRunning: true }),

      timeUp: () => {
        const { currentTeamIndex, currentWordIndex, wordQueue, teams, currentRound, roundResults } = get();
        const word = wordQueue[currentWordIndex];
        if (!word) return;

        const team = teams[currentTeamIndex];
        const result: RoundResult = {
          round: currentRound,
          teamId: team.id,
          drawerId: team.playerIds[0] ?? '',
          wordId: word.id,
          guessed: false,
          skipped: false,
          timeLeft: 0,
        };

        set({
          roundResults: [...roundResults, result],
          isTimerRunning: false,
          timeLeft: 0,
          screen: 'round-result',
        });
      },

      nextTurn: () => {
        const { currentTeamIndex, currentWordIndex, wordQueue, teams, currentRound, settings } = get();
        const nextWordIndex = currentWordIndex + 1;

        // Rotate team
        const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
        const nextRound = nextTeamIndex === 0 ? currentRound + 1 : currentRound;

        // Check if game is over
        if (nextRound > settings.totalRounds || nextWordIndex >= wordQueue.length) {
          get().endGame();
          return;
        }

        set({
          currentWordIndex: nextWordIndex,
          currentTeamIndex: nextTeamIndex,
          currentRound: nextRound,
          timeLeft: settings.timerSeconds,
          isTimerRunning: false,
          screen: 'team-display',
        });
      },

      endGame: () => {
        const { teams } = get();
        const sorted = [...teams].sort((a, b) => b.score - a.score);

        // Save winners to leaderboard
        const newEntries = sorted.map((t) => ({
          id: generateId(),
          teamName: t.name,
          score: t.score,
          date: new Date().toLocaleDateString('zh-HK'),
          mode: get().settings.mode,
        }));

        newEntries.forEach(saveLeaderboardEntry);

        const updated = getLeaderboard();
        set({ leaderboard: updated, screen: 'game-over' });
      },

      resetGame: () => {
        const { settings } = get();
        set({
          wordQueue: [],
          currentWordIndex: 0,
          currentTeamIndex: 0,
          currentRound: 1,
          roundResults: [],
          isTimerRunning: false,
          timeLeft: settings.timerSeconds,
          teams: get().teams.map((t) => ({ ...t, score: 0 })),
          screen: 'home',
        });
      },

      addCustomWordBank: (bank) => {
        const updated = [...get().customWordBanks, bank];
        set({ customWordBanks: updated });
        saveCustomWordBanks(updated);
      },

      deleteCustomWordBank: (bankId) => {
        const updated = get().customWordBanks.filter((b) => b.id !== bankId);
        set({ customWordBanks: updated });
        saveCustomWordBanks(updated);
      },

      addWordToBank: (bankId, word) => {
        const updated = get().customWordBanks.map((b) =>
          b.id === bankId ? { ...b, words: [...b.words, word] } : b
        );
        set({ customWordBanks: updated });
        saveCustomWordBanks(updated);
      },

      deleteWordFromBank: (bankId, wordId) => {
        const updated = get().customWordBanks.map((b) =>
          b.id === bankId
            ? { ...b, words: b.words.filter((w) => w.id !== wordId) }
            : b
        );
        set({ customWordBanks: updated });
        saveCustomWordBanks(updated);
      },

      getCurrentTeam: () => {
        const { teams, currentTeamIndex } = get();
        return teams[currentTeamIndex] ?? null;
      },

      getCurrentWord: () => {
        const { wordQueue, currentWordIndex } = get();
        return wordQueue[currentWordIndex] ?? null;
      },

      getAllWordBanks: () => {
        return [...BUILT_IN_WORD_BANKS, ...get().customWordBanks];
      },
    }),
    {
      name: 'pictionary-game',
      partialize: (s) => ({
        leaderboard: s.leaderboard,
        customWordBanks: s.customWordBanks,
        settings: s.settings,
        soundEnabled: s.soundEnabled,
        vibrationEnabled: s.vibrationEnabled,
      }),
    }
  )
);

// Shuffle helper re-export for components
export { shuffleArray };
