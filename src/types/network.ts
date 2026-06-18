import type { Word, Category, Difficulty, DrawEvent, DrawPoint, DrawTool } from './index';
export type { DrawEvent, DrawPoint, DrawTool };

export interface NetworkPlayer {
  id: string; name: string; teamName: string;
  isReady: boolean; isHost: boolean; isConnected: boolean;
}
export interface RoomSettings {
  totalRounds: number; timerSeconds: number;
  difficulty: 'all' | Difficulty; categories: Category[];
  canvasEnabled: boolean; wordBankIds: string[];
}
export interface TurnResult {
  drawerId: string; wordEn: string; wordZh: string;
  guessed: boolean; skipped: boolean; timeLeft: number;
}
export interface RoomState {
  roomCode: string; hostId: string;
  phase: 'waiting'|'playing'|'turn_result'|'countdown'|'game_over';
  players: NetworkPlayer[]; settings: RoomSettings;
  currentRound: number; currentDrawerIndex: number;
  timeLeft: number; turnDrawEvents: DrawEvent[];
  lastResult?: TurnResult; scores: Record<string, number>;
  wordQueue: Word[]; currentWordIndex: number;
  countdown: number;
  skipVotes: string[];
}

export type ClientMessage =
  | { type: 'JOIN'; playerName: string; teamName: string }
  | { type: 'READY' } | { type: 'UNREADY' } | { type: 'LEAVE' }
  | { type: 'START_GAME'; settings: RoomSettings; wordQueue: Word[] }
  | { type: 'TIMER_TICK'; timeLeft: number }
  | { type: 'GUESSED' }
  | { type: 'VOTE_SKIP' }
  | { type: 'TIME_UP' }
  | { type: 'KICK'; playerId: string }
  | { type: 'DRAW_START'; stroke: { id: string; tool: DrawTool; size: number }; x: number; y: number }
  | { type: 'DRAW_MOVE'; points: DrawPoint[] }
  | { type: 'DRAW_END' } | { type: 'DRAW_UNDO' } | { type: 'DRAW_CLEAR' };

export type ServerMessage =
  | { type: 'ROOM_STATE'; room: RoomState }
  | { type: 'GAME_STARTED'; firstDrawerId: string }
  | { type: 'YOUR_WORD'; word: Word }
  | { type: 'TIMER_TICK'; timeLeft: number }
  | { type: 'TURN_END'; result: TurnResult; scores: Record<string, number> }
  | { type: 'TURN_DRAW_EVENTS'; events: DrawEvent[] }
  | { type: 'GAME_OVER'; finalScores: Record<string, number>; reason?: string }
  | { type: 'PLAYER_JOINED'; player: NetworkPlayer }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'KICKED' } | { type: 'YOU_LEFT' }
  | { type: 'ERROR'; message: string }
  | { type: 'DRAW_START'; fromId: string; stroke: { id: string; tool: DrawTool; size: number }; x: number; y: number }
  | { type: 'DRAW_MOVE'; fromId: string; points: DrawPoint[] }
  | { type: 'DRAW_END'; fromId: string }
  | { type: 'DRAW_UNDO'; fromId: string }
  | { type: 'DRAW_CLEAR'; fromId: string };
