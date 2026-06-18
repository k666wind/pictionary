import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNetworkStore } from '../../store/networkStore';

export default function OnlineWordCardScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const roomState = useNetworkStore((s) => s.roomState);
  const isDrawer = useNetworkStore((s) => s.isDrawer);
  const currentWord = useNetworkStore((s) => s.currentWord);
  const leaveRoom = useNetworkStore((s) => s.leaveRoom);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!roomState) { setScreen('online-lobby'); return; }
    if (roomState.phase === 'turn_result' || roomState.phase === 'countdown') setScreen('online-round-result');
    if (roomState.phase === 'game_over') setScreen('online-game-over');
    if (roomState.phase === 'waiting')   setScreen('waiting-room');
    // Non-drawer: auto-navigate to timer when phase stays playing
    // (drawer will push us there via phase change — handled below)
  }, [roomState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Key fix: non-drawer auto-goes to timer screen immediately ──
  // Drawer goes when they press the button; everyone else goes right away.
  useEffect(() => {
    if (!roomState) return;
    if (roomState.phase === 'playing' && !isDrawer()) {
      setScreen('online-timer');
    }
  }, [roomState?.currentDrawerIndex, roomState?.currentWordIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!roomState) return null;

  const drawer = roomState.players[roomState.currentDrawerIndex];
  const amDrawer = isDrawer();
  const round = roomState.currentRound;
  const totalRounds = roomState.settings.totalRounds;

  const handleLeave = () => {
    leaveRoom();
    setScreen('home');
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 28, gap: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 14, opacity: 0.6 }}>
        第 {round} / {totalRounds} 輪 &nbsp;·&nbsp; {roomState.players.length} 位玩家
      </div>

      <div style={{
        background: 'rgba(124,58,237,0.7)', borderRadius: 999,
        padding: '6px 18px', fontWeight: 700, fontSize: 14,
      }}>
        {amDrawer ? '你係畫者！🎨' : `✏️ ${drawer?.name ?? '??'} 畫緊`}
      </div>

      {/* Drawer: show word */}
      {amDrawer && currentWord && (
        <div>
          <div
            onClick={() => setHidden((h) => !h)}
            style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: 20,
              padding: '28px 36px', cursor: 'pointer',
            }}
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

      {/* Drawer: waiting for word from server */}
      {amDrawer && !currentWord && (
        <div style={{ fontSize: 18, opacity: 0.5 }}>載入題目中…</div>
      )}

      {/* Non-drawer: should not see this screen long — just in case */}
      {!amDrawer && (
        <div style={{ fontSize: 16, opacity: 0.6 }}>
          準備中… &nbsp;<span style={{ fontSize: 13 }}>Getting ready…</span>
        </div>
      )}

      {/* Drawer CTA */}
      {amDrawer && currentWord && (
        <button
          onClick={() => setScreen('online-timer')}
          style={{
            padding: '16px 40px', fontWeight: 800, fontSize: 18,
            background: 'rgba(124,58,237,0.8)', border: 'none',
            borderRadius: 14, color: '#fff', cursor: 'pointer',
          }}
        >
          開始畫！ 🎨
        </button>
      )}

      {/* Leave button — always visible */}
      <button
        onClick={handleLeave}
        style={{
          marginTop: 8, background: 'none',
          border: '1.5px solid rgba(239,68,68,0.4)',
          borderRadius: 10, color: '#fca5a5',
          fontSize: 13, padding: '8px 20px', cursor: 'pointer',
        }}
      >
        離開房間 Leave
      </button>
    </div>
  );
}
