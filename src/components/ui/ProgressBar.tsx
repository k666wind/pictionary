interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

export default function ProgressBar({ current, total, color = 'var(--yellow)' }: ProgressBarProps) {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'var(--surface2)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}
