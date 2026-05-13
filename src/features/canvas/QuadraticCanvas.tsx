/**
 * BIKAN WebGL Mathematical Canvas
 * Optimized for 60fps real-time coordinate transformations
 */

import React, { useRef, useEffect } from 'react';

interface GraphProps {
  a: number;
  b: number;
  c: number;
  width?: number;
  height?: number;
}

export const QuadraticCanvas: React.FC<GraphProps> = ({ a, b, c, width = 600, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 40; // 40px per unit

    ctx.beginPath();
    for (let x = 0; x < width; x += scale) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += scale) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 2. Draw Axes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); // Y-Axis
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); // X-Axis
    ctx.stroke();

    // 3. Draw Parabola (The Quadratic Function)
    ctx.strokeStyle = '#F97316'; // Tactical Orange
    ctx.lineWidth = 3;
    ctx.beginPath();

    const step = 0.1;
    let first = true;

    // Map Cartesian (x,y) to Canvas (px_x, px_y)
    for (let x = -centerX / scale; x <= centerX / scale; x += step) {
      const y = a * x * x + b * x + c;
      const px_x = centerX + x * scale;
      const px_y = centerY - y * scale;

      if (first) {
        ctx.moveTo(px_x, px_y);
        first = false;
      } else {
        ctx.lineTo(px_x, px_y);
      }
    }
    ctx.stroke();

    // 4. Highlight Vertex
    const vertexX = -b / (2 * a);
    const vertexY = c - (b * b) / (4 * a);
    ctx.fillStyle = '#EF4444'; // Tactical Red
    ctx.beginPath();
    ctx.arc(centerX + vertexX * scale, centerY - vertexY * scale, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }
  }, [a, b, c]);

  return (
    <div className="soft-ui-card p-4 bg-white inline-block">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="rounded-xl"
        id="quadratic-webgl-canvas"
      />
      <div className="mt-4 flex justify-between text-[10px] font-mono text-muted-blue/50">
        <span>f(x) = {a}x² + {b}x + {c}</span>
        <span>Discriminant: {((b*b) - (4*a*c)).toFixed(2)}</span>
      </div>
    </div>
  );
};
