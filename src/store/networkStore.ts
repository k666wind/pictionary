import { create } from 'zustand';
import type { RoomState, NetworkPlayer, RoomSettings, ServerMessage, ClientMessage, DrawEvent } from '../types/network';
import type { Word } from '../types';

type ConnectionStatus = 'disconnected'|'connecting'|'connected'|'error';

interface NetworkState {
  ws: WebSocket | null;
  connectionStatus: ConnectionStatus;
  roomCode: string | null;
  roomState: RoomState | null;
  myPlayerId: string | null;
  myPlayerName: string;
  myTeamName: string;
  currentWord: Word | null;
  currentDrawEvents: DrawEvent[];
  turnDrawEvents: DrawEvent[];
  lastError: string | null;

  isHost: () => boolean;
  isDrawer: () => boolean;
  getCurrentDrawer: () => NetworkPlayer | null;

  createRoom: (playerName: string, teamName: string) => void;
  joinRoom: (code: string, playerName: string, teamName: string) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: (settings: RoomSettings, wordQueue: Word[]) => void;
  markGuessed: () => void;
  voteSkip: () => void;
  kickPlayer: (id: string) => void;
  sendDrawEvent: (event: DrawEvent) => void;
  clearError: () => void;

  _handleServerMessage: (msg: ServerMessage) => void;
  _connect: (roomCode: string, playerName: string, teamName: string) => void;
  _send: (msg: ClientMessage) => void;
  _reset: () => void;
}

const RESET_STATE = {
  ws: null, connectionStatus: 'disconnected' as ConnectionStatus,
  roomCode: null, roomState: null, myPlayerId: null,
  currentWord: null, currentDrawEvents: [], turnDrawEvents: [], lastError: null,
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getWsUrl(roomCode: string): string {
  const host: string = __PARTYKIT_HOST__;
  return `${host.startsWith('localhost') ? 'ws' : 'wss'}://${host}/party/${roomCode.toLowerCase()}`;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  ws: null, connectionStatus: 'disconnected', roomCode: null,
  roomState: null, myPlayerId: null, myPlayerName: '', myTeamName: '',
  currentWord: null, currentDrawEvents: [], turnDrawEvents: [], lastError: null,

  isHost: () => {
    const { myPlayerId, roomState } = get();
    return !!myPlayerId && roomState?.hostId === myPlayerId;
  },
  isDrawer: () => {
    const { myPlayerId, roomState } = get();
    if (!myPlayerId || !roomState) return false;
    return roomState.players[roomState.currentDrawerIndex]?.id === myPlayerId;
  },
  getCurrentDrawer: () => {
    const { roomState } = get();
    return roomState?.players[roomState.currentDrawerIndex] ?? null;
  },

  createRoom: (p, t) => get()._connect(generateRoomCode(), p, t),
  joinRoom: (code, p, t) => get()._connect(code.toUpperCase(), p, t),

  leaveRoom: () => {
    const { ws } = get();
    // Send LEAVE first, then close after a short delay so message has time to send
    if (ws?.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'LEAVE' })); } catch { /* ignore */ }
      setTimeout(() => ws.close(), 100);
    }
    set({ ...RESET_STATE, myPlayerName: get().myPlayerName, myTeamName: get().myTeamName });
  },

  setReady: (ready) => get()._send(ready ? { type: 'READY' } : { type: 'UNREADY' }),
  startGame: (settings, wordQueue) => get()._send({ type: 'START_GAME', settings, wordQueue }),
  markGuessed: () => get()._send({ type: 'GUESSED' }),
  voteSkip: () => get()._send({ type: 'VOTE_SKIP' }),
  kickPlayer: (id) => get()._send({ type: 'KICK', playerId: id }),
  sendDrawEvent: (event) => get()._send(event as unknown as ClientMessage),
  clearError: () => set({ lastError: null }),

  _reset: () => set({ ...RESET_STATE, myPlayerName: get().myPlayerName, myTeamName: get().myTeamName }),

  _handleServerMessage: (msg) => {
    switch (msg.type) {
      case 'ROOM_STATE':
        set({ roomState: msg.room }); break;
      case 'GAME_STARTED':
        set({ currentDrawEvents: [], turnDrawEvents: [], currentWord: null }); break;
      case 'YOUR_WORD':
        set({ currentWord: msg.word }); break;
      case 'TIMER_TICK':
        set((s) => ({ roomState: s.roomState ? { ...s.roomState, timeLeft: msg.timeLeft } : null })); break;
      case 'TURN_END':
        set((s) => ({
          roomState: s.roomState
            ? { ...s.roomState, phase: 'turn_result', scores: msg.scores, lastResult: msg.result }
            : null,
          currentWord: null, currentDrawEvents: [],
        })); break;
      case 'TURN_DRAW_EVENTS':
        set({ turnDrawEvents: msg.events }); break;
      case 'GAME_OVER':
        set((s) => ({
          roomState: s.roomState ? { ...s.roomState, phase: 'game_over', scores: msg.finalScores } : null,
        })); break;
      case 'PLAYER_JOINED':
        set((s) => ({
          roomState: s.roomState
            ? { ...s.roomState, players: [...s.roomState.players, msg.player] }
            : null,
        })); break;
      case 'PLAYER_LEFT':
        set((s) => ({
          roomState: s.roomState ? {
            ...s.roomState,
            players: s.roomState.players.map(p =>
              p.id === msg.playerId ? { ...p, isConnected: false } : p
            ),
          } : null,
        })); break;
      case 'KICKED':
        set({ ...RESET_STATE, lastError: '你已被房主移除房間' });
        get().ws?.close();
        break;
      case 'YOU_LEFT':
        // Already reset via leaveRoom(), ignore
        break;
      case 'ERROR':
        set({ lastError: msg.message }); break;
      case 'DRAW_START': case 'DRAW_MOVE': case 'DRAW_END': case 'DRAW_UNDO': case 'DRAW_CLEAR': {
        const { fromId: _d, ...event } = msg as typeof msg & { fromId: string };
        void _d;
        set((s) => ({ currentDrawEvents: [...s.currentDrawEvents, event as DrawEvent] })); break;
      }
    }
  },

  _connect: (roomCode, playerName, teamName) => {
    get().ws?.close();
    set({ connectionStatus: 'connecting', roomCode, myPlayerName: playerName, myTeamName: teamName, myPlayerId: null });

    const ws = new WebSocket(getWsUrl(roomCode));

    ws.onopen = () => {
      set({ connectionStatus: 'connected', ws });
      ws.send(JSON.stringify({ type: 'JOIN', playerName, teamName } as ClientMessage));
    };
    ws.onclose = () => {
      // Only update status; don't wipe roomState here (leaveRoom already did)
      set((s) => s.connectionStatus !== 'disconnected' ? { connectionStatus: 'disconnected' } : s);
    };
    ws.onerror = () => set({ connectionStatus: 'error', lastError: '連線失敗，請檢查網絡' });
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as ServerMessage;
        // Auto-detect our playerId from first ROOM_STATE
        if (msg.type === 'ROOM_STATE' && !get().myPlayerId) {
          const match = msg.room.players.find(p => p.name === get().myPlayerName && p.isConnected);
          if (match) set({ myPlayerId: match.id });
        }
        get()._handleServerMessage(msg);
      } catch { /* ignore */ }
    };

    set({ ws });
  },

  _send: (msg) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(msg)); } catch { /* ignore */ }
    }
  },
}));
