import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';

type Tab = 'create' | 'join';

export default function OnlineLobbyScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const { createRoom, joinRoom, connectionStatus, lastError, clearError } = useNetworkStore();
  const roomState = useNetworkStore((s) => s.roomState);

  const [tab, setTab] = useState<Tab>('create');
  const [playerName, setPlayerName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Once we have a roomState, go to waiting room
  if (roomState) {
    setScreen('waiting-room');
    return null;
  }

  const isConnecting = connectionStatus === 'connecting';

  const handleCreate = () => {
    if (!playerName.trim()) return;
    createRoom(playerName.trim(), teamName.trim() || playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || roomCode.length < 4) return;
    joinRoom(roomCode.toUpperCase(), playerName.trim(), teamName.trim() || playerName.trim());
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.1)',
    border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '12px 14px',
    color: 'inherit',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const btnStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px 0',
    fontWeight: 700,
    fontSize: 14,
    background: active ? 'var(--color-primary, #7c3aed)' : 'rgba(255,255,255,0.07)',
    border: 'none',
    borderRadius: 10,
    color: 'inherit',
    cursor: 'pointer',
  });

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🌐 網絡多人</h1>
        <p style={{ fontSize: 13, opacity: 0.55, marginBottom: 24 }}>Online Multiplayer</p>

        {/* Tab */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button style={btnStyle(tab === 'create')} onClick={() => setTab('create')}>
            開房 Create
          </button>
          <button style={btnStyle(tab === 'join')} onClick={() => setTab('join')}>
            加入 Join
          </button>
        </div>

        {/* Error */}
        {lastError && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#fca5a5',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {lastError}
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <input
            style={inputStyle}
            placeholder="你嘅名字 Your name *"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
          />
          <input
            style={inputStyle}
            placeholder="隊伍名稱 Team name（可選）"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={16}
          />
          {tab === 'join' && (
            <input
              style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 4, fontWeight: 700, fontSize: 18, textAlign: 'center' }}
              placeholder="房間碼 XXXX"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
            />
          )}
        </div>

        {/* Action button */}
        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={isConnecting || !playerName.trim() || (tab === 'join' && roomCode.length < 4)}
          style={{
            width: '100%',
            padding: '14px 0',
            fontWeight: 800,
            fontSize: 16,
            background: 'var(--color-primary, #7c3aed)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            cursor: 'pointer',
            opacity: isConnecting ? 0.6 : 1,
          }}
        >
          {isConnecting ? '連線中…' : tab === 'create' ? '開房！' : '加入！'}
        </button>

        <button
          onClick={() => setScreen('mode-select')}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'inherit',
            opacity: 0.55,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          ← 返回
        </button>
      </div>
    </div>
  );
}
