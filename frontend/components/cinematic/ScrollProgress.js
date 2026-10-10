import { useEffect, useRef } from 'react';

/**
 * Thin top scroll-progress bar (global, non-intrusive).
 * Also broadcasts scroll direction on <body data-scroll-dir="up|down">
 * so CSS-only flourishes (marquee direction, orb drift) respond to scroll-up.
 */
export default function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let lastY = window.scrollY;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, y / h) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
      if (y !== lastY) {
        document.body.dataset.scrollDir = y > lastY ? 'down' : 'up';
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      try { delete document.body.dataset.scrollDir; } catch {}
    };
  }, []);
  return <div ref={ref} className="scroll-progress" aria-hidden="true" />;
}
