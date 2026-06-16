import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CATEGORY_EMOJIS } from '../../utils/game';
import { SFX, VIB } from '../../utils/audio';
import ConfirmDialog from '../ui/ConfirmDialog';
import ProgressBar from '../ui/ProgressBar';

export default function TimerScreen() {
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

  const pct = timeLeft / settings.timerSeconds;
  const isDanger = timeLeft <= 10;
  const isWarning = timeLeft <= 30 && !isDanger;
  const timerColor = isDanger ? 'var(--coral)' : isWarning ? 'var(--orange)' : 'var(--green)';
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  // Total turns played so far for progress
  const totalTurns = settings.totalRounds * teams.length;
  const turnsDone = (currentRound - 1) * teams.length + (teams.findIndex(t => t.id === team.id));

  return (
    <div className="screen fade-in" style={{ alignItems: 'center', gap: 20 }}>
      {showExitDialog && (
        <ConfirmDialog
          title="退出遊戲？"
          message="確定退出？所有進度將會消失。\nExit game? All progress will be lost."
          confirmLabel="退出 Exit"
          danger
          onConfirm={() => { setShowExitDialog(false); resetGame(); }}
          onCancel={() => { setShowExitDialog(false); resumeTimer(); }}
        />
      )}

      {/* Top bar */}
      <div style={{ width: '100%' }}>
        <div className="row-between" style={{ marginBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}
            onClick={() => { pauseTimer(); setShowExitDialog(true); }}>
            ✕ 退出
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 }}>
            回合 {currentRound} / {settings.totalRounds}
          </span>
        </div>
        <ProgressBar current={turnsDone} total={totalTurns} color={team.color} />
      </div>

      {/* Team + category */}
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
        <div className="badge" style={{ background: team.color + '33', color: team.color, fontSize: '0.95rem' }}>{team.name}</div>
        <div className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
          {CATEGORY_EMOJIS[word.category]} {word.category}
        </div>
      </div>

      {/* Timer SVG */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--surface2)" strokeWidth="12" />
          <circle cx="100" cy="100" r={r} fill="none" stroke={timerColor} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }} />
        </svg>
        {isDanger && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            animation: 'pulse-danger 0.8s ease-out infinite',
            background: 'rgba(255,107,107,0.15)', pointerEvents: 'none',
          }} />
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: isDanger ? '4.2rem' : '3.2rem',
            color: timerColor, lineHeight: 1,
            transition: 'color 0.3s, font-size 0.15s',
            animation: isDanger ? 'scale-pulse 0.8s ease-in-out infinite' : 'none',
          }}>{timeLeft}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>秒 sec</span>
        </div>
      </div>

      {/* Word reminder */}
      <div className="card" style={{ width: '100%', textAlign: 'center', padding: '16px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: 6 }}>畫緊 Drawing:</p>
        <p style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: 'var(--yellow)' }}>{word.zh}</p>
        <p style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.1rem', color: 'var(--text-dim)' }}>{word.en}</p>
      </div>

      {/* Pause */}
      <button className="btn btn-ghost btn-sm" onClick={() => {
        if (vibrationEnabled) VIB.buttonPress();
        isTimerRunning ? pauseTimer() : resumeTimer();
      }}>
        {isTimerRunning ? '⏸ 暫停 Pause' : '▶️ 繼續 Resume'}
      </button>

      {/* Actions */}
      <div className="col" style={{ width: '100%', gap: 12, marginTop: 'auto' }}>
        <button className="btn btn-green btn-lg btn-block" onClick={handleGuessed}>✅ 猜中！Correct!</button>
        <button className="btn btn-coral btn-block" onClick={handleSkipped}>⏭ 跳過 Skip</button>
      </div>
    </div>
  );
}
