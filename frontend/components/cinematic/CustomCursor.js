import { useEffect } from 'react';
import { isReducedMotion } from '../../lib/cinematic';

/** Normal cursor — no custom ring/dot. Reduced-motion friendly. */
export default function CustomCursor() {
  useEffect(() => {
    if (isReducedMotion()) return;
    // Ensure native cursor is always visible; remove any has-custom-cursor class
    document.body.classList.remove('has-custom-cursor');
  }, []);
  return null;
}
