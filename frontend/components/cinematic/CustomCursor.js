import { useEffect, useRef } from 'react';
import { isReducedMotion, isFinePointer } from '../../lib/cinematic';

/** Custom cursor ring — desktop only, hidden on touch / reduced-motion. */
export default function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (isReducedMotion() || !isFinePointer()) return;
    document.body.classList.add('has-custom-cursor');
    const d = dot.current, r = ring.current;
    if (!d || !r) return;
    let x = -100, y = -100, rx = -100, ry = -100;
    let raf = 0;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target.closest?.('a,button,[data-cursor]');
      const label = e.target.closest?.('[data-cursor-label]')?.dataset?.cursorLabel;
      document.body.classList.toggle('cursor-hover', !!t);
      if (label && r) r.dataset.label = label;
      else if (r) delete r.dataset.label;
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      d.style.transform = `translate(${x}px,${y}px)`;
      r.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-custom-cursor', 'cursor-hover');
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true"><span /></div>
    </>
  );
}
