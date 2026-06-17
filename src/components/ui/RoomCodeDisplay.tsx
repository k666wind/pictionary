import React from 'react';

interface RoomCodeDisplayProps {
  code: string;
}

export default function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>房間碼 Room Code</p>
      <div
        style={{
          display: 'inline-flex',
          gap: 8,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: '12px 24px',
        }}
      >
        {code.split('').map((ch, i) => (
          <span
            key={i}
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 4,
              color: 'var(--color-primary, #7c3aed)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {ch}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: '1.5px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '6px 16px',
            color: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ 已複製' : '📋 複製'}
        </button>
      </div>
    </div>
  );
}
