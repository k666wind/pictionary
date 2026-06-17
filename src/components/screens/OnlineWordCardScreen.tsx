import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';

export default function OnlineWordCardScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const { roomState, myPlayerId, isDrawer, currentWord } = useNetworkStore();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'turn_result') setScreen('round-result');
    if (roomState.phase === 'game_over') setScreen('game-over');
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!roomState) return null;

  const drawer = roomState.players[roomState.currentDrawerIndex];
  const amDrawer = isDrawer();
  const totalPlayers = roomState.players.length;
  const round = roomState.currentRound;
  const totalRounds = roomState.settings.totalRounds;

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        gap: 24,
        textAlign: 'center',
      }}
    >
      {/* Round info */}
      <div style={{ fontSize: 14, opacity: 0.6 }}>
        第 {round} / {totalRounds} 輪 &nbsp;·&nbsp; {totalPlayers} 位玩家
      </div>

      {/* Drawer label */}
      <div
        style={{
          background: 'var(--color-primary, #7c3aed)',
          borderRadius: 999,
          padding: '6px 18px',
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {amDrawer ? '你係畫者！🎨' : `✏️ ${drawer?.name ?? '??'} 畫緊`}
      </div>

      {/* Word (drawer only) */}
      {amDrawer && currentWord && (
        <div>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '28px 36px',
              cursor: 'pointer',
            }}
            onClick={() => setHidden((h) => !h)}
          >
            {hidden ? (
              <div style={{ fontSize: 22, opacity: 0.4 }}>點擊顯示題目</div>
            ) : (
              <>
                <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>{currentWord.zh}</div>
                <div style={{ fontSize: 20, opacity: 0.7, marginTop: 6 }}>{currentWord.en}</div>
              </>
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.45, marginTop: 10 }}>點擊隱藏/顯示</div>
        </div>
      )}

      {/* Waiting (non-drawer) */}
      {!amDrawer && (
        <div style={{ fontSize: 18, opacity: 0.6 }}>
          等待畫者開始…<br />
          <span style={{ fontSize: 14 }}>Waiting for drawer…</span>
        </div>
      )}

      {/* CTA — drawer starts drawing */}
      {amDrawer && (
        <button
          onClick={() => setScreen('online-timer')}
          style={{
            padding: '16px 40px',
            fontWeight: 800,
            fontSize: 18,
            background: 'var(--color-primary, #7c3aed)',
            border: 'none',
            borderRadius: 14,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          開始畫！ 🎨
        </button>
      )}
    </div>
  );
}
