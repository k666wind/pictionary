import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Difficulty, Category } from '../../types';
import { TEAM_COLORS, CATEGORY_EMOJIS, generateId, filterWords } from '../../utils/game';
import { BUILT_IN_WORD_BANKS } from '../../data/wordBanks';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'animals', label: '🐾 動物 Animals' },
  { id: 'food', label: '🍎 食物 Food' },
  { id: 'sports', label: '⚽ 運動 Sports' },
  { id: 'home', label: '🏠 家居 Home' },
  { id: 'places', label: '🌍 地方 Places' },
  { id: 'actions', label: '🎬 動作 Actions' },
  { id: 'nature', label: '🌈 自然 Nature' },
];

export default function SetupScreen() {
  const { settings, updateSettings, setTeams, setPlayers, startGame, setScreen, customWordBanks } = useGameStore();

  const [teamNames, setTeamNames] = useState<string[]>(['隊伍 A', '隊伍 B']);

  const allBanks = [...BUILT_IN_WORD_BANKS, ...customWordBanks];

  function addTeam() {
    if (teamNames.length >= 6) return;
    setTeamNames([...teamNames, `隊伍 ${String.fromCharCode(65 + teamNames.length)}`]);
  }

  function removeTeam(i: number) {
    if (teamNames.length <= 2) return;
    setTeamNames(teamNames.filter((_, idx) => idx !== i));
  }

  function toggleCategory(cat: Category) {
    const cats = settings.categories;
    const next = cats.includes(cat) ? cats.filter((c) => c !== cat) : [...cats, cat];
    if (next.length === 0) return;
    updateSettings({ categories: next });
  }

  function toggleBank(id: string) {
    const ids = settings.wordBankIds;
    const next = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
    if (next.length === 0) return;
    updateSettings({ wordBankIds: next });
  }

  function handleStart() {
    const teams = teamNames.map((name, i) => ({
      id: generateId(),
      name,
      score: 0,
      playerIds: [],
      color: TEAM_COLORS[i % TEAM_COLORS.length],
    }));
    setTeams(teams);
    setPlayers([]);
    startGame();
  }

  return (
    <div className="screen fade-in" style={{ gap: 24 }}>
      {/* Header */}
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('home')}>← 返回</button>
        <h2 className="title-md" style={{ color: 'var(--yellow)' }}>遊戲設置 Setup</h2>
      </div>

      {/* Teams */}
      <div className="col">
        <span className="label">隊伍 Teams</span>
        {teamNames.map((name, i) => (
          <div key={i} className="row">
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: TEAM_COLORS[i % TEAM_COLORS.length],
              flexShrink: 0,
            }} />
            <input
              className="input"
              value={name}
              onChange={(e) => {
                const next = [...teamNames];
                next[i] = e.target.value;
                setTeamNames(next);
              }}
              placeholder={`隊伍 ${i + 1}`}
              maxLength={16}
            />
            {teamNames.length > 2 && (
              <button className="btn btn-ghost btn-sm" onClick={() => removeTeam(i)} style={{ flexShrink: 0 }}>✕</button>
            )}
          </div>
        ))}
        {teamNames.length < 6 && (
          <button className="btn btn-ghost btn-sm" onClick={addTeam}>+ 加隊伍 Add Team</button>
        )}
      </div>

      <div className="divider" />

      {/* Difficulty */}
      <div className="col">
        <span className="label">難度 Difficulty</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              className={`chip ${settings.difficulty === d ? 'active' : ''}`}
              onClick={() => updateSettings({ difficulty: d as Difficulty | 'all' })}
            >
              {d === 'all' ? '全部 All' : d === 'easy' ? '😊 簡單' : d === 'medium' ? '🤔 中等' : '😅 困難'}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="col">
        <span className="label">類別 Categories</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              className={`chip ${settings.categories.includes(id) ? 'active' : ''}`}
              onClick={() => toggleCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Word Banks */}
      {customWordBanks.length > 0 && (
        <div className="col">
          <span className="label">題目庫 Word Banks</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allBanks.map((b) => (
              <button
                key={b.id}
                className={`chip ${settings.wordBankIds.includes(b.id) ? 'active' : ''}`}
                onClick={() => toggleBank(b.id)}
              >
                {b.isCustom ? '⭐ ' : CATEGORY_EMOJIS[b.id] + ' '}{b.name.zh} {b.name.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="col">
        <span className="label">計時 Timer</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {[60, 90, 120].map((t) => (
            <button
              key={t}
              className={`chip ${settings.timerSeconds === t ? 'active' : ''}`}
              onClick={() => updateSettings({ timerSeconds: t })}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="col">
        <span className="label">回合 Rounds</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {[2, 3, 5, 7].map((r) => (
            <button
              key={r}
              className={`chip ${settings.totalRounds === r ? 'active' : ''}`}
              onClick={() => updateSettings({ totalRounds: r })}
            >
              {r} 回合
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Canvas toggle */}
      <div className="col">
        <span className="label">畫畫模式 Drawing Mode</span>
        <div
          className="card row-between"
          style={{ padding: '14px 18px', cursor: 'pointer' }}
          onClick={() => updateSettings({ canvasEnabled: !settings.canvasEnabled })}
        >
          <div className="row" style={{ gap: 12 }}>
            <span style={{ fontSize: '1.6rem' }}>🖊️</span>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontWeight: 800 }}>App 內畫畫 In-App Canvas</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                {settings.canvasEnabled ? '開啟 — 係 App 內畫' : '關閉 — 係紙上畫（預設）'}
              </span>
            </div>
          </div>
          {/* Toggle */}
          <div style={{
            width: 52, height: 28, borderRadius: 14, flexShrink: 0,
            background: settings.canvasEnabled ? 'var(--green)' : 'var(--surface2)',
            border: `2px solid ${settings.canvasEnabled ? 'var(--green)' : 'var(--border)'}`,
            position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: 2,
              left: settings.canvasEnabled ? 24 : 2,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </div>
        </div>
      </div>

      {/* Word count preview */}
      {(() => {
        const allBanksLocal = [...BUILT_IN_WORD_BANKS, ...customWordBanks];
        const selected = allBanksLocal.filter((b) => settings.wordBankIds.includes(b.id));
        const count = filterWords(selected, settings.difficulty, settings.categories as import('../../types').Category[]).length;
        return (
          <div className="dashed-card" style={{ textAlign: 'center', padding: '10px 16px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: count > 0 ? 'var(--green)' : 'var(--coral)' }}>
              {count > 0
                ? `✅ ${count} 題可用 words available`
                : '⚠️ 未有題目符合條件，請調整設定'}
            </p>
          </div>
        );
      })()}

      <button className="btn btn-primary btn-lg btn-block" onClick={handleStart} disabled={false}>
        🎨 開始！Start!
      </button>
    </div>
  );
}
