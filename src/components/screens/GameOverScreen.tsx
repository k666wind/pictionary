import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import { SFX, VIB } from '../../utils/audio';
import Confetti from '../ui/Confetti';

interface Props {
  isOnline?: boolean;
}

export default function GameOverScreen({ isOnline = false }: Props) {
  const { teams, resetGame, startGame, setTeams, settings, soundEnabled, vibrationEnabled } = useGameStore();
  const { roomState, myPlayerId, leaveRoom } = useNetworkStore();
  const setScreen = useGameStore((s) => s.setScreen);
  const [showConfetti, setShowConfetti] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];

  useEffect(() => {
    setShowConfetti(true);
    if (soundEnabled) SFX.winner();
    if (vibrationEnabled) VIB.correct();
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online mode ──
  if (isOnline && roomState) {
    const scores = roomState.scores;
    const players = [...roomState.players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    const winner = players[0];
    const isTie = players.length > 1 && (scores[players[0].id] ?? 0) === (scores[players[1].id] ?? 0);

    const handleLeave = () => {
      leaveRoom();
      setScreen('home');
    };

    return (
      <div className="screen fade-in" style={{ alignItems: 'center', textAlign: 'center', gap: 28 }}>
        <Confetti active={showConfetti} />
        <div style={{ fontSize: '5rem', marginTop: 16 }}>🏆</div>
        <div className="col" style={{ gap: 8 }}>
          <p className="label">{isTie ? "平手！It's a Tie!" : '勝利者 Winner'}</p>
          {!isTie && winner && (
            <h1 className="title-xl bounce-in" style={{ color: winner.id === myPlayerId ? 'var(--yellow)' : 'var(--text)' }}>
              {winner.name}{winner.id === myPlayerId ? ' 🎉' : ''}
            </h1>
          )}
        </div>
        <div className="card" style={{ width: '100%', maxWidth: 320 }}>
          <p className="label" style={{ marginBottom: 14 }}>最終分數 Final Scores</p>
          <div className="col" style={{ gap: 10 }}>
            {players.map((p, i) => (
              <div key={p.id} className="row-between" style={{
                padding: '12px 16px', borderRadius: 12,
                background: i === 0 ? 'rgba(255,217,61,0.15)' : 'var(--surface2)',
                border: i === 0 ? '2px solid rgba(255,217,61,0.5)' : '2px solid transparent',
              }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontSize: '1.3rem' }}>{medals[i] ?? '🎖'}</span>
                  <span style={{ fontWeight: 800 }}>{p.name}{p.id === myPlayerId ? ' (我)' : ''}</span>
                </div>
                <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.6rem' }}>{scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="col" style={{ width: '100%', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-ghost btn-block" onClick={handleLeave}>
            🏠 返回主頁 Home
          </button>
        </div>
      </div>
    );
  }

  // ── Local mode ──
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;

  function playAgain() {
    if (vibrationEnabled) VIB.buttonPress();
    setTeams(teams.map((t) => ({ ...t, score: 0 })));
    startGame();
  }

  return (
    <div className="screen fade-in" style={{ alignItems: 'center', textAlign: 'center', gap: 28 }}>
      <Confetti active={showConfetti} />
      <div style={{ fontSize: '5rem', marginTop: 16 }}>🏆</div>
      <div className="col" style={{ gap: 8 }}>
        <p className="label">{isTie ? "平手！It's a Tie!" : '勝利者 Winner'}</p>
        {!isTie && <h1 className="title-xl bounce-in" style={{ color: winner.color }}>{winner.name}</h1>}
        {isTie && (
          <h2 className="title-lg" style={{ color: 'var(--yellow)' }}>
            {sorted.filter((t) => t.score === winner.score).map((t) => t.name).join(' & ')}
          </h2>
        )}
      </div>
      <div className="card" style={{ width: '100%', maxWidth: 320 }}>
        <p className="label" style={{ marginBottom: 14 }}>最終分數 Final Scores</p>
        <div className="col" style={{ gap: 10 }}>
          {sorted.map((t, i) => (
            <div key={t.id} className="row-between" style={{
              padding: '12px 16px', borderRadius: 12,
              background: i === 0 ? t.color + '22' : 'var(--surface2)',
              border: i === 0 ? `2px solid ${t.color}` : '2px solid transparent',
            }}>
              <div className="row" style={{ gap: 10 }}>
                <span style={{ fontSize: '1.3rem' }}>{medals[i] ?? '🎖'}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                <span style={{ fontWeight: 800, color: i === 0 ? t.color : 'var(--text)' }}>{t.name}</span>
              </div>
              <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.6rem', color: t.color }}>{t.score}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="dashed-card" style={{ width: '100%', maxWidth: 320 }}>
        <p style={{ color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.9rem' }}>
          {settings.totalRounds} 回合 · {sorted.reduce((s, t) => s + t.score, 0)} 題猜中
        </p>
      </div>
      <div style={{ flex: 1 }} />
      <div className="col" style={{ width: '100%', gap: 12, marginBottom: 8 }}>
        <button className="btn btn-primary btn-lg btn-block" onClick={playAgain}>🔄 再玩！Play Again!</button>
        <button className="btn btn-ghost btn-block" onClick={() => { if (vibrationEnabled) VIB.buttonPress(); resetGame(); }}>
          🏠 返回主頁 Home
        </button>
      </div>
    </div>
  );
}
