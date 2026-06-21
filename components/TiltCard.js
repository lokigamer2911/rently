import { useRef, useCallback } from 'react';

/**
 * Pointer-driven 3D tilt wrapper.
 * Adds depth/parallax on hover using CSS transforms. Gracefully does nothing
 * on touch devices or when the user prefers reduced motion.
 *
 * Props:
 *  - max: maximum tilt in degrees (default 8)
 *  - glare: show a soft moving highlight (default true)
 *  - className / style: forwarded to the wrapper
 */
export default function TiltCard({
  children,
  max = 8,
  glare = true,
  className = '',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const frame = useRef(0);

  const allowTilt = () => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(hover: none)').matches) return false;
    return true;
  };

  const handleMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el || !allowTilt()) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 2 * max;
      const rotateX = -(py - 0.5) * 2 * max;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
        el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        el.style.setProperty('--glare-o', glare ? '1' : '0');
      });
    },
    [max, glare]
  );

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.style.setProperty('--glare-o', '0');
  }, []);

  return (
    <div className="tilt-3d-perspective">
      <div
        ref={ref}
        className={`tilt-3d ${className}`}
        style={style}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        {...rest}
      >
        <div className="tilt-3d-inner">{children}</div>
        {glare && <span className="tilt-3d-glare" aria-hidden="true" />}
      </div>
    </div>
  );
}
