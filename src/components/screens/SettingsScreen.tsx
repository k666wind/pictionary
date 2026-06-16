import { useGameStore } from '../../store/gameStore';

const APP_VERSION = '1.0.0';
import { SFX, VIB } from '../../utils/audio';

interface ToggleRowProps {
  label: string;
  sublabel: string;
  emoji: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, sublabel, emoji, value, onChange }: ToggleRowProps) {
  return (
    <div className="card row-between" style={{ padding: '16px 20px' }}>
      <div className="row" style={{ gap: 14 }}>
        <span style={{ fontSize: '1.8rem' }}>{emoji}</span>
        <div className="col" style={{ gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{label}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{sublabel}</span>
        </div>
      </div>
      {/* Toggle switch */}
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 52,
          height: 28,
          borderRadius: 14,
          background: value ? 'var(--green)' : 'var(--surface2)',
          border: `2px solid ${value ? 'var(--green)' : 'var(--border)'}`,
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s, border-color 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: value ? 24 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}

export default function SettingsScreen() {
  const { setScreen, soundEnabled, vibrationEnabled, setSoundEnabled, setVibrationEnabled } = useGameStore();

  function handleSoundToggle(v: boolean) {
    setSoundEnabled(v);
    if (v) SFX.correct(); // preview
  }

  function handleVibToggle(v: boolean) {
    setVibrationEnabled(v);
    if (v) VIB.correct(); // preview
  }

  return (
    <div className="screen fade-in" style={{ gap: 24 }}>
      {/* Header */}
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('home')}>← 返回</button>
        <h2 className="title-md" style={{ color: 'var(--yellow)' }}>⚙️ 設定 Settings</h2>
      </div>

      <div className="col" style={{ gap: 12 }}>
        <span className="label">音效 & 震動</span>

        <ToggleRow
          emoji="🔊"
          label="音效 Sound Effects"
          sublabel="Beeps, fanfare, buzzer"
          value={soundEnabled}
          onChange={handleSoundToggle}
        />

        <ToggleRow
          emoji="📳"
          label="震動 Vibration"
          sublabel="Haptic feedback on key moments"
          value={vibrationEnabled}
          onChange={handleVibToggle}
        />
      </div>

      <div className="divider" />

      <div className="col" style={{ gap: 8 }}>
        <span className="label">關於 About</span>
        <div className="dashed-card col" style={{ gap: 6 }}>
          <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--yellow)' }}>Pictionary 畫畫猜猜</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>v{APP_VERSION} · Phase 1D · Local Multiplayer</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            適合小朋友嘅畫畫猜猜遊戲<br />
            Draw & Guess party game for kids
          </p>
        </div>
      </div>
    </div>
  );
}
