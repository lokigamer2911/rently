import { useRef, useCallback } from 'react';
import { isReducedMotion, isFinePointer } from '../../lib/cinematic';

/** Magnetic hover — desktop pointers only, same visual UI. */
export default function Magnetic({ children, strength = 0.3, className = '', ...rest }) {
  const ref = useRef(null);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el || isReducedMotion() || !isFinePointer()) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }, [strength]);

  const reset = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0px,0px)';
  }, []);

  return (
    <div
      ref={ref}
      className={`magnetic-wrap ${className}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ transition: 'transform 0.25s cubic-bezier(0.19,1,0.22,1)', display: 'inline-flex' }}
      {...rest}
    >
      {children}
    </div>
  );
}
