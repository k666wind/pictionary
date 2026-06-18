import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import DrawingCanvas from '../ui/DrawingCanvas';
import ViewerCanvas from '../ui/ViewerCanvas';
import type { DrawEvent } from '../../types/network';

export default function OnlineTimerScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const roomState = useNetworkStore((s) => s.roomState);
  const myPlayerId = useNetworkStore((s) => s.myPlayerId);
  const currentDrawEvents = useNetworkStore((s) => s.currentDrawEvents);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const amDrawer = () => useNetworkStore.getState().isDrawer();
  const amHost   = () => useNetworkStore.getState().isHost();

  // ── Phase navigation ──
  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'turn_result' || roomState.phase === 'countdown') {
      stopTimer(); setScreen('online-round-result');
    }
    if (roomState.phase === 'game_over') { stopTimer(); setScreen('online-game-over'); }
    if (roomState.phase === 'waiting')   { stopTimer(); setScreen('waiting-room'); }
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Host timer — re-trigger on new turn or when host role resolves ──
  useEffect(() => {
    stopTimer();
    if (!roomState || roomState.phase !== 'playing') return;
    if (!amHost()) return;

    timerRef.current = setInterval(() => {
      const state = useNetworkStore.getState();
      const rs = state.roomState;
      if (!rs || rs.phase !== 'playing') { stopTimer(); return; }
      const next = rs.timeLeft - 1;
      if (next <= 0) {
        stopTimer();
        state._send({ type: 'TIME_UP' } as Parameters<typeof state._send>[0]);
      } else {
        state._send({ type: 'TIMER_TICK', timeLeft: next });
        useNetworkStore.setState((s) => ({
          roomState: s.roomState ? { ...s.roomState, timeLeft: next } : null,
        }));
      }
    }, 1000);

    return stopTimer;
  }, [roomState?.currentDrawerIndex, roomState?.currentWordIndex, myPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  const handleLeave = () => {
    stopTimer();
    useNetworkStore.getState().leaveRoom();
    setScreen('home');
  };

  if (!roomState) return null;

  const timeLeft   = roomState.timeLeft;
  const settings   = roomState.settings;
  const drawer     = roomState.players[roomState.currentDrawerIndex];
  const isADrawer  = amDrawer();
  const isAHost    = amHost();
  const timerPct   = timeLeft / settings.timerSeconds;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';

  // Skip vote info
  const nonDrawers = roomState.players.filter(p => p.id !== drawer?.id && p.isConnected);
  const mySkipVote = roomState.skipVotes?.includes(myPlayerId ?? '') ?? false;
  const skipCount  = roomState.skipVotes?.filter(id => nonDrawers.some(p => p.id === id)).length ?? 0;
  const skipNeeded = Math.floor(nonDrawers.length / 2) + 1;

  const sendDraw    = (ev: DrawEvent) => useNetworkStore.getState().sendDrawEvent(ev);
  const markGuessed = () => useNetworkStore.getState().markGuessed();
  const voteSkip    = () => useNetworkStore.getState().voteSkip();

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        padding: '8px 14px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.35)',
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isADrawer ? '🎨 你係畫者' : `👁 ${drawer?.name ?? ''} 畫緊`}
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
          {timeLeft}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>
            第{roomState.currentRound}/{settings.totalRounds}輪
          </span>
          <button onClick={handleLeave} style={{
            background: 'rgba(239,68,68,0.2)', border: 'none',
            borderRadius: 8, color: '#fca5a5', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
          }}>離開</button>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${timerPct * 100}%`,
          background: timerColor, transition: 'width 0.9s linear, background 0.4s',
        }} />
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {isADrawer
          ? <DrawingCanvas onDrawEvent={sendDraw} height="100%" />
          : <ViewerCanvas events={currentDrawEvents} height="100%" />
        }
      </div>

      {/* Controls */}
      <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.25)' }}>

        {/* Drawer: Guessed button */}
        {isADrawer && (
          <div style={{ padding: '10px 14px' }}>
            <button onClick={markGuessed} style={{
              width: '100%', padding: '12px 0', fontWeight: 800, fontSize: 15,
              background: 'rgba(34,197,94,0.3)', border: '2px solid rgba(34,197,94,0.6)',
              borderRadius: 12, color: 'inherit', cursor: 'pointer',
            }}>✅ 猜中！Guessed!</button>
          </div>
        )}

        {/* Non-drawer: Vote Skip */}
        {!isADrawer && (
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={voteSkip}
              disabled={mySkipVote}
              style={{
                flex: 1, padding: '12px 0', fontWeight: 800, fontSize: 14,
                background: mySkipVote ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.25)',
                border: mySkipVote ? '2px solid rgba(239,68,68,0.6)' : '2px solid rgba(239,68,68,0.4)',
                borderRadius: 12, color: mySkipVote ? '#fca5a5' : 'inherit',
                cursor: mySkipVote ? 'default' : 'pointer', opacity: mySkipVote ? 0.7 : 1,
              }}
            >
              {mySkipVote ? '✓ 已投跳過' : '⏭️ 投票跳過'}
            </button>
            <div style={{ fontSize: 13, opacity: 0.7, minWidth: 60, textAlign: 'center' }}>
              {skipCount}/{skipNeeded}<br/>
              <span style={{ fontSize: 11, opacity: 0.6 }}>票跳過</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
