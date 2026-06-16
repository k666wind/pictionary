import { useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BUILT_IN_WORD_BANKS } from '../../data/wordBanks';
import { generateId } from '../../utils/game';
import { exportCustomBanksToJSON, importCustomBanksFromJSON } from '../../utils/storage';
import type { Difficulty, Word } from '../../types';
import ConfirmDialog from '../ui/ConfirmDialog';

type DialogState =
  | { type: 'none' }
  | { type: 'delete-bank'; bankId: string; bankName: string }
  | { type: 'import-confirm'; count: number; onConfirm: () => void };

export default function WordBankManagerScreen() {
  const { customWordBanks, addCustomWordBank, deleteCustomWordBank, addWordToBank, deleteWordFromBank, setScreen } = useGameStore();

  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [newBankNameZh, setNewBankNameZh] = useState('');
  const [newBankNameEn, setNewBankNameEn] = useState('');
  const [showNewBank, setShowNewBank] = useState(false);
  const [addingWordTo, setAddingWordTo] = useState<string | null>(null);
  const [newWordZh, setNewWordZh] = useState('');
  const [newWordEn, setNewWordEn] = useState('');
  const [newWordDiff, setNewWordDiff] = useState<Difficulty>('easy');
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allBanks = [...BUILT_IN_WORD_BANKS, ...customWordBanks];
  const totalCustomWords = customWordBanks.reduce((s, b) => s + b.words.length, 0);

  function handleCreateBank() {
    if (!newBankNameZh.trim()) return;
    addCustomWordBank({
      id: generateId(),
      name: { zh: newBankNameZh.trim(), en: newBankNameEn.trim() || newBankNameZh.trim() },
      isCustom: true,
      words: [],
    });
    setNewBankNameZh('');
    setNewBankNameEn('');
    setShowNewBank(false);
  }

  function handleAddWord(bankId: string) {
    if (!newWordZh.trim()) return;
    const word: Word = {
      id: generateId(),
      zh: newWordZh.trim(),
      en: newWordEn.trim() || newWordZh.trim(),
      difficulty: newWordDiff,
      category: 'custom',
    };
    addWordToBank(bankId, word);
    setNewWordZh('');
    setNewWordEn('');
    setNewWordDiff('easy');
    setAddingWordTo(null);
  }

  function handleExport() {
    if (customWordBanks.length === 0) {
      setImportStatus('未有自定義題目庫可匯出');
      setTimeout(() => setImportStatus(null), 2500);
      return;
    }
    exportCustomBanksToJSON(customWordBanks);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const { banks, result } = await importCustomBanksFromJSON(file);
    if (!result.success) {
      setImportStatus(`匯入失敗: ${result.error}`);
      setTimeout(() => setImportStatus(null), 3000);
      return;
    }

    setDialog({
      type: 'import-confirm',
      count: banks.length,
      onConfirm: () => {
        banks.forEach((b) => addCustomWordBank({ ...b, id: generateId() }));
        setDialog({ type: 'none' });
        setImportStatus(`成功匯入 ${banks.length} 個題目庫！`);
        setTimeout(() => setImportStatus(null), 2500);
      },
    });
  }

  return (
    <div className="screen fade-in" style={{ gap: 20 }}>
      {/* Confirm dialogs */}
      {dialog.type === 'delete-bank' && (
        <ConfirmDialog
          title="刪除題目庫"
          message={`確定刪除「${dialog.bankName}」？所有題目將會消失。\nDelete "${dialog.bankName}"?`}
          confirmLabel="刪除 Delete"
          danger
          onConfirm={() => { deleteCustomWordBank(dialog.bankId); setDialog({ type: 'none' }); }}
          onCancel={() => setDialog({ type: 'none' })}
        />
      )}
      {dialog.type === 'import-confirm' && (
        <ConfirmDialog
          title="確認匯入"
          message={`發現 ${dialog.count} 個題目庫。\n匯入後會加入現有庫，唔會覆蓋。\nImport ${dialog.count} banks?`}
          confirmLabel="匯入 Import"
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog({ type: 'none' })}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* Header */}
      <div className="row">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('home')}>← 返回</button>
        <h2 className="title-md" style={{ color: 'var(--yellow)' }}>📚 題目庫</h2>
      </div>

      {/* Stats */}
      <div className="card row" style={{ gap: 20, justifyContent: 'space-around', padding: '14px 20px' }}>
        <div className="col" style={{ alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: 'var(--yellow)' }}>
            {allBanks.reduce((s, b) => s + b.words.length, 0)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>總題目</span>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div className="col" style={{ alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: 'var(--blue)' }}>
            {customWordBanks.length}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>自定義庫</span>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div className="col" style={{ alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: 'var(--purple)' }}>
            {totalCustomWords}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>自定義題</span>
        </div>
      </div>

      {/* Export / Import */}
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.9rem' }} onClick={handleExport}>
          📤 匯出 Export
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.9rem' }}
          onClick={() => fileInputRef.current?.click()}>
          📥 匯入 Import
        </button>
      </div>

      {/* Import/export status */}
      {importStatus && (
        <div className="dashed-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>{importStatus}</p>
        </div>
      )}

      {/* Create new bank */}
      {showNewBank ? (
        <div className="dashed-card col" style={{ gap: 12 }}>
          <p style={{ fontWeight: 800, color: 'var(--yellow)' }}>新增題目庫 New Bank</p>
          <input className="input" placeholder="中文名稱 Chinese Name *" value={newBankNameZh}
            onChange={(e) => setNewBankNameZh(e.target.value)} maxLength={20} />
          <input className="input" placeholder="English Name (optional)" value={newBankNameEn}
            onChange={(e) => setNewBankNameEn(e.target.value)} maxLength={20} />
          <div className="row">
            <button className="btn btn-primary" onClick={handleCreateBank}>✓ 新增 Create</button>
            <button className="btn btn-ghost" onClick={() => setShowNewBank(false)}>取消 Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-block" onClick={() => setShowNewBank(true)}>
          ➕ 新增自定義題目庫 Add Custom Bank
        </button>
      )}

      {/* Banks list */}
      <div className="scroll-list">
        {allBanks.map((bank) => (
          <div key={bank.id} className="card col" style={{ gap: 12 }}>
            <div className="row-between">
              <div className="row" style={{ gap: 10 }}>
                <span style={{ fontSize: '1.3rem' }}>{bank.isCustom ? '⭐' : '📖'}</span>
                <div className="col" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{bank.name.zh} / {bank.name.en}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {bank.words.length} 題 · {bank.isCustom ? '自定義 Custom' : '內建 Built-in'}
                  </span>
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                {bank.isCustom && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--coral)' }}
                    onClick={() => setDialog({ type: 'delete-bank', bankId: bank.id, bankName: bank.name.zh })}
                  >
                    🗑
                  </button>
                )}
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setExpandedBank(expandedBank === bank.id ? null : bank.id)}>
                  {expandedBank === bank.id ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {expandedBank === bank.id && (
              <div className="col" style={{ gap: 8, paddingTop: 4 }}>
                {bank.words.length === 0 && (
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center', padding: '8px 0' }}>
                    未有題目 No words yet
                  </p>
                )}
                {bank.words.map((w) => (
                  <div key={w.id} className="row-between" style={{
                    padding: '8px 12px', background: 'var(--surface2)', borderRadius: 10,
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{w.zh} / {w.en}</span>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{w.difficulty}</span>
                      {bank.isCustom && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--coral)', padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => deleteWordFromBank(bank.id, w.id)}
                        >✕</button>
                      )}
                    </div>
                  </div>
                ))}

                {bank.isCustom && (
                  addingWordTo === bank.id ? (
                    <div className="col" style={{ gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <input className="input" placeholder="中文題目 *" value={newWordZh}
                        onChange={(e) => setNewWordZh(e.target.value)} maxLength={20} />
                      <input className="input" placeholder="English word (optional)" value={newWordEn}
                        onChange={(e) => setNewWordEn(e.target.value)} maxLength={30} />
                      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                          <button key={d} className={`chip ${newWordDiff === d ? 'active' : ''}`}
                            onClick={() => setNewWordDiff(d)}>
                            {d === 'easy' ? '😊' : d === 'medium' ? '🤔' : '😅'} {d}
                          </button>
                        ))}
                      </div>
                      <div className="row">
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddWord(bank.id)}>✓ 加入 Add</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setAddingWordTo(null); setNewWordZh(''); setNewWordEn(''); }}>取消</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setAddingWordTo(bank.id)}>
                      ➕ 加題目 Add Word
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
