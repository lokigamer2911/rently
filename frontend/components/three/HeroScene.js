import { Suspense, useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, RoundedBox, Environment, ContactShadows, Torus, Icosahedron, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';

// Glassy accent ring.
function AccentRing({ position, color, rotation = [0, 0, 0], speed = 1.2 }) {
  return (
    <Float speed={speed} rotationIntensity={1.4} floatIntensity={0.8}>
      <Torus args={[0.85, 0.14, 16, 48]} position={position} rotation={rotation} castShadow>
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.1} 
          metalness={0.9} 
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </Torus>
    </Float>
  );
}

// Shiny metallic Gem.
function Gem({ position, color, scale = 1, speed = 1 }) {
  return (
    <Float speed={speed} rotationIntensity={1.8} floatIntensity={1.2}>
      <Icosahedron args={[0.55, 0]} position={position} scale={scale} castShadow>
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.15} 
          metalness={0.8} 
          flatShading
          clearcoat={0.5}
        />
      </Icosahedron>
    </Float>
  );
}

// Float HTML Card inside the canvas
function FloatingProductCard({ position, emoji, title, category, price, delay = 0 }) {
  const cardRef = useRef();
  
  useFrame(({ clock }) => {
    if (!cardRef.current) return;
    const t = clock.getElapsedTime() + delay;
    // Slow drifting matching the 3D feel
    cardRef.current.style.transform = `translateY(${Math.sin(t * 1.2) * 8}px) rotate(${Math.cos(t * 0.8) * 1.5}deg)`;
  });

  return (
    <Html
      position={position}
      center
      distanceFactor={6}
      style={{ pointerEvents: 'none', transition: 'all 0.5s ease' }}
    >
      <div 
        ref={cardRef}
        className="w-56 p-4 rounded-[1.4rem] bg-white/75 border border-white/60 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.12)] backdrop-blur-md flex items-center gap-3 whitespace-nowrap transition-transform duration-300"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-900/5 flex items-center justify-center text-xl shadow-inner">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{category}</p>
          <h4 className="text-xs font-bold text-slate-800 truncate tracking-tight">{title}</h4>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{price}</p>
        </div>
      </div>
    </Html>
  );
}

// Group that gently follows the pointer for a parallax/3D feel.
// PERF FIX: scrollY stored in a ref (not state) to avoid re-renders on every scroll event.
function ParallaxRig({ children, reduced }) {
  const group = useRef();
  const { pointer } = useThree();
  // Use a ref so scroll events don't trigger React re-renders
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reduced]);

  useFrame((state, delta) => {
    if (!group.current || reduced) return;
    
    // Mouse parallax target
    const targetY = pointer.x * 0.45;
    const targetX = -pointer.y * 0.3;
    
    // Scroll rotation/translation target (read from ref, not state)
    const scrollFactor = scrollYRef.current * 0.0006;
    
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY + scrollFactor * 0.5, 2.5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 2.5, delta);
    
    // Scroll translation
    const targetZ = -scrollFactor * 2;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, targetZ, 2.5, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -scrollFactor * 0.8, 2.5, delta);
  });

  return <group ref={group}>{children}</group>;
}

function Scene({ reduced }) {
  const primaryCubeRef = useRef();

  useFrame(({ clock }) => {
    if (primaryCubeRef.current && !reduced) {
      const t = clock.getElapsedTime();
      // Constant smooth rotation for the main glass prism
      primaryCubeRef.current.rotation.x = t * 0.12;
      primaryCubeRef.current.rotation.y = t * 0.15;
    }
  });

  return (
    <ParallaxRig reduced={reduced}>
      {/* Ambient environment sparkles — reduced count for perf, hidden in reduced mode */}
      {!reduced && (
        <Sparkles count={35} scale={6.5} size={2.5} speed={0.4} opacity={0.45} color="#60a5fa" />
      )}

      {/* Central hero shape: Premium refractive glass cube */}
      {/* PERF FIX: smoothness 8→4 halves vertex count, visually identical at this scale */}
      <Float speed={0.9} rotationIntensity={0.5} floatIntensity={1.2}>
        <RoundedBox 
          ref={primaryCubeRef}
          args={[1.6, 1.6, 1.6]} 
          radius={0.25} 
          smoothness={4} 
          castShadow
        >
          <meshPhysicalMaterial 
            color="#2563eb"
            roughness={0.05}
            metalness={0.1}
            transmission={0.65}
            thickness={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            ior={1.5}
          />
        </RoundedBox>
      </Float>

      {/* Orbits and decorative 3D objects */}
      <AccentRing position={[1.8, 1.1, -0.6]} color="#10b981" rotation={[0.4, 0.2, 0.5]} speed={1.1} />
      <AccentRing position={[-2.0, -1.3, -0.8]} color="#3b82f6" rotation={[-0.3, 0.4, -0.2]} speed={1.4} />
      
      <Gem position={[-2.2, 0.5, 0.6]} color="#fbbf24" scale={0.9} speed={1.2} />
      <Gem position={[2.1, -0.9, 0.4]} color="#f43f5e" scale={0.8} speed={0.9} />

      {/* Floating listings in 3D Space */}
      {!reduced && (
        <>
          <FloatingProductCard 
            position={[-2.6, 1.6, 0]} 
            emoji="📷" 
            title="Sony FX3 Cinema Rig" 
            category="Camera Gear"
            price="₹3,500/day" 
            delay={0}
          />
          <FloatingProductCard 
            position={[2.6, 0.5, -0.2]} 
            emoji="🚁" 
            title="DJI Mavic 3 Pro" 
            category="Drone"
            price="₹2,200/day" 
            delay={2}
          />
          <FloatingProductCard 
            position={[-2.2, -1.6, 0.2]} 
            emoji="🥽" 
            title="Apple Vision Pro" 
            category="Spatial Headset"
            price="₹5,000/day" 
            delay={4}
          />
        </>
      )}

      {/* Contact Shadows */}
      {!reduced && (
        <ContactShadows position={[0, -2.4, 0]} opacity={0.3} scale={10} blur={2.8} far={4.5} />
      )}
    </ParallaxRig>
  );
}

export default function HeroScene({ reduced = false }) {
  // PERF FIX: IntersectionObserver pauses rendering when scene is off-screen
  const containerRef = useRef();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // PERF FIX: Cap DPR to 1.5 max, 1.0 on mobile to prevent GPU overload
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const dpr = reduced || isMobile ? 1 : [1, 1.5];

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows={!reduced}
        dpr={dpr}
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        gl={{ antialias: !isMobile, alpha: true }}
        frameloop={isVisible ? 'always' : 'never'}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 8, 4]} intensity={1.2} castShadow shadow-mapSize={[512, 512]} />
        <directionalLight position={[-6, -4, -3]} intensity={0.5} color="#93c5fd" />
        <pointLight position={[0, 4, 2]} intensity={0.8} color="#60a5fa" />
        <Suspense fallback={null}>
          <Scene reduced={reduced} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
