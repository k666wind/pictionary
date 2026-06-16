import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SFX, VIB } from '../../utils/audio';
import DrawingCanvas from '../ui/DrawingCanvas';
import ConfirmDialog from '../ui/ConfirmDialog';
import ProgressBar from '../ui/ProgressBar';

export default function LocalDrawScreen() {
  const {
    timeLeft, settings, isTimerRunning,
    getCurrentWord, getCurrentTeam,
    tickTimer, pauseTimer, resumeTimer,
    markGuessed, markSkipped, resetGame,
    soundEnabled, vibrationEnabled,
    currentRound, teams,
  } = useGameStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTimeRef = useRef<number>(settings.timerSeconds);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showWord, setShowWord] = useState(true);

  const word = getCurrentWord();
  const team = getCurrentTeam();

  // Lock body scroll while drawing screen is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = prev;
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  useEffect(() => {
    prevTimeRef.current = settings.timerSeconds;
    resumeTimer();
    if (soundEnabled) SFX.gameStart();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => tickTimer(), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimerRunning]);

  useEffect(() => {
    if (timeLeft === prevTimeRef.current) return;
    prevTimeRef.current = timeLeft;
    if (timeLeft <= 0) return;
    if (timeLeft <= 3) {
      if (soundEnabled) SFX.urgentTick();
      if (vibrationEnabled) VIB.urgentTick();
    } else if (timeLeft <= 10) {
      if (soundEnabled) SFX.tick();
      if (vibrationEnabled) VIB.tick();
    }
  }, [timeLeft]);

  function handleGuessed() {
    if (soundEnabled) SFX.correct();
    if (vibrationEnabled) VIB.correct();
    markGuessed();
  }

  function handleSkipped() {
    if (soundEnabled) SFX.skip();
    if (vibrationEnabled) VIB.buttonPress();
    markSkipped();
  }

  if (!word || !team) return null;

  const isDanger = timeLeft <= 10;
  const isWarning = timeLeft <= 30 && !isDanger;
  const timerColor = isDanger ? '#FF6B6B' : isWarning ? '#FF9F43' : '#6BCB77';

  const totalTurns = settings.totalRounds * teams.length;
  const turnsDone = (currentRound - 1) * teams.length + (teams.findIndex(t => t.id === team.id));

  return (
    // Use 100dvh, overflow hidden — prevents any scroll that would steal touch events
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      padding: '12px 14px 14px',
      gap: 10,
      maxWidth: 480,
      margin: '0 auto',
      // Keep left/right centred on wide screens
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
    }}>
      {showExitDialog && (
        <ConfirmDialog
          title="退出遊戲？"
          message="確定退出？所有進度將會消失。\nExit game?"
          confirmLabel="退出 Exit"
          danger
          onConfirm={() => { setShowExitDialog(false); resetGame(); }}
          onCancel={() => { setShowExitDialog(false); resumeTimer(); }}
        />
      )}

      {/* ── Top bar ── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}
            onClick={() => { pauseTimer(); setShowExitDialog(true); }}>
            ✕ 退出
          </button>
          {/* Compact timer */}
          <span style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '1.8rem',
            color: timerColor,
            transition: 'color 0.3s',
            animation: isDanger ? 'scale-pulse 0.8s ease-in-out infinite' : 'none',
            minWidth: 60,
            textAlign: 'center',
          }}>
            {timeLeft}s
          </span>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.9rem', minWidth: 48 }}
            onClick={() => {
              if (vibrationEnabled) VIB.buttonPress();
              isTimerRunning ? pauseTimer() : resumeTimer();
            }}>
            {isTimerRunning ? '⏸' : '▶️'}
          </button>
        </div>
        <ProgressBar current={turnsDone} total={totalTurns} color={team.color} />
      </div>

      {/* ── Team chip + hide-word toggle ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <div className="badge" style={{ background: team.color + '33', color: team.color }}>
          {team.name} ✏️
        </div>
        <button
          onClick={() => setShowWord(v => !v)}
          style={{
            padding: '4px 12px',
            borderRadius: 50,
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            color: 'var(--text-dim)',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          {showWord ? '🙈 隱藏題目' : '👁️ 顯示題目'}
        </button>
      </div>

      {/* ── Word display ── */}
      {showWord && (
        <div style={{
          flexShrink: 0,
          background: 'var(--surface)',
          border: `2px solid ${team.color}`,
          borderRadius: 14,
          padding: '10px 18px',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'Fredoka One, cursive', fontSize: '2rem', color: 'var(--yellow)', lineHeight: 1.1 }}>
            {word.zh}
          </p>
          <p style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.1rem', color: 'var(--text-dim)' }}>
            {word.en}
          </p>
        </div>
      )}

      {/* ── Canvas — fills remaining vertical space ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <DrawingCanvas height="100%" />
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          className="btn btn-green btn-block"
          style={{ flex: 2, fontSize: '1.05rem', padding: '14px 0' }}
          onClick={handleGuessed}
        >
          ✅ 猜中！Correct!
        </button>
        <button
          className="btn btn-coral"
          style={{ flex: 1, fontSize: '1rem', padding: '14px 0' }}
          onClick={handleSkipped}
        >
          ⏭ Skip
        </button>
      </div>
    </div>
  );
}
