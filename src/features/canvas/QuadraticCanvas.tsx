/**
 * BIKAN Dynamic Mathematical Canvas
 * ──────────────────────────────────
 * PRD US-ALG-002:
 * - Rendering grafik koordinat Kartesius 60fps
 * - Gestur cubit (pinch) memperbesar skala koordinat secara linear
 *   tanpa merusak resolusi garis vektor kurva
 * - Pan/geser untuk transformasi viewport
 * - Double-tap/double-click reset ke posisi awal
 *
 * Supports: Touch (mobile), Mouse (desktop), Dark Mode
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LatexFormula } from './LatexFormula';

interface GraphProps {
  a: number;
  b: number;
  c: number;
  width?: number;
  height?: number;
  isDark?: boolean;
}

interface ViewState {
  offsetX: number;  // Pan offset in pixels
  offsetY: number;
  scale: number;    // Zoom level (pixels per unit)
}

const DEFAULT_SCALE = 40;
const MIN_SCALE = 10;
const MAX_SCALE = 120;

export const QuadraticCanvas: React.FC<GraphProps> = ({ a, b, c, width = 600, height = 400, isDark = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<ViewState>({ offsetX: 0, offsetY: 0, scale: DEFAULT_SCALE });

  // ─── Gesture state refs (avoid re-renders during drag) ───
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(DEFAULT_SCALE);
  const lastTapTime = useRef(0);

  // ─── Drawing Function ───
  const draw = useCallback((ctx: CanvasRenderingContext2D, viewState: ViewState) => {
    const { offsetX, offsetY, scale } = viewState;
    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;

    // Clear
    ctx.fillStyle = isDark ? '#1E293B' : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 1. Grid
    ctx.strokeStyle = isDark ? '#334155' : '#E2E8F0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Dynamic grid: calculate visible range
    const startGridX = Math.floor(-centerX / scale) * scale + (centerX % scale);
    const startGridY = Math.floor(-centerY / scale) * scale + (centerY % scale);

    for (let x = startGridX; x < width; x += scale) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startGridY; y < height; y += scale) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 2. Axes
    ctx.strokeStyle = isDark ? '#94A3B8' : '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Y-Axis (vertical line at x=0)
    if (centerX >= 0 && centerX <= width) {
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
    }
    // X-Axis (horizontal line at y=0)
    if (centerY >= 0 && centerY <= height) {
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
    }
    ctx.stroke();

    // 3. Parabola
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const step = 0.05; // Finer step for smooth curves at all zoom levels
    let first = true;
    const xRange = width / scale + 2; // Extra range to cover edges

    for (let x = -xRange; x <= xRange; x += step) {
      const y = a * x * x + b * x + c;
      const px_x = centerX + x * scale;
      const px_y = centerY - y * scale;

      // Clip to canvas bounds (with margin)
      if (px_x < -50 || px_x > width + 50) continue;

      if (first) {
        ctx.moveTo(px_x, px_y);
        first = false;
      } else {
        ctx.lineTo(px_x, px_y);
      }
    }
    ctx.stroke();

    // 4. Vertex
    if (a !== 0) {
      const vertexX = -b / (2 * a);
      const vertexY = c - (b * b) / (4 * a);
      const vx = centerX + vertexX * scale;
      const vy = centerY - vertexY * scale;

      if (vx >= -10 && vx <= width + 10 && vy >= -10 && vy <= height + 10) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(vx, vy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Axis labels
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    // X-axis labels
    const xStart = Math.ceil(-centerX / scale);
    const xEnd = Math.floor((width - centerX) / scale);
    for (let i = xStart; i <= xEnd; i++) {
      if (i === 0) continue;
      const px = centerX + i * scale;
      if (px < 20 || px > width - 20) continue;
      const labelY = Math.min(Math.max(centerY + 14, 14), height - 4);
      ctx.fillText(String(i), px, labelY);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    const yStart = Math.ceil(-(height - centerY) / scale);
    const yEnd = Math.floor(centerY / scale);
    for (let i = yStart; i <= yEnd; i++) {
      if (i === 0) continue;
      const py = centerY - i * scale;
      if (py < 10 || py > height - 10) continue;
      const labelX = Math.min(Math.max(centerX - 6, 20), width - 4);
      ctx.fillText(String(i), labelX, py + 3);
    }

    // 6. Zoom indicator
    ctx.fillStyle = isDark ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.4)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`zoom: ${(scale / DEFAULT_SCALE).toFixed(1)}x`, 8, height - 8);
  }, [a, b, c, width, height, isDark]);

  // ─── Render on state change ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use requestAnimationFrame for smooth 60fps rendering
    const frameId = requestAnimationFrame(() => draw(ctx, view));
    return () => cancelAnimationFrame(frameId);
  }, [a, b, c, isDark, view, draw]);

  // ─── Mouse Wheel Zoom (Desktop) ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

      setView(prev => ({
        ...prev,
        scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * zoomFactor)),
      }));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // ─── Mouse Drag Pan (Desktop) ───
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    setView(prev => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // ─── Touch Gestures (Mobile) ───
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger: pan
      isDragging.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      // Double-tap detection
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double-tap: reset view
        setView({ offsetX: 0, offsetY: 0, scale: DEFAULT_SCALE });
        isDragging.current = false;
      }
      lastTapTime.current = now;
    } else if (e.touches.length === 2) {
      // Two fingers: pinch-to-zoom
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartScale.current = view.scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent page scroll while interacting with canvas

    if (e.touches.length === 1 && isDragging.current) {
      // Pan
      const dx = e.touches[0].clientX - lastPointer.current.x;
      const dy = e.touches[0].clientY - lastPointer.current.y;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      setView(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist.current;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale.current * ratio));

      setView(prev => ({ ...prev, scale: newScale }));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // ─── Double-click reset (Desktop) ───
  const handleDoubleClick = () => {
    setView({ offsetX: 0, offsetY: 0, scale: DEFAULT_SCALE });
  };

  return (
    <div className="soft-ui-card p-4 inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl cursor-grab active:cursor-grabbing touch-none"
        id="quadratic-webgl-canvas"
        // Desktop events
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        // Touch events
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {/* Gesture hint */}
      <div className="mt-2 flex justify-between items-center text-[9px] font-mono text-muted-blue/30">
        <span>scroll/pinch: zoom • drag: pan • 2×tap: reset</span>
        <span>{(view.scale / DEFAULT_SCALE).toFixed(1)}x</span>
      </div>
      <LatexFormula a={a} b={b} c={c} />
    </div>
  );
};
