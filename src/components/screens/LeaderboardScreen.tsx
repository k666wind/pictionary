import { useGameStore } from '../../store/gameStore';
import { clearLeaderboard } from '../../utils/storage';

export default function LeaderboardScreen() {
  const { leaderboard, setScreen } = useGameStore();

  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
  const medals = ['🥇', '🥈', '🥉'];

  function handleClear() {
    if (confirm('確定清除所有記錄？Clear all records?')) {
      clearLeaderboard();
      window.location.reload();
    }
  }

  return (
    <div className="screen fade-in" style={{ gap: 20 }}>
      {/* Header */}
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('home')}>← 返回</button>
        <h2 className="title-md" style={{ color: 'var(--yellow)' }}>🏆 排行榜 Leaderboard</h2>
      </div>

      {sorted.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: '4rem' }}>📭</div>
          <p style={{ color: 'var(--text-dim)', fontWeight: 700, fontSize: '1.1rem' }}>
            未有記錄 No records yet
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            完成一場遊戲就會出現！
          </p>
        </div>
      ) : (
        <div className="scroll-list">
          {sorted.map((entry, i) => (
            <div key={entry.id} className="card" style={{
              border: i === 0 ? '2px solid var(--yellow)' : '1px solid var(--border)',
              background: i === 0 ? 'rgba(255,217,61,0.08)' : 'var(--surface)',
            }}>
              <div className="row-between">
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ fontSize: '1.4rem' }}>{medals[i] ?? `#${i + 1}`}</span>
                  <div className="col" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: i === 0 ? 'var(--yellow)' : 'var(--text)' }}>
                      {entry.teamName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {entry.date} · {entry.mode}
                    </span>
                  </div>
                </div>
                <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: i === 0 ? 'var(--yellow)' : 'var(--text-dim)' }}>
                  {entry.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ color: 'var(--coral)' }}>
          🗑 清除記錄 Clear All
        </button>
      )}
    </div>
  );
}
