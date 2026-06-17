import type { NetworkPlayer } from '../../types/network';

interface PlayerListProps {
  players: NetworkPlayer[];
  myId: string | null;
  hostId: string;
  onKick?: (id: string) => void;
  scores?: Record<string, number>;
}

export default function PlayerList({ players, myId, hostId, onKick, scores }: PlayerListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '10px 14px',
            opacity: p.isConnected ? 1 : 0.45,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-primary, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {p.name.slice(0, 1).toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              {p.name}
              {p.id === myId && <span style={{ fontSize: 11, opacity: 0.6 }}>(我)</span>}
              {p.isHost && <span style={{ fontSize: 11 }}>👑</span>}
              {!p.isConnected && <span style={{ fontSize: 11, opacity: 0.6 }}>離線</span>}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{p.teamName}</div>
          </div>

          {/* Score */}
          {scores !== undefined && (
            <div style={{ fontWeight: 700, fontSize: 18, minWidth: 28, textAlign: 'right' }}>
              {scores[p.id] ?? 0}
            </div>
          )}

          {/* Ready / kick */}
          {scores === undefined && (
            <div style={{ fontSize: 13 }}>
              {p.isReady ? '✅' : '⏳'}
            </div>
          )}

          {onKick && p.id !== myId && p.id !== hostId && (
            <button
              onClick={() => onKick(p.id)}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: 'none',
                borderRadius: 6,
                color: '#ef4444',
                fontSize: 12,
                padding: '3px 8px',
                cursor: 'pointer',
              }}
            >
              踢
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
