import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';
import { SFX, VIB } from '../../utils/audio';
import Confetti from '../ui/Confetti';

interface Props {
  isOnline?: boolean;
}

export default function RoundResultScreen({ isOnline = false }: Props) {
  const { roundResults, teams, currentRound, settings, getCurrentTeam, getAllWordBanks, nextTurn, soundEnabled, vibrationEnabled } = useGameStore();
  const { roomState, myPlayerId } = useNetworkStore();
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Online mode ──
  if (isOnline && roomState) {
    const result = roomState.lastResult;
    const guessed = result?.guessed ?? false;
    const scores = roomState.scores;
    const players = roomState.players;

    useEffect(() => {
      if (guessed) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      // Auto-advance handled by server (3s timeout), nothing needed here
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

    return (
      <div className="screen fade-in" style={{ alignItems: 'center', textAlign: 'center', gap: 24 }}>
        <Confetti active={showConfetti} />
        <div className="bounce-in" style={{ fontSize: '5rem', marginTop: 16 }}>
          {guessed ? '🎉' : result?.skipped ? '⏭' : '⏰'}
        </div>
        <div className="col" style={{ gap: 4 }}>
          <h2 className="title-lg" style={{ color: guessed ? 'var(--green)' : 'var(--coral)' }}>
            {guessed ? '猜中！Correct!' : result?.skipped ? '跳過 Skipped' : '時間到！Time Up!'}
          </h2>
          {result && (
            <p style={{ color: 'var(--text-dim)', fontSize: '1rem', fontWeight: 700 }}>
              題目係: <span style={{ color: 'var(--yellow)' }}>{result.wordZh} / {result.wordEn}</span>
            </p>
          )}
        </div>
        <div className="dashed-card" style={{ width: '100%', maxWidth: 320 }}>
          <p className="label" style={{ marginBottom: 12 }}>目前分數 Scores</p>
          <div className="col" style={{ gap: 10 }}>
            {sorted.map((p, i) => (
              <div key={p.id} className="row-between" style={{
                padding: '10px 16px', borderRadius: 12,
                background: p.id === myPlayerId ? 'rgba(124,58,237,0.15)' : 'var(--surface2)',
                border: p.id === myPlayerId ? '2px solid rgba(124,58,237,0.5)' : '2px solid transparent',
              }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-dim)' }}>#{i + 1}</span>
                  <span style={{ fontWeight: 800 }}>{p.name}{p.id === myPlayerId ? ' (我)' : ''}</span>
                </div>
                <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.4rem' }}>{scores[p.id] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, opacity: 0.5 }}>下一輪自動開始…</p>
      </div>
    );
  }

  // ── Local mode ──
  const lastResult = roundResults[roundResults.length - 1];
  const team = getCurrentTeam();
  const word = getAllWordBanks().flatMap((b) => b.words).find((w) => w.id === lastResult?.wordId);
  const guessed = lastResult?.guessed ?? false;
  const timedOut = lastResult ? !lastResult.guessed && !lastResult.skipped : false;

  useEffect(() => {
    if (guessed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else if (timedOut) {
      if (soundEnabled) SFX.timeUp();
      if (vibrationEnabled) VIB.timeUp();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lastResult || !team) return null;

  const isLastTurn = (() => {
    const nextTeamIdx = (teams.findIndex((t) => t.id === lastResult.teamId) + 1) % teams.length;
    const nextRound = nextTeamIdx === 0 ? currentRound + 1 : currentRound;
    return nextRound > settings.totalRounds;
  })();

  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="screen fade-in" style={{ alignItems: 'center', textAlign: 'center', gap: 24 }}>
      <Confetti active={showConfetti} />
      <div className="bounce-in" style={{ fontSize: '5rem', marginTop: 16 }}>
        {guessed ? '🎉' : timedOut ? '⏰' : '⏭'}
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h2 className="title-lg" style={{ color: guessed ? 'var(--green)' : 'var(--coral)' }}>
          {guessed ? '猜中！Correct!' : timedOut ? '時間到！Time Up!' : '跳過 Skipped'}
        </h2>
        {word && (
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', fontWeight: 700 }}>
            題目係: <span style={{ color: 'var(--yellow)' }}>{word.zh} / {word.en}</span>
          </p>
        )}
      </div>
      <div className="dashed-card" style={{ width: '100%', maxWidth: 320 }}>
        <p className="label" style={{ marginBottom: 12 }}>目前分數 Current Scores</p>
        <div className="col" style={{ gap: 10 }}>
          {sorted.map((t, i) => (
            <div key={t.id} className="row-between" style={{
              padding: '10px 16px', borderRadius: 12,
              background: t.id === lastResult.teamId ? t.color + '22' : 'var(--surface2)',
              border: t.id === lastResult.teamId ? `2px solid ${t.color}` : '2px solid transparent',
            }}>
              <div className="row" style={{ gap: 10 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-dim)' }}>#{i + 1}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                <span style={{ fontWeight: 800, color: t.id === lastResult.teamId ? t.color : 'var(--text)' }}>{t.name}</span>
              </div>
              <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.4rem', color: t.color }}>{t.score}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-lg btn-block" style={{ marginBottom: 8 }}
        onClick={() => { if (vibrationEnabled) VIB.buttonPress(); nextTurn(); }}>
        {isLastTurn ? '🏆 睇結果 See Results' : '下一輪 Next Turn →'}
      </button>
    </div>
  );
}
