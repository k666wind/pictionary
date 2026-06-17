import { useGameStore } from '../../store/gameStore';
import FloatingParticles from '../ui/FloatingParticles';
import InstallBanner from '../ui/InstallBanner';

const APP_VERSION = '2.0.0';

export default function HomeScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="screen" style={{
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      gap: 0,
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100dvh',
    }}>
      <FloatingParticles />
      <InstallBanner />

      {/* Content layer above particles */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        padding: '40px 24px 100px',
        width: '100%',
      }}>

        {/* Logo area */}
        <div className="col fade-in" style={{ alignItems: 'center', gap: 10, animationDelay: '0s' }}>
          <div style={{
            fontSize: '6rem',
            lineHeight: 1,
            filter: 'drop-shadow(0 4px 20px rgba(255,217,61,0.5))',
            animation: 'float 3s ease-in-out infinite',
          }}>
            🎨
          </div>
          <h1 style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '3.2rem',
            color: 'var(--yellow)',
            lineHeight: 1,
            textShadow: '0 2px 20px rgba(255,217,61,0.4)',
          }}>
            Pictionary
          </h1>
          <p style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '1.5rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.05em',
          }}>
            畫畫猜猜
          </p>
        </div>

        {/* Tagline card */}
        <div className="dashed-card fade-in" style={{
          maxWidth: 280,
          animationDelay: '0.15s',
          padding: '14px 20px',
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            睇題目 → 拎支筆 → 係紙上畫<br />
            <span style={{ color: 'var(--yellow)' }}>Let the guessing begin! 🖊️</span>
          </p>
        </div>

        {/* Main buttons */}
        <div className="col fade-in" style={{
          width: '100%',
          maxWidth: 300,
          gap: 12,
          animationDelay: '0.25s',
        }}>
          {/* ← Changed: go to mode-select instead of setup */}
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={() => setScreen('mode-select')}
            style={{ fontSize: '1.25rem' }}
          >
            🎮 開始遊戲 Play
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn btn-ghost btn-block" onClick={() => setScreen('leaderboard')}
              style={{ fontSize: '0.95rem' }}>
              🏆 排行榜
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setScreen('word-bank-manager')}
              style={{ fontSize: '0.95rem' }}>
              📚 題目庫
            </button>
          </div>

          <button className="btn btn-ghost btn-block" onClick={() => setScreen('settings')}
            style={{ fontSize: '0.95rem', color: 'var(--text-dim)' }}>
            ⚙️ 設定 Settings
          </button>
        </div>

        {/* Feature pills */}
        <div className="fade-in" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          animationDelay: '0.35s',
        }}>
          {[
            '175+ 題目',
            '本地多人',
            '🌐 網絡多人',
            '自定義題目庫',
            '離線可用',
          ].map((label) => (
            <span key={label} style={{
              padding: '4px 12px',
              borderRadius: 50,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* Version */}
        <p style={{
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
          opacity: 0.5,
          letterSpacing: '0.05em',
        }}>
          v{APP_VERSION} · Phase 2B · Online Multiplayer
        </p>
      </div>
    </div>
  );
}
