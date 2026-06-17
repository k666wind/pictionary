import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import DrawingCanvas from '../ui/DrawingCanvas';
import ViewerCanvas from '../ui/ViewerCanvas';
import type { DrawEvent } from '../../types/network';

export default function OnlineTimerScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const {
    roomState,
    myPlayerId,
    isHost,
    isDrawer,
    currentDrawEvents,
    sendDrawEvent,
    markGuessed,
    markSkipped,
  } = useNetworkStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase navigation
  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'turn_result') {
      stopTimer();
      setScreen('online-round-result');
    }
    if (roomState.phase === 'game_over') {
      stopTimer();
      setScreen('online-game-over');
    }
    if (roomState.phase === 'waiting') {
      stopTimer();
      setScreen('waiting-room');
    }
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Host runs the timer
  useEffect(() => {
    if (!roomState || roomState.phase !== 'playing') return;
    if (!isHost()) return;

    timerRef.current = setInterval(() => {
      const { roomState: rs, markGuessed: _mg, markSkipped: _ms } = useNetworkStore.getState();
      if (!rs || rs.phase !== 'playing') { stopTimer(); return; }
      const next = rs.timeLeft - 1;
      if (next <= 0) {
        stopTimer();
        // Time up = skipped
        useNetworkStore.getState().markSkipped();
      } else {
        // Broadcast tick
        useNetworkStore.getState().ws?.send(
          JSON.stringify({ type: 'TIMER_TICK', timeLeft: next })
        );
        // Update local state optimistically
        useNetworkStore.setState((s) => ({
          roomState: s.roomState ? { ...s.roomState, timeLeft: next } : null,
        }));
      }
    }, 1000);

    return stopTimer;
  }, [roomState?.phase, myPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  if (!roomState) return null;

  const timeLeft = roomState.timeLeft;
  const settings = roomState.settings;
  const amDrawer = isDrawer();
  const amHost = isHost();
  const drawer = roomState.players[roomState.currentDrawerIndex];

  const timerPct = timeLeft / settings.timerSeconds;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';

  const handleDrawEvent = (ev: DrawEvent) => {
    sendDrawEvent(ev);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          {amDrawer ? '🎨 畫緊！' : `👁️ ${drawer?.name ?? ''} 畫緊`}
        </div>

        {/* Timer */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: timerColor,
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.4s',
          }}
        >
          {timeLeft}
        </div>

        <div style={{ fontSize: 13, opacity: 0.7 }}>
          第 {roomState.currentRound}/{settings.totalRounds} 輪
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${timerPct * 100}%`,
            background: timerColor,
            transition: 'width 0.9s linear, background 0.4s',
          }}
        />
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, minHeight: 0, padding: amDrawer ? 0 : 12, display: 'flex' }}>
        {amDrawer ? (
          <DrawingCanvas onDrawEvent={handleDrawEvent} height="100%" />
        ) : (
          <ViewerCanvas events={currentDrawEvents} height="100%" />
        )}
      </div>

      {/* Host controls */}
      {amHost && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={markGuessed}
            style={{
              flex: 1,
              padding: '12px 0',
              fontWeight: 800,
              fontSize: 15,
              background: 'rgba(34,197,94,0.3)',
              border: '2px solid rgba(34,197,94,0.6)',
              borderRadius: 12,
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            ✅ 猜中！
          </button>
          <button
            onClick={markSkipped}
            style={{
              flex: 1,
              padding: '12px 0',
              fontWeight: 800,
              fontSize: 15,
              background: 'rgba(239,68,68,0.2)',
              border: '2px solid rgba(239,68,68,0.4)',
              borderRadius: 12,
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            ⏭️ 跳過
          </button>
        </div>
      )}

      {/* Non-host spectator note */}
      {!amHost && !amDrawer && (
        <div
          style={{
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: 13,
            opacity: 0.5,
            flexShrink: 0,
          }}
        >
          等待房主判斷結果…
        </div>
      )}
    </div>
  );
}
