import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import ViewerCanvas from '../ui/ViewerCanvas';

export default function OnlineRoundResultScreen() {
  const setScreen      = useGameStore((s) => s.setScreen);
  const roomState      = useNetworkStore((s) => s.roomState);
  const myPlayerId     = useNetworkStore((s) => s.myPlayerId);
  const turnDrawEvents = useNetworkStore((s) => s.turnDrawEvents);

  const setReadyRef    = useRef(useNetworkStore.getState().setReady);
  const leaveRoomRef   = useRef(useNetworkStore.getState().leaveRoom);
  const setScreenRef   = useRef(setScreen);

  useEffect(() => {
    setReadyRef.current  = useNetworkStore.getState().setReady;
    leaveRoomRef.current = useNetworkStore.getState().leaveRoom;
    setScreenRef.current = setScreen;
  });

  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'playing')   setScreen('online-word-card');
    if (roomState.phase === 'game_over') setScreen('online-game-over');
    if (roomState.phase === 'waiting')   setScreen('waiting-room');
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReady = useCallback(() => {
    const isReady = useNetworkStore.getState().roomState?.players
      .find(p => p.id === useNetworkStore.getState().myPlayerId)?.isReady ?? false;
    setReadyRef.current(!isReady);
  }, []);

  const handleLeave = useCallback(() => {
    leaveRoomRef.current();
    setScreenRef.current('home');
  }, []);

  if (!roomState) return null;

  const result      = roomState.lastResult;
  const guessed     = result?.guessed ?? false;
  const scores      = roomState.scores;
  const sorted      = [...roomState.players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const connCount   = roomState.players.filter(p => p.isConnected).length;
  const readyCount  = roomState.players.filter(p => p.isReady && p.isConnected).length;
  const isCountdown = roomState.phase === 'countdown';
  const isReady     = roomState.players.find(p => p.id === myPlayerId)?.isReady ?? false;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '16px 16px 24px', gap: 16, overflowY: 'auto' }}>

      {/* Result header */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{ fontSize: 52 }}>
          {guessed ? '🎉' : result?.skipped ? '⏭️' : '⏰'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 4px', color: guessed ? '#22c55e' : '#ef4444' }}>
          {guessed ? '猜中！Correct!' : result?.skipped ? '跳過 Skipped' : '時間到！Time Up!'}
        </h2>
        {result && (
          <p style={{ fontSize: 15, opacity: 0.8 }}>
            題目：<span style={{ fontWeight: 800, color: '#fbbf24' }}>{result.wordZh} / {result.wordEn}</span>
          </p>
        )}
      </div>

      {/* Drawing replay */}
      {turnDrawEvents.length > 0 && (
        <div>
          <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 6, textAlign: 'center' }}>作品回放 Drawing Replay</p>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.15)', aspectRatio: '4/3', background: '#fff' }}>
            <ViewerCanvas events={turnDrawEvents} height="100%" replayAll />
          </div>
        </div>
      )}

      {/* Scores */}
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' }}>
        <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 10 }}>分數 Scores</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10,
              background: p.id === myPlayerId ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
              border: p.id === myPlayerId ? '1.5px solid rgba(124,58,237,0.5)' : '1.5px solid transparent',
              opacity: p.isConnected ? 1 : 0.4,
            }}>
              <span style={{ fontSize: 18, minWidth: 24 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
                {p.name}{p.id === myPlayerId ? ' (我)' : ''}
                {!p.isConnected && <span style={{ opacity: 0.5, fontSize: 11 }}> 離線</span>}
              </span>
              <span style={{ fontSize: 13, marginRight: 8 }}>{p.isReady && p.isConnected ? '✅' : '⏳'}</span>
              <span style={{ fontWeight: 800, fontSize: 18, minWidth: 28, textAlign: 'right' }}>{scores[p.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown or ready status */}
      <div style={{ textAlign: 'center' }}>
        {isCountdown ? (
          <div>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#fbbf24' }}>{roomState.countdown}</div>
            <p style={{ fontSize: 14, opacity: 0.6 }}>倒數開始下一回合…</p>
          </div>
        ) : (
          <p style={{ fontSize: 13, opacity: 0.6 }}>{readyCount} / {connCount} 人準備好</p>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        {!isCountdown && (
          <button onClick={handleReady} style={{
            width: '100%', padding: '14px 0', fontWeight: 800, fontSize: 16,
            background: isReady ? 'rgba(34,197,94,0.25)' : 'rgba(124,58,237,0.8)',
            border: isReady ? '2px solid rgba(34,197,94,0.6)' : 'none',
            borderRadius: 12, color: 'inherit', cursor: 'pointer',
          }}>
            {isReady ? '✅ 已準備 (取消)' : '準備好了！Ready'}
          </button>
        )}
        <button onClick={handleLeave} style={{
          width: '100%', padding: '10px 0', background: 'none',
          border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 12,
          color: '#fca5a5', fontSize: 14, cursor: 'pointer',
        }}>離開房間 Leave</button>
      </div>
    </div>
  );
}
