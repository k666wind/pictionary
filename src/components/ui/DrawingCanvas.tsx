import { useCanvas } from '../../utils/useCanvas';
import DrawingToolbar from './DrawingToolbar';
import type { DrawEvent } from '../../types';

interface DrawingCanvasProps {
  onDrawEvent?: (event: DrawEvent) => void;
  /** CSS height for the canvas area. Use '100%' to fill flex parent. */
  height?: string;
}

export default function DrawingCanvas({ onDrawEvent, height = '320px' }: DrawingCanvasProps) {
  const {
    canvasRef, currentTool, currentSize, canUndo,
    setTool, setSize, undo, clear,
  } = useCanvas({ onDrawEvent });

  const fillParent = height === '100%';

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
      // If filling parent flex container, stretch to fill
      flex: fillParent ? 1 : undefined,
      minHeight: fillParent ? 0 : undefined,
    }}>
      {/* Canvas area */}
      <div style={{
        position: 'relative',
        width: '100%',
        // When height='100%', let this div fill available flex space
        flex: fillParent ? 1 : undefined,
        height: fillParent ? undefined : height,
        minHeight: fillParent ? 0 : undefined,
      }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: currentTool === 'eraser' ? 'cell' : 'crosshair',
            // Critical: tells browser not to handle touch scrolling on this element
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      </div>

      {/* Toolbar — always fixed height at bottom */}
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
