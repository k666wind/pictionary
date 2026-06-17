import { create } from 'zustand';
import type { RoomState, NetworkPlayer, RoomSettings, ServerMessage, ClientMessage, DrawEvent } from '../types/network';
import type { Word } from '../types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface NetworkState {
  // Connection
  ws: WebSocket | null;
  connectionStatus: ConnectionStatus;
  roomCode: string | null;

  // Room
  roomState: RoomState | null;
  myPlayerId: string | null;
  myPlayerName: string;
  myTeamName: string;

  // Game — word only sent to drawer
  currentWord: Word | null;

  // Canvas events buffer (for ViewerCanvas replay)
  currentDrawEvents: DrawEvent[];

  // Error
  lastError: string | null;

  // Derived helpers (computed inline)
  isHost: () => boolean;
  isDrawer: () => boolean;
  getCurrentDrawer: () => NetworkPlayer | null;

  // Actions
  createRoom: (playerName: string, teamName: string) => void;
  joinRoom: (code: string, playerName: string, teamName: string) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: (settings: RoomSettings, wordQueue: Word[]) => void;
  markGuessed: () => void;
  markSkipped: () => void;
  kickPlayer: (id: string) => void;
  sendDrawEvent: (event: DrawEvent) => void;
  clearError: () => void;
  _handleServerMessage: (msg: ServerMessage) => void;
  _setPlayerId: (id: string) => void;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getPartyKitUrl(roomCode: string): string {
  const host = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999';
  const isLocal = host.startsWith('localhost');
  const protocol = isLocal ? 'ws' : 'wss';
  return `${protocol}://${host}/party/${roomCode.toLowerCase()}`;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  ws: null,
  connectionStatus: 'disconnected',
  roomCode: null,
  roomState: null,
  myPlayerId: null,
  myPlayerName: '',
  myTeamName: '',
  currentWord: null,
  currentDrawEvents: [],
  lastError: null,

  isHost: () => {
    const { myPlayerId, roomState } = get();
    return !!myPlayerId && roomState?.hostId === myPlayerId;
  },

  isDrawer: () => {
    const { myPlayerId, roomState } = get();
    if (!myPlayerId || !roomState) return false;
    const drawer = roomState.players[roomState.currentDrawerIndex];
    return drawer?.id === myPlayerId;
  },

  getCurrentDrawer: () => {
    const { roomState } = get();
    if (!roomState) return null;
    return roomState.players[roomState.currentDrawerIndex] ?? null;
  },

  createRoom: (playerName, teamName) => {
    const roomCode = generateRoomCode();
    get()._connect(roomCode, playerName, teamName);
  },

  joinRoom: (code, playerName, teamName) => {
    get()._connect(code.toUpperCase(), playerName, teamName);
  },

  leaveRoom: () => {
    const { ws } = get();
    ws?.close();
    set({
      ws: null,
      connectionStatus: 'disconnected',
      roomCode: null,
      roomState: null,
      myPlayerId: null,
      currentWord: null,
      currentDrawEvents: [],
      lastError: null,
    });
  },

  setReady: (ready) => {
    get()._send(ready ? { type: 'READY' } : { type: 'UNREADY' });
  },

  startGame: (settings, wordQueue) => {
    get()._send({ type: 'START_GAME', settings, wordQueue });
  },

  markGuessed: () => get()._send({ type: 'GUESSED' }),
  markSkipped: () => get()._send({ type: 'SKIPPED' }),
  kickPlayer: (id) => get()._send({ type: 'KICK', playerId: id }),

  sendDrawEvent: (event) => {
    get()._send(event as ClientMessage);
  },

  clearError: () => set({ lastError: null }),

  _setPlayerId: (id) => set({ myPlayerId: id }),

  _handleServerMessage: (msg) => {
    const state = get();
    switch (msg.type) {
      case 'ROOM_STATE':
        set({ roomState: msg.room });
        break;

      case 'GAME_STARTED':
        // Reset draw events for new turn
        set({ currentDrawEvents: [], currentWord: null });
        break;

      case 'YOUR_WORD':
        set({ currentWord: msg.word });
        break;

      case 'TIMER_TICK':
        set((s) => ({
          roomState: s.roomState ? { ...s.roomState, timeLeft: msg.timeLeft } : null,
        }));
        break;

      case 'TURN_END':
        set((s) => ({
          roomState: s.roomState
            ? { ...s.roomState, phase: 'turn_result', scores: msg.scores, lastResult: msg.result }
            : null,
          currentWord: null,
        }));
        break;

      case 'GAME_OVER':
        set((s) => ({
          roomState: s.roomState
            ? { ...s.roomState, phase: 'game_over', scores: msg.finalScores }
            : null,
        }));
        break;

      case 'PLAYER_JOINED':
        set((s) => ({
          roomState: s.roomState
            ? { ...s.roomState, players: [...s.roomState.players, msg.player] }
            : null,
        }));
        break;

      case 'PLAYER_LEFT':
        set((s) => ({
          roomState: s.roomState
            ? {
                ...s.roomState,
                players: s.roomState.players.map((p) =>
                  p.id === msg.playerId ? { ...p, isConnected: false } : p
                ),
              }
            : null,
        }));
        break;

      case 'KICKED':
        // We were kicked — leave
        state.leaveRoom();
        set({ lastError: '你已被房主移除房間' });
        break;

      case 'ERROR':
        set({ lastError: msg.message });
        break;

      // Draw relay events
      case 'DRAW_START':
      case 'DRAW_MOVE':
      case 'DRAW_END':
      case 'DRAW_UNDO':
      case 'DRAW_CLEAR': {
        // Strip fromId, add to draw events buffer
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fromId: _fid, ...event } = msg as typeof msg & { fromId: string };
        set((s) => ({ currentDrawEvents: [...s.currentDrawEvents, event as DrawEvent] }));
        break;
      }
    }
  },

  // Internal
  _connect: (roomCode: string, playerName: string, teamName: string) => {
    const existing = get().ws;
    existing?.close();

    set({ connectionStatus: 'connecting', roomCode, myPlayerName: playerName, myTeamName: teamName });

    const url = getPartyKitUrl(roomCode);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      set({ connectionStatus: 'connected' });
      // PartyKit connection id comes via the URL; we use a workaround: send JOIN first
      // and the server will use conn.id which is the PartyKit connection ID.
      // We get our ID from the first ROOM_STATE — find ourselves by name match.
      ws.send(JSON.stringify({ type: 'JOIN', playerName, teamName } as ClientMessage));
    };

    ws.onclose = () => {
      set({ connectionStatus: 'disconnected' });
    };

    ws.onerror = () => {
      set({ connectionStatus: 'error', lastError: '連線失敗，請檢查網絡' });
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerMessage;

        // Auto-detect our playerId from ROOM_STATE when we don't have it yet
        if (msg.type === 'ROOM_STATE' && !get().myPlayerId) {
          const { myPlayerName } = get();
          const match = msg.room.players.find(
            (p) => p.name === myPlayerName && p.isConnected
          );
          if (match) set({ myPlayerId: match.id });
        }

        get()._handleServerMessage(msg);
      } catch {
        // ignore
      }
    };

    set({ ws });
  },

  _send: (msg: ClientMessage) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  },
} as NetworkState & { _connect: (r: string, p: string, t: string) => void; _send: (m: ClientMessage) => void }));
