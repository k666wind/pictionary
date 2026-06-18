import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import DrawingCanvas from '../ui/DrawingCanvas';
import ViewerCanvas from '../ui/ViewerCanvas';
import type { DrawEvent } from '../../types/network';

export default function OnlineTimerScreen() {
  const setScreen      = useGameStore((s) => s.setScreen);

  // ── Subscribe to ALL needed state via individual selectors ──
  const roomState      = useNetworkStore((s) => s.roomState);
  const myPlayerId     = useNetworkStore((s) => s.myPlayerId);
  const currentDrawEvents = useNetworkStore((s) => s.currentDrawEvents);
  const leaveRoomFn    = useNetworkStore((s) => s.leaveRoom);
  const markGuessedFn  = useNetworkStore((s) => s.markGuessed);
  const voteSkipFn     = useNetworkStore((s) => s.voteSkip);
  const sendDrawFn     = useNetworkStore((s) => s.sendDrawEvent);
  const sendFn         = useNetworkStore((s) => s._send);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive from roomState so values are always fresh
  const drawer    = roomState?.players[roomState.currentDrawerIndex ?? 0];
  const amDrawer  = !!myPlayerId && drawer?.id === myPlayerId;
  const amHost    = !!myPlayerId && roomState?.hostId === myPlayerId;

  // ── Phase navigation (including game_over from player leaving) ──
  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'turn_result' || roomState.phase === 'countdown') {
      stopTimer(); setScreen('online-round-result');
    }
    if (roomState.phase === 'game_over') { stopTimer(); setScreen('online-game-over'); }
    if (roomState.phase === 'waiting')   { stopTimer(); setScreen('waiting-room'); }
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Host timer — restarts whenever drawer/round changes ──
  useEffect(() => {
    stopTimer();
    if (!roomState || roomState.phase !== 'playing') return;
    if (!amHost) return;

    timerRef.current = setInterval(() => {
      // Always read fresh state inside interval
      const rs = useNetworkStore.getState().roomState;
      if (!rs || rs.phase !== 'playing') { stopTimer(); return; }

      const next = rs.timeLeft - 1;
      if (next <= 0) {
        stopTimer();
        useNetworkStore.getState()._send({ type: 'TIME_UP' } as Parameters<typeof sendFn>[0]);
      } else {
        useNetworkStore.getState()._send({ type: 'TIMER_TICK', timeLeft: next });
        useNetworkStore.setState((s) => ({
          roomState: s.roomState ? { ...s.roomState, timeLeft: next } : null,
        }));
      }
    }, 1000);

    return stopTimer;
  // Re-trigger when: new drawer turn, myPlayerId resolves, or host changes
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    roomState?.currentDrawerIndex,
    roomState?.currentWordIndex,
    myPlayerId,
    roomState?.hostId,
  ]);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  const handleLeave = () => {
    stopTimer();
    leaveRoomFn();
    setScreen('home');
  };

  const handleGuessed = () => markGuessedFn();
  const handleVoteSkip = () => voteSkipFn();
  const handleDraw = (ev: DrawEvent) => sendDrawFn(ev);

  if (!roomState) return null;

  const settings   = roomState.settings;
  const timeLeft   = roomState.timeLeft;
  const timerPct   = timeLeft / settings.timerSeconds;
  const timerColor = timerPct > 0.5 ? '#22c55e' : timerPct > 0.25 ? '#f59e0b' : '#ef4444';

  const nonDrawers  = roomState.players.filter(p => p.id !== drawer?.id && p.isConnected);
  const mySkipVote  = (roomState.skipVotes ?? []).includes(myPlayerId ?? '');
  const skipCount   = (roomState.skipVotes ?? []).filter(id => nonDrawers.some(p => p.id === id)).length;
  const skipNeeded  = Math.floor(nonDrawers.length / 2) + 1;
  const connectedCount = roomState.players.filter(p => p.isConnected).length;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        padding: '8px 14px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.35)',
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {amDrawer ? '🎨 你係畫者' : `👁 ${drawer?.name ?? ''} 畫緊`}
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
          {timeLeft}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>
            第{roomState.currentRound}/{settings.totalRounds}輪 · {connectedCount}人
          </span>
          <button onClick={handleLeave} style={{
            background: 'rgba(239,68,68,0.25)', border: 'none',
            borderRadius: 8, color: '#fca5a5', fontSize: 12,
            padding: '5px 10px', cursor: 'pointer',
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
        {amDrawer
          ? <DrawingCanvas onDrawEvent={handleDraw} height="100%" />
          : <ViewerCanvas events={currentDrawEvents} height="100%" />
        }
      </div>

      {/* Drawer: Guessed button */}
      {amDrawer && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>
          <button onClick={handleGuessed} style={{
            width: '100%', padding: '13px 0', fontWeight: 800, fontSize: 15,
            background: 'rgba(34,197,94,0.35)', border: '2px solid rgba(34,197,94,0.7)',
            borderRadius: 12, color: 'inherit', cursor: 'pointer',
          }}>✅ 猜中！Guessed!</button>
        </div>
      )}

      {/* Non-drawer: Vote Skip */}
      {!amDrawer && (
        <div style={{
          padding: '10px 14px', background: 'rgba(0,0,0,0.25)',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button
            onClick={handleVoteSkip}
            disabled={mySkipVote}
            style={{
              flex: 1, padding: '12px 0', fontWeight: 800, fontSize: 14,
              background: mySkipVote ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.25)',
              border: `2px solid rgba(239,68,68,${mySkipVote ? 0.3 : 0.5})`,
              borderRadius: 12, color: mySkipVote ? '#fca5a5' : 'inherit',
              cursor: mySkipVote ? 'default' : 'pointer', opacity: mySkipVote ? 0.65 : 1,
            }}
          >
            {mySkipVote ? '✓ 已投跳過' : '⏭️ 投票跳過'}
          </button>
          <div style={{ fontSize: 13, opacity: 0.7, minWidth: 56, textAlign: 'center' }}>
            {skipCount}/{skipNeeded}
            <br/><span style={{ fontSize: 11, opacity: 0.6 }}>票跳過</span>
          </div>
        </div>
      )}
    </div>
  );
}
