import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import DrawingCanvas from '../ui/DrawingCanvas';
import ViewerCanvas from '../ui/ViewerCanvas';
import type { DrawEvent } from '../../types/network';

export default function OnlineTimerScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const roomState    = useNetworkStore((s) => s.roomState);
  const myPlayerId   = useNetworkStore((s) => s.myPlayerId);
  const currentDrawEvents = useNetworkStore((s) => s.currentDrawEvents);

  // Use store selectors that re-evaluate each render
  const isHost   = () => useNetworkStore.getState().isHost();
  const isDrawer = () => useNetworkStore.getState().isDrawer();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Phase navigation ──────────────────────────────────────────
  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'turn_result' || roomState.phase === 'countdown') {
      stopTimer();
      setScreen('online-round-result');
    }
    if (roomState.phase === 'game_over') { stopTimer(); setScreen('online-game-over'); }
    if (roomState.phase === 'waiting')   { stopTimer(); setScreen('waiting-room'); }
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Host timer ────────────────────────────────────────────────
  // Re-run whenever drawer/round changes (new turn) or myPlayerId confirmed
  useEffect(() => {
    stopTimer();
    if (!roomState || roomState.phase !== 'playing') return;
    if (!isHost()) return;

    timerRef.current = setInterval(() => {
      const state = useNetworkStore.getState();
      const rs = state.roomState;
      if (!rs || rs.phase !== 'playing') { stopTimer(); return; }

      const next = rs.timeLeft - 1;
      if (next <= 0) {
        stopTimer();
        state.markSkipped();
      } else {
        state._send({ type: 'TIMER_TICK', timeLeft: next });
        useNetworkStore.setState((s) => ({
          roomState: s.roomState ? { ...s.roomState, timeLeft: next } : null,
        }));
      }
    }, 1000);

    return stopTimer;
  // Re-trigger on new drawer turn or when myPlayerId first resolves
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
  const amDrawer   = isDrawer();
  const amHost     = isHost();
  const drawer     = roomState.players[roomState.currentDrawerIndex];
  const timerPct   = timeLeft / settings.timerSeconds;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';

  const sendDraw = (ev: DrawEvent) => useNetworkStore.getState().sendDrawEvent(ev);
  const markGuessed = () => useNetworkStore.getState().markGuessed();
  const markSkipped = () => useNetworkStore.getState().markSkipped();

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        padding: '8px 14px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.35)',
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {amDrawer ? '🎨 你係畫者' : `👁 ${drawer?.name ?? ''} 畫緊`}
        </div>

        <div style={{ fontSize: 30, fontWeight: 900, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
          {timeLeft}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>
            第{roomState.currentRound}/{settings.totalRounds}輪
          </span>
          <button
            onClick={handleLeave}
            style={{
              background: 'rgba(239,68,68,0.2)', border: 'none',
              borderRadius: 8, color: '#fca5a5',
              fontSize: 12, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            離開
          </button>
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
        {amDrawer
          ? <DrawingCanvas onDrawEvent={sendDraw} height="100%" />
          : <ViewerCanvas events={currentDrawEvents} height="100%" />
        }
      </div>

      {/* Host controls */}
      {amHost && (
        <div style={{
          display: 'flex', gap: 10, padding: '10px 14px',
          background: 'rgba(0,0,0,0.25)', flexShrink: 0,
        }}>
          <button onClick={markGuessed} style={{
            flex: 1, padding: '12px 0', fontWeight: 800, fontSize: 15,
            background: 'rgba(34,197,94,0.3)', border: '2px solid rgba(34,197,94,0.6)',
            borderRadius: 12, color: 'inherit', cursor: 'pointer',
          }}>✅ 猜中！</button>
          <button onClick={markSkipped} style={{
            flex: 1, padding: '12px 0', fontWeight: 800, fontSize: 15,
            background: 'rgba(239,68,68,0.2)', border: '2px solid rgba(239,68,68,0.4)',
            borderRadius: 12, color: 'inherit', cursor: 'pointer',
          }}>⏭️ 跳過</button>
        </div>
      )}

      {!amHost && !amDrawer && (
        <div style={{ padding: '8px', textAlign: 'center', fontSize: 12, opacity: 0.45, flexShrink: 0 }}>
          等待房主判斷…
        </div>
      )}
    </div>
  );
}
