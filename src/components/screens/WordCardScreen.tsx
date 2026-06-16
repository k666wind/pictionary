import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CATEGORY_EMOJIS, DIFFICULTY_COLORS } from '../../utils/game';
import ConfirmDialog from '../ui/ConfirmDialog';
import ProgressBar from '../ui/ProgressBar';

export default function WordCardScreen() {
  const { getCurrentWord, getCurrentTeam, setScreen, resetGame, currentRound, settings } = useGameStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const word = getCurrentWord();
  const team = getCurrentTeam();

  if (!word || !team) return null;

  return (
    <div className="screen fade-in" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
      {showExitDialog && (
        <ConfirmDialog
          title="退出遊戲？"
          message="確定退出？所有進度將會消失。\nExit game? All progress will be lost."
          confirmLabel="退出 Exit"
          danger
          onConfirm={() => { setShowExitDialog(false); resetGame(); }}
          onCancel={() => setShowExitDialog(false)}
        />
      )}

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20 }}>
        <div className="row-between" style={{ marginBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}
            onClick={() => setShowExitDialog(true)}>
            ✕ 退出
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 }}>
            回合 {currentRound} / {settings.totalRounds}
          </span>
        </div>
        <ProgressBar current={currentRound - 1} total={settings.totalRounds} color={team.color} />
      </div>

      {/* Team indicator */}
      <div className="badge" style={{ background: team.color + '33', color: team.color, fontSize: '1rem', marginTop: 40 }}>
        {team.name} 畫緊 ✏️
      </div>

      {/* Word card */}
      <div className="bounce-in" style={{
        background: 'var(--surface)',
        border: `3px solid ${team.color}`,
        borderRadius: 28,
        padding: '44px 32px',
        width: '100%',
        maxWidth: 340,
        boxShadow: `0 12px 48px ${team.color}44, 0 2px 0 ${team.color}88 inset`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle corner decoration */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: team.color + '18',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 60, height: 60, borderRadius: '50%',
          background: team.color + '12',
          pointerEvents: 'none',
        }} />

        {/* Category + difficulty */}
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
            {CATEGORY_EMOJIS[word.category]} {word.category}
          </span>
          <span className="badge" style={{
            background: DIFFICULTY_COLORS[word.difficulty] + '33',
            color: DIFFICULTY_COLORS[word.difficulty],
          }}>
            {word.difficulty === 'easy' ? '😊 Easy' : word.difficulty === 'medium' ? '🤔 Medium' : '😅 Hard'}
          </span>
        </div>

        {/* Chinese word — big */}
        <p style={{
          fontFamily: 'Fredoka One, cursive',
          fontSize: '4rem',
          color: 'var(--yellow)',
          lineHeight: 1.1,
          marginBottom: 10,
          textShadow: '0 2px 12px rgba(255,217,61,0.3)',
        }}>
          {word.zh}
        </p>

        {/* Divider */}
        <div style={{ height: 2, background: 'var(--border)', margin: '14px auto', width: 60, borderRadius: 1 }} />

        {/* English word */}
        <p style={{
          fontFamily: 'Fredoka One, cursive',
          fontSize: '2.1rem',
          color: 'var(--text-dim)',
        }}>
          {word.en}
        </p>
      </div>

      {/* Warning */}
      <div className="dashed-card" style={{ maxWidth: 300, padding: '12px 20px' }}>
        <p style={{ color: 'var(--coral)', fontWeight: 800, fontSize: '0.95rem' }}>
          ⚠️ 唔可以講出題目！<br />
          <span style={{ color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem' }}>No speaking the word!</span>
        </p>
      </div>

      <button className="btn btn-green btn-lg" onClick={() => setScreen(settings.canvasEnabled ? 'local-draw' : 'timer')}>
        開始畫！Start Drawing! ✏️
      </button>
    </div>
  );
}
