import type { DrawTool } from '../../types';

interface DrawingToolbarProps {
  tool: DrawTool;
  size: number;
  canUndo: boolean;
  onToolChange: (t: DrawTool) => void;
  onSizeChange: (s: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

const SIZES = [
  { label: '細', value: 3 },
  { label: '中', value: 7 },
  { label: '粗', value: 16 },
];

export default function DrawingToolbar({
  tool, size, canUndo,
  onToolChange, onSizeChange, onUndo, onClear,
}: DrawingToolbarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '10px 12px',
      background: '#f0f0f0',
      borderTop: '2px solid #e0e0e0',
      flexWrap: 'wrap',
      justifyContent: 'center',
      flexShrink: 0,
    }}>

      {/* Pen / Eraser */}
      <div style={{ display: 'flex', gap: 4 }}>
        <ToolBtn
          active={tool === 'pen'}
          onClick={() => onToolChange('pen')}
          title="畫筆 Pen"
        >
          🖊️
        </ToolBtn>
        <ToolBtn
          active={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
          title="橡皮擦 Eraser"
        >
          🧹
        </ToolBtn>
      </div>

      <Divider />

      {/* Sizes */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {SIZES.map((s) => (
          <button
            key={s.value}
            title={s.label}
            onClick={() => onSizeChange(s.value)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `2px solid ${size === s.value ? '#1a1a2e' : '#ccc'}`,
              background: size === s.value ? '#1a1a2e' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: s.value,
              height: s.value,
              borderRadius: '50%',
              background: size === s.value ? '#fff' : '#1a1a2e',
              transition: 'all 0.12s',
            }} />
          </button>
        ))}
      </div>

      <Divider />

      {/* Undo */}
      <ToolBtn
        active={false}
        onClick={onUndo}
        disabled={!canUndo}
        title="撤銷 Undo"
      >
        ↩️
      </ToolBtn>

      {/* Clear */}
      <ToolBtn
        active={false}
        onClick={onClear}
        disabled={false}
        title="清除 Clear"
        danger
      >
        🗑️
      </ToolBtn>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: '#ddd', flexShrink: 0 }} />;
}

interface ToolBtnProps {
  active: boolean;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolBtn({ active, disabled, danger, title, onClick, children }: ToolBtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: `2px solid ${active ? '#1a1a2e' : danger ? '#ff6b6b44' : '#ccc'}`,
        background: active ? '#1a1a2e' : danger ? '#fff0f0' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.12s',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  );
}
