interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = '確定 Confirm',
  cancelLabel = '取消 Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      backdropFilter: 'blur(4px)',
    }}
      onClick={onCancel}
    >
      <div
        className="card pop"
        style={{ width: '100%', maxWidth: 320, gap: 16, display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="title-md" style={{ color: danger ? 'var(--coral)' : 'var(--yellow)' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-dim)', fontWeight: 600, lineHeight: 1.6, fontSize: '0.95rem' }}>
          {message}
        </p>
        <div className="col" style={{ gap: 10, marginTop: 4 }}>
          <button
            className={`btn btn-block ${danger ? 'btn-coral' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button className="btn btn-ghost btn-block" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
