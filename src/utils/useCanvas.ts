import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawEvent, DrawPoint, DrawTool, Stroke } from '../types';
import { generateId } from './game';

export interface UseCanvasOptions {
  /** Called for every draw event — wire to network in online mode */
  onDrawEvent?: (event: DrawEvent) => void;
}

export interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  strokes: Stroke[];
  currentTool: DrawTool;
  currentSize: number;
  canUndo: boolean;
  setTool: (t: DrawTool) => void;
  setSize: (s: number) => void;
  undo: () => void;
  clear: () => void;
  /** Replay an incoming remote draw event onto the canvas */
  applyRemoteEvent: (event: DrawEvent) => void;
}

const BG = '#ffffff';

/** Normalise pointer position to 0-1 relative to canvas */
function normalise(canvas: HTMLCanvasElement, clientX: number, clientY: number): DrawPoint {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left) / r.width,
    y: (clientY - r.top) / r.height,
  };
}

/** Denormalise 0-1 point to canvas pixel coords */
function denorm(canvas: HTMLCanvasElement, p: DrawPoint): { x: number; y: number } {
  return { x: p.x * canvas.width, y: p.y * canvas.height };
}

function getStrokeStyle(tool: DrawTool): string {
  return tool === 'eraser' ? BG : '#1a1a2e';
}

