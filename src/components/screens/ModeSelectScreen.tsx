import { useGameStore } from '../../store/gameStore';

export default function ModeSelectScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 20,
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>
        選擇遊戲模式
      </h1>
      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 8, textAlign: 'center' }}>
        Choose Game Mode
      </p>

      {/* Local */}
      <button
        onClick={() => setScreen('setup')}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: 18,
          padding: '22px 24px',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 6 }}>📱</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>本地多人</div>
        <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>Local Multiplayer</div>
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>傳手機玩，唔需網絡</div>
      </button>

      {/* Online */}
      <button
        onClick={() => setScreen('online-lobby')}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25))',
          border: '2px solid rgba(124,58,237,0.5)',
          borderRadius: 18,
          padding: '22px 24px',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 6 }}>🌐</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>網絡多人</div>
        <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>Online Multiplayer</div>
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>各自用自己部機，跨設備玩</div>
      </button>

      <button
        onClick={() => setScreen('home')}
        style={{
          marginTop: 8,
          background: 'none',
          border: 'none',
          color: 'inherit',
          opacity: 0.6,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        ← 返回主頁
      </button>
    </div>
  );
}
