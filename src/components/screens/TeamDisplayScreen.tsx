import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import ConfirmDialog from '../ui/ConfirmDialog';
import ProgressBar from '../ui/ProgressBar';

export default function TeamDisplayScreen() {
  const { getCurrentTeam, currentRound, settings, setScreen, resetGame } = useGameStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const team = getCurrentTeam();

  if (!team) return null;

  return (
    <div className="screen fade-in" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28 }}>
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

      {/* Team color circle */}
      <div className="bounce-in" style={{
        width: 120, height: 120, borderRadius: '50%',
        background: team.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem',
        boxShadow: `0 0 40px ${team.color}66`,
        marginTop: 40,
      }}>
        🎨
      </div>

      <div className="col" style={{ gap: 8 }}>
        <p className="label">輪到 It's time for</p>
        <h1 className="title-xl" style={{ color: team.color }}>{team.name}</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontWeight: 700 }}>
          準備好了嗎？ Ready?
        </p>
      </div>

      <div className="dashed-card" style={{ maxWidth: 300 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.7 }}>
          1️⃣ 畫者睇題目，唔可以出聲<br />
          2️⃣ 係紙上畫出題目<br />
          3️⃣ 隊友猜答案！
        </p>
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => setScreen('word-card')}>
        睇題目 See Word →
      </button>
    </div>
  );
}
