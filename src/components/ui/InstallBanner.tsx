import { usePwaInstall } from '../../utils/usePwaInstall';

export default function InstallBanner() {
  const { showBanner, install, dismiss } = usePwaInstall();

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 16,
      right: 16,
      zIndex: 500,
      background: 'var(--surface)',
      border: '2px solid var(--yellow)',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slide-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <span style={{ fontSize: '2rem', flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 2 }}>
          安裝 App Install
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
          加到主畫面，離線都可以玩！
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={install}
        >
          安裝
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={dismiss}
          style={{ padding: '8px 10px' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
