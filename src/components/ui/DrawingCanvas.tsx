import { useCanvas } from '../../utils/useCanvas';
import DrawingToolbar from './DrawingToolbar';
import type { DrawEvent } from '../../types';

interface DrawingCanvasProps {
  onDrawEvent?: (event: DrawEvent) => void;
  height?: string;
}

export default function DrawingCanvas({ onDrawEvent, height = '340px' }: DrawingCanvasProps) {
  const {
    canvasRef, currentTool, currentSize, canUndo,
    setTool, setSize, undo, clear,
  } = useCanvas({ onDrawEvent });

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
      {/* Canvas area */}
      <div style={{ position: 'relative', width: '100%', height, flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: currentTool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Toolbar below canvas */}
      <DrawingToolbar
        tool={currentTool}
        size={currentSize}
        canUndo={canUndo}
        onToolChange={setTool}
        onSizeChange={setSize}
        onUndo={undo}
        onClear={clear}
      />
    </div>
  );
}
