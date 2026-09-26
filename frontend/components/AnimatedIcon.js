/**
 * AnimatedIcon — CSS-3D "living" icon tile.
 *
 * Motion is always on (no hover required):
 *   - the whole tile floats and sways in 3D (staggered per tile via `delay`)
 *   - a dashed orbit ring tilts back in 3D and a glowing satellite circles the
 *     tile, passing IN FRONT of the disc at the bottom and BEHIND it at the top
 *   - the glyph floats above the disc on its own Z layer for parallax
 * On hover the tile pops toward the viewer and the glyph does a 3D tumble
 * while a light sweep runs across the disc.
 *
 * All motion is pure CSS (transform/opacity only), so it stays cheap even with
 * a dozen tiles on the page and respects prefers-reduced-motion (globals.css).
 */

const TONES = {
  blue: {
    tintTop: 'rgba(59, 130, 246, 0.18)',
    tintBottom: 'rgba(147, 197, 253, 0.08)',
    color: '#2563eb',
    shadow: 'rgba(37, 99, 235, 0.35)',
    glow: 'rgba(59, 130, 246, 0.55)',
  },
  emerald: {
    tintTop: 'rgba(16, 185, 129, 0.18)',
    tintBottom: 'rgba(110, 231, 183, 0.08)',
    color: '#059669',
    shadow: 'rgba(5, 150, 105, 0.35)',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
  purple: {
    tintTop: 'rgba(147, 51, 234, 0.16)',
    tintBottom: 'rgba(216, 180, 254, 0.08)',
    color: '#9333ea',
    shadow: 'rgba(147, 51, 234, 0.32)',
    glow: 'rgba(147, 51, 234, 0.5)',
  },
  amber: {
    tintTop: 'rgba(245, 158, 11, 0.18)',
    tintBottom: 'rgba(253, 230, 138, 0.08)',
    color: '#d97706',
    shadow: 'rgba(217, 119, 6, 0.32)',
    glow: 'rgba(245, 158, 11, 0.5)',
  },
};

const SIZES = {
  sm: { box: 'h-9 w-9', glyph: 16, sat: 5, z: 10 },
  md: { box: 'h-11 w-11', glyph: 20, sat: 6, z: 13 },
  lg: { box: 'h-14 w-14', glyph: 26, sat: 8, z: 16 },
};

export default function AnimatedIcon({ icon: Icon, tone = 'blue', size = 'md', delay = '0s' }) {
  const t = TONES[tone] || TONES.blue;
  const s = SIZES[size] || SIZES.md;

  return (
    <span
      className={`lumi-icon ${s.box}`}
      style={{
        '--lumi-tint-top': t.tintTop,
        '--lumi-tint-bottom': t.tintBottom,
        '--lumi-color': t.color,
        '--lumi-shadow': t.shadow,
        '--lumi-glow': t.glow,
        '--lumi-sat': `${s.sat}px`,
        '--lumi-glyph-z': `${s.z}px`,
      }}
      aria-hidden="true"
    >
      <span className="lumi-icon__scene" style={{ animationDelay: delay }}>
        <span className="lumi-icon__orbit">
          <span className="lumi-icon__orbit-spin" style={{ animationDelay: delay }}>
            <span className="lumi-icon__sat" />
          </span>
        </span>
        <span className="lumi-icon__disc">
          <span className="lumi-icon__glyph">
            <Icon size={s.glyph} strokeWidth={2.2} />
          </span>
          <span className="lumi-icon__gloss" />
        </span>
      </span>
    </span>
  );
}