function drawStrokeOnCtx(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stroke: Stroke
) {
  if (stroke.points.length < 2) {
    // Single dot
    const p = stroke.points[0];
    if (!p) return;
    const { x, y } = denorm(canvas, p);
    ctx.beginPath();
    ctx.fillStyle = getStrokeStyle(stroke.tool);
    ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.strokeStyle = getStrokeStyle(stroke.tool);
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const first = denorm(canvas, stroke.points[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < stroke.points.length; i++) {
    const pt = denorm(canvas, stroke.points[i]);
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}

function redrawAll(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  strokes: Stroke[]
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) {
    drawStrokeOnCtx(ctx, canvas, s);
  }
}

export function useCanvas({ onDrawEvent }: UseCanvasOptions = {}): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentTool, setCurrentTool] = useState<DrawTool>('pen');
  const [currentSize, setCurrentSize] = useState<number>(4);

  // Refs for live drawing (avoid stale closure)
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const toolRef = useRef<DrawTool>('pen');
  const sizeRef = useRef<number>(4);
  const batchRef = useRef<DrawPoint[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync
  useEffect(() => { toolRef.current = currentTool; }, [currentTool]);
  useEffect(() => { sizeRef.current = currentSize; }, [currentSize]);

  // Initial fill
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Resize handler — redraw on resize to avoid distortion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleResize() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Save current drawings as image before resize
      const img = new Image();
      img.src = canvas.toDataURL();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
      };
    }

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    // Set initial size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => ro.disconnect();
  }, []);

  // Batch flush — send accumulated points every 40ms
  function startBatch() {
    if (batchTimerRef.current) return;
    batchTimerRef.current = setInterval(() => {
      if (batchRef.current.length > 0) {
        onDrawEvent?.({ type: 'DRAW_MOVE', points: [...batchRef.current] });
        batchRef.current = [];
      }
    }, 40);
  }

  function stopBatch() {
    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    if (batchRef.current.length > 0) {
      onDrawEvent?.({ type: 'DRAW_MOVE', points: [...batchRef.current] });
      batchRef.current = [];
    }
  }

  const startDraw = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const pt = normalise(canvas, clientX, clientY);
    const stroke: Stroke = {
      id: generateId(),
      tool: toolRef.current,
      size: sizeRef.current,
      points: [pt],
    };
    activeStrokeRef.current = stroke;

    onDrawEvent?.({
      type: 'DRAW_START',
      stroke: { id: stroke.id, tool: stroke.tool, size: stroke.size },
      x: pt.x,
      y: pt.y,
    });

    startBatch();

    // Draw dot immediately
    drawStrokeOnCtx(ctx, canvas, stroke);
  }, [onDrawEvent]);

  const moveDraw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = normalise(canvas, clientX, clientY);
    activeStrokeRef.current.points.push(pt);
    batchRef.current.push(pt);

    // Draw incrementally
    const pts = activeStrokeRef.current.points;
    const prev = pts[pts.length - 2];
    const curr = pts[pts.length - 1];
    if (!prev || !curr) return;

    ctx.beginPath();
    ctx.strokeStyle = getStrokeStyle(activeStrokeRef.current.tool);
    ctx.lineWidth = activeStrokeRef.current.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p1 = denorm(canvas, prev);
    const p2 = denorm(canvas, curr);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }, []);

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    isDrawingRef.current = false;

    stopBatch();
    onDrawEvent?.({ type: 'DRAW_END' });

    const finished = { ...activeStrokeRef.current };
    strokesRef.current = [...strokesRef.current, finished];
    setStrokes([...strokesRef.current]);
    activeStrokeRef.current = null;
  }, [onDrawEvent]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onMouseDown(e: MouseEvent) {
      e.preventDefault();
      startDraw(e.clientX, e.clientY);
    }
    function onMouseMove(e: MouseEvent) {
      if (!isDrawingRef.current) return;
      moveDraw(e.clientX, e.clientY);
    }
    function onMouseUp() { endDraw(); }
    function onMouseLeave() { if (isDrawingRef.current) endDraw(); }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [startDraw, moveDraw, endDraw]);

  // Touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      if (t) startDraw(t.clientX, t.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      if (t) moveDraw(t.clientX, t.clientY);
    }
    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      endDraw();
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [startDraw, moveDraw, endDraw]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    setStrokes([...next]);
    redrawAll(ctx, canvas, next);
    onDrawEvent?.({ type: 'DRAW_UNDO' });
  }, [onDrawEvent]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    strokesRef.current = [];
    setStrokes([]);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onDrawEvent?.({ type: 'DRAW_CLEAR' });
  }, [onDrawEvent]);

  // Remote event replay
  const applyRemoteEvent = useCallback((event: DrawEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    switch (event.type) {
      case 'DRAW_START': {
        const stroke: Stroke = {
          id: event.stroke.id,
          tool: event.stroke.tool,
          size: event.stroke.size,
          points: [{ x: event.x, y: event.y }],
        };
        activeStrokeRef.current = stroke;
        // Draw first dot
        drawStrokeOnCtx(ctx, canvas, stroke);
        break;
      }
      case 'DRAW_MOVE': {
        if (!activeStrokeRef.current) return;
        const pts2 = activeStrokeRef.current.points; const prev = pts2[pts2.length - 1];
        for (const pt of event.points) {
          activeStrokeRef.current.points.push(pt);
        }
        // Draw segment from prev to new points
        if (!prev || event.points.length === 0) return;
        ctx.beginPath();
        ctx.strokeStyle = getStrokeStyle(activeStrokeRef.current.tool);
        ctx.lineWidth = activeStrokeRef.current.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const p0 = denorm(canvas, prev);
        ctx.moveTo(p0.x, p0.y);
        for (const pt of event.points) {
          const p = denorm(canvas, pt);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        break;
      }
      case 'DRAW_END': {
        if (!activeStrokeRef.current) return;
        const finished = { ...activeStrokeRef.current };
        strokesRef.current = [...strokesRef.current, finished];
        setStrokes([...strokesRef.current]);
        activeStrokeRef.current = null;
        break;
      }
      case 'DRAW_UNDO': {
        const next = strokesRef.current.slice(0, -1);
        strokesRef.current = next;
        setStrokes([...next]);
        redrawAll(ctx, canvas, next);
        break;
      }
      case 'DRAW_CLEAR': {
        strokesRef.current = [];
        setStrokes([]);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      }
    }
  }, []);

  return {
    canvasRef,
    strokes,
    currentTool,
    currentSize,
    canUndo: strokes.length > 0,
    setTool: setCurrentTool,
    setSize: setCurrentSize,
    undo,
    clear,
    applyRemoteEvent,
  };
}
