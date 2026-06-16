import { useEffect, useRef } from 'react';
import { useCanvas } from '../../utils/useCanvas';
import type { DrawEvent } from '../../types';

interface ViewerCanvasProps {
  /** Stream of incoming remote draw events to replay */
  events?: DrawEvent[];
  height?: string;
  label?: string;
}

export default function ViewerCanvas({ events, height = '340px', label }: ViewerCanvasProps) {
  const { canvasRef, applyRemoteEvent } = useCanvas();
  const lastAppliedRef = useRef(0);

  // Replay any new events in order
  useEffect(() => {
    if (!events) return;
    const newEvents = events.slice(lastAppliedRef.current);
    for (const ev of newEvents) {
      applyRemoteEvent(ev);
    }
    lastAppliedRef.current = events.length;
  }, [events, applyRemoteEvent]);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 16,
      overflow: 'hidden',
      border: '3px solid #1a1a2e',
      background: '#fff',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      flexShrink: 0,
    }}>
      <div style={{ position: 'relative', width: '100%', height, flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'default',
            touchAction: 'none',
          }}
        />
        {/* Overlay label when no events yet */}
        {(!events || events.length === 0) && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8, pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '2.5rem' }}>✏️</span>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800, fontSize: '1rem',
              color: '#aaa',
            }}>
              {label ?? '等待畫者開始… Waiting for drawer…'}
            </p>
          </div>
        )}
      </div>

      {/* Read-only footer */}
      <div style={{
        padding: '8px 12px',
        background: '#f0f0f0',
        borderTop: '2px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888', fontFamily: 'Nunito, sans-serif' }}>
          👁️ 觀看模式 Viewer
        </span>
      </div>
    </div>
  );
}
