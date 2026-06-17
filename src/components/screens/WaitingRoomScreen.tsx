import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import { BUILT_IN_WORD_BANKS } from '../../data/wordBanks';
import { filterWords, shuffleArray } from '../../utils/game';
import type { Category } from '../../types';
import RoomCodeDisplay from '../ui/RoomCodeDisplay';
import PlayerList from '../ui/PlayerList';

export default function WaitingRoomScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const settings = useGameStore((s) => s.settings);
  const customWordBanks = useGameStore((s) => s.customWordBanks);

  const { roomState, myPlayerId, isHost, setReady, startGame, kickPlayer, leaveRoom, lastError } = useNetworkStore();

  // Watch phase changes
  useEffect(() => {
    if (!roomState) {
      setScreen('online-lobby');
      return;
    }
    if (roomState.phase === 'playing') {
      setScreen('online-word-card');
    }
  }, [roomState?.phase, !!roomState]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.id === myPlayerId);
  const allReady = roomState.players.length >= 2 && roomState.players.every((p) => p.isReady || p.isHost);

  const handleStart = () => {
    const allBanks = [...BUILT_IN_WORD_BANKS, ...customWordBanks];
    const selected = allBanks.filter((b) => settings.wordBankIds.includes(b.id));
    const words = filterWords(selected, settings.difficulty, settings.categories as Category[]);
    const shuffled = shuffleArray(words);
    startGame(
      {
        totalRounds: settings.totalRounds,
        timerSeconds: settings.timerSeconds,
        difficulty: settings.difficulty,
        categories: settings.categories as Category[],
        canvasEnabled: settings.canvasEnabled,
        wordBankIds: settings.wordBankIds,
      },
      shuffled
    );
  };

  const handleLeave = () => {
    leaveRoom();
    setScreen('online-lobby');
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: 20, gap: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>等候室 Waiting Room</h1>
      </div>

      {/* Room code */}
      <RoomCodeDisplay code={roomState.roomCode} />

      {/* Error */}
      {lastError && (
        <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
          {lastError}
        </div>
      )}

      {/* Players */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 10 }}>
          玩家 ({roomState.players.filter((p) => p.isConnected).length} / {roomState.players.length})
        </p>
        <PlayerList
          players={roomState.players}
          myId={myPlayerId}
          hostId={roomState.hostId}
          onKick={isHost() ? kickPlayer : undefined}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 24 }}>
        {/* Ready toggle (non-host) */}
        {!isHost() && (
          <button
            onClick={() => setReady(!me?.isReady)}
            style={{
              width: '100%',
              padding: '14px 0',
              fontWeight: 800,
              fontSize: 16,
              background: me?.isReady ? 'rgba(34,197,94,0.3)' : 'var(--color-primary, #7c3aed)',
              border: me?.isReady ? '2px solid rgba(34,197,94,0.6)' : 'none',
              borderRadius: 12,
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            {me?.isReady ? '✅ 已準備 (取消)' : '準備好了！Ready'}
          </button>
        )}

        {/* Start (host) */}
        {isHost() && (
          <button
            onClick={handleStart}
            disabled={!allReady}
            style={{
              width: '100%',
              padding: '14px 0',
              fontWeight: 800,
              fontSize: 16,
              background: allReady ? 'var(--color-primary, #7c3aed)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 12,
              color: 'inherit',
              cursor: allReady ? 'pointer' : 'not-allowed',
              opacity: allReady ? 1 : 0.5,
            }}
          >
            {allReady ? '🚀 開始遊戲！' : `等待玩家準備… (${roomState.players.filter((p) => p.isReady || p.isHost).length}/${roomState.players.length})`}
          </button>
        )}

        <button
          onClick={handleLeave}
          style={{
            width: '100%',
            padding: '10px 0',
            background: 'none',
            border: '1.5px solid rgba(239,68,68,0.4)',
            borderRadius: 12,
            color: '#fca5a5',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          離開房間
        </button>
      </div>
    </div>
  );
}
