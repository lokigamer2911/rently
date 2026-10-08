import { useEffect, useRef } from 'react';
import { isReducedMotion } from '../../lib/cinematic';

/**
 * Lightweight 2D CGI gradient shader (no WebGL cost).
 * Same emerald/blue palette, animated blobs + grain drift.
 */
export default function ShaderBackground({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || isReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let w = 0, h = 0;
    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = Math.min(900, r.width);
      h = canvas.height = Math.min(600, r.height);
    };
    resize();
    window.addEventListener('resize', resize);
    const blobs = [
      { x: 0.25, y: 0.35, r: 0.45, c: '16,185,129', sp: 0.00022, ph: 0 },
      { x: 0.75, y: 0.6, r: 0.5, c: '59,130,246', sp: 0.00018, ph: 2 },
      { x: 0.5, y: 0.25, r: 0.35, c: '34,211,238', sp: 0.00026, ph: 4 },
    ];
    const loop = (t) => {
      ctx.clearRect(0, 0, w, h);
      blobs.forEach((b) => {
        const x = (b.x + Math.sin(t * b.sp + b.ph) * 0.12) * w;
        const y = (b.y + Math.cos(t * b.sp * 1.3 + b.ph) * 0.12) * h;
        const rad = b.r * Math.min(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${b.c},0.20)`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`shader-bg ${className}`} aria-hidden="true">
      <canvas ref={ref} />
      <div className="shader-grain" />
    </div>
  );
}
