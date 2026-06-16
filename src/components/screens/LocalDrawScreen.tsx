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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: 'var(--bg)',
      padding: '16px 16px 20px',
      gap: 12,
      maxWidth: 480,
      margin: '0 auto',
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

      {/* Top bar */}
      <div>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}
            onClick={() => { pauseTimer(); setShowExitDialog(true); }}>
            ✕ 退出
          </button>
          {/* Compact timer */}
          <div style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '1.6rem',
            color: timerColor,
            transition: 'color 0.3s',
            animation: isDanger ? 'scale-pulse 0.8s ease-in-out infinite' : 'none',
            minWidth: 52,
            textAlign: 'center',
          }}>
            {timeLeft}s
          </div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}
            onClick={() => { if (vibrationEnabled) VIB.buttonPress(); isTimerRunning ? pauseTimer() : resumeTimer(); }}>
            {isTimerRunning ? '⏸' : '▶️'}
          </button>
        </div>
        <ProgressBar current={turnsDone} total={totalTurns} color={team.color} />
      </div>

      {/* Team + word pill */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="badge" style={{ background: team.color + '33', color: team.color }}>
          {team.name} ✏️
        </div>
        {/* Toggle word visibility */}
        <button
          onClick={() => setShowWord(v => !v)}
          className="badge"
          style={{
            background: 'var(--surface2)',
            color: 'var(--text-dim)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
          }}
        >
          {showWord ? '👁️ 隱藏題目' : '👁️ 顯示題目'}
        </button>
      </div>

      {/* Word display — collapsible so guesser can't peek */}
      {showWord && (
        <div style={{
          background: 'var(--surface)',
          border: `2px solid ${team.color}`,
          borderRadius: 14,
          padding: '12px 20px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <p style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '2.2rem',
            color: 'var(--yellow)',
            lineHeight: 1.1,
          }}>{word.zh}</p>
          <p style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '1.2rem',
            color: 'var(--text-dim)',
          }}>{word.en}</p>
        </div>
      )}

      {/* Canvas — takes remaining space */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <DrawingCanvas height="100%" />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
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
