import React, { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Torus, Cylinder, Box, Sphere, Ring, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────
   Mouse-tracking hook – reads pointer and converts
   to normalised [-1, 1] coords for the 3D scene.
   ───────────────────────────────────────────── */
function useMouseTracker(mouseRef) {
  return {
    // Convert normalised mouse [-1,1] to world-space offset
    getOffset: (strength = 1) => {
      const mx = mouseRef.current?.x ?? 0;
      const my = mouseRef.current?.y ?? 0;
      return {
        rotX: -my * 0.3 * strength,
        rotY: mx * 0.3 * strength,
        posX: mx * 0.15 * strength,
        posY: my * 0.15 * strength,
      };
    },
  };
}

/* ─────────────────────────────────────────────
   Step 1 – Browse & Search
   A 3D magnifying glass with orbiting search-result cards
   ───────────────────────────────────────────── */
function BrowseScene({ mouseRef }) {
  const groupRef = useRef();
  const cardsRef = useRef();
  const { getOffset } = useMouseTracker(mouseRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = getOffset(1);
    if (groupRef.current) {
      // Base rotation + mouse interactivity
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(t * 0.5) * 0.15 + m.rotY,
        0.08
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        m.rotX,
        0.08
      );
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.06 + m.posY * 0.3;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        m.posX * 0.4,
        0.06
      );
    }
    if (cardsRef.current) {
      cardsRef.current.rotation.y = t * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Magnifying glass lens */}
      <Torus args={[0.6, 0.08, 16, 48]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <meshPhysicalMaterial color="#3b82f6" roughness={0.1} metalness={0.8} clearcoat={1} />
      </Torus>

      {/* Glass fill */}
      <Cylinder args={[0.55, 0.55, 0.04, 32]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <meshPhysicalMaterial
          color="#93c5fd"
          roughness={0}
          metalness={0.1}
          transmission={0.85}
          thickness={0.5}
          transparent
          opacity={0.4}
        />
      </Cylinder>

      {/* Handle */}
      <Cylinder args={[0.07, 0.09, 0.8, 12]} position={[-0.55, -0.72, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <meshPhysicalMaterial color="#1e40af" roughness={0.3} metalness={0.6} />
      </Cylinder>

      {/* Orbiting search-result cards */}
      <group ref={cardsRef}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          const x = Math.cos(angle) * 1.3;
          const z = Math.sin(angle) * 1.3;
          const colors = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa'];
          return (
            <group key={i} position={[x, 0, z]}>
              <RoundedBox args={[0.4, 0.28, 0.04]} radius={0.04} smoothness={4} castShadow>
                <meshPhysicalMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
              </RoundedBox>
              <Box args={[0.4, 0.06, 0.05]} position={[0, 0.08, 0.01]}>
                <meshStandardMaterial color={colors[i]} />
              </Box>
              <Box args={[0.12, 0.12, 0.05]} position={[-0.1, -0.04, 0.01]}>
                <meshStandardMaterial color={colors[i]} roughness={0.5} />
              </Box>
            </group>
          );
        })}
      </group>

      {/* Pulsing search ring */}
      <Ring args={[0.9, 0.95, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} />
      </Ring>
    </group>
  );
}

/* ─────────────────────────────────────────────
   Step 2 – Book Instantly
   A booking confirmation card with a 3D checkmark seal
   ───────────────────────────────────────────── */
function BookScene({ mouseRef }) {
  const groupRef = useRef();
  const checkRef = useRef();
  const sparkleRef = useRef();
  const { getOffset } = useMouseTracker(mouseRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = getOffset(1);
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(t * 0.4) * 0.1 + m.rotY,
        0.08
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(t * 0.6) * 0.05 + m.rotX,
        0.08
      );
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        m.posX * 0.4,
        0.06
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        m.posY * 0.3,
        0.06
      );
    }
    if (checkRef.current) {
      checkRef.current.rotation.z = Math.sin(t * 2) * 0.08;
      checkRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
    }
    if (sparkleRef.current) {
      sparkleRef.current.rotation.y = t * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main booking card */}
      <RoundedBox args={[1.6, 1.1, 0.08]} radius={0.08} smoothness={4} castShadow>
        <meshPhysicalMaterial color="#ffffff" roughness={0.2} metalness={0.05} clearcoat={0.5} />
      </RoundedBox>

      {/* Header bar */}
      <Box args={[1.55, 0.22, 0.09]} position={[0, 0.4, 0.01]}>
        <meshStandardMaterial color="#10b981" />
      </Box>

      {/* Line items on card */}
      {[-0.05, -0.18, -0.31].map((y, i) => (
        <Box key={i} args={[1.1, 0.06, 0.09]} position={[-0.15, y, 0.01]}>
          <meshStandardMaterial color="#e2e8f0" />
        </Box>
      ))}

      {/* Price tag */}
      <RoundedBox args={[0.4, 0.15, 0.09]} radius={0.04} position={[0.5, -0.18, 0.02]}>
        <meshStandardMaterial color="#059669" />
      </RoundedBox>

      {/* Checkmark seal */}
      <group ref={checkRef} position={[0.55, 0.1, 0.12]}>
        <Cylinder args={[0.22, 0.22, 0.06, 24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#10b981" roughness={0.15} metalness={0.7} />
        </Cylinder>
        <Box args={[0.08, 0.18, 0.07]} position={[0.03, 0, 0.01]} rotation={[0, 0, -0.3]}>
          <meshStandardMaterial color="#ffffff" />
        </Box>
        <Box args={[0.08, 0.1, 0.07]} position={[-0.08, -0.05, 0.01]} rotation={[0, 0, 0.6]}>
          <meshStandardMaterial color="#ffffff" />
        </Box>
      </group>

      {/* Sparkle ring */}
      <group ref={sparkleRef}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <Sphere key={i} args={[0.04, 8, 8]} position={[Math.cos(a) * 1.2, Math.sin(a) * 0.8, 0.1]}>
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
            </Sphere>
          );
        })}
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────
   Step 3 – Connect & Pickup
   Chat bubbles + a package being handed over
   ───────────────────────────────────────────── */
function ConnectScene({ mouseRef }) {
  const groupRef = useRef();
  const bubble1Ref = useRef();
  const bubble2Ref = useRef();
  const packageRef = useRef();
  const { getOffset } = useMouseTracker(mouseRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = getOffset(1);
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(t * 0.3) * 0.12 + m.rotY,
        0.08
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        m.rotX,
        0.08
      );
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        m.posX * 0.4,
        0.06
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        m.posY * 0.2,
        0.06
      );
    }
    if (bubble1Ref.current) {
      bubble1Ref.current.position.y = 0.55 + Math.sin(t * 2) * 0.06;
    }
    if (bubble2Ref.current) {
      bubble2Ref.current.position.y = 0.3 + Math.sin(t * 2 + 1.5) * 0.06;
    }
    if (packageRef.current) {
      packageRef.current.position.y = -0.3 + Math.sin(t * 1.2) * 0.08;
      packageRef.current.rotation.y = Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Chat bubble 1 – left (host) */}
      <group ref={bubble1Ref} position={[-0.5, 0.55, 0]}>
        <RoundedBox args={[0.7, 0.35, 0.12]} radius={0.08} smoothness={4} castShadow>
          <meshPhysicalMaterial color="#8b5cf6" roughness={0.2} metalness={0.3} />
        </RoundedBox>
        <Box args={[0.45, 0.05, 0.13]} position={[0, 0.06, 0.01]}>
          <meshStandardMaterial color="#c4b5fd" />
        </Box>
        <Box args={[0.3, 0.05, 0.13]} position={[-0.08, -0.06, 0.01]}>
          <meshStandardMaterial color="#c4b5fd" />
        </Box>
        <Box args={[0.08, 0.08, 0.1]} position={[-0.35, -0.18, 0]} rotation={[0, 0, 0.4]}>
          <meshStandardMaterial color="#8b5cf6" />
        </Box>
      </group>

      {/* Chat bubble 2 – right (renter) */}
      <group ref={bubble2Ref} position={[0.5, 0.3, 0.1]}>
        <RoundedBox args={[0.6, 0.3, 0.12]} radius={0.08} smoothness={4} castShadow>
          <meshPhysicalMaterial color="#06b6d4" roughness={0.2} metalness={0.3} />
        </RoundedBox>
        <Box args={[0.35, 0.05, 0.13]} position={[0, 0.04, 0.01]}>
          <meshStandardMaterial color="#67e8f9" />
        </Box>
        <Box args={[0.2, 0.05, 0.13]} position={[0.05, -0.06, 0.01]}>
          <meshStandardMaterial color="#67e8f9" />
        </Box>
        <Box args={[0.08, 0.08, 0.1]} position={[0.3, -0.15, 0]} rotation={[0, 0, -0.4]}>
          <meshStandardMaterial color="#06b6d4" />
        </Box>
      </group>

      {/* Package / Box being picked up */}
      <group ref={packageRef} position={[0, -0.3, 0]}>
        <Box args={[0.7, 0.55, 0.5]} castShadow>
          <meshPhysicalMaterial color="#d97706" roughness={0.5} metalness={0.1} />
        </Box>
        <Box args={[0.08, 0.56, 0.51]} position={[0, 0, 0.005]}>
          <meshStandardMaterial color="#fbbf24" />
        </Box>
        <Box args={[0.71, 0.08, 0.51]} position={[0, 0, 0.005]}>
          <meshStandardMaterial color="#fbbf24" />
        </Box>
        <Sphere args={[0.08, 12, 12]} position={[0, 0.38, 0]}>
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
        </Sphere>
        <Cylinder args={[0.02, 0.02, 0.12, 8]} position={[0, 0.32, 0]}>
          <meshStandardMaterial color="#ef4444" />
        </Cylinder>
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────
   Step 4 – Return & Earn
   A circular return arrow with gold coins and a star
   ───────────────────────────────────────────── */
function ReturnScene({ mouseRef }) {
  const groupRef = useRef();
  const coinsRef = useRef();
  const arrowRef = useRef();
  const { getOffset } = useMouseTracker(mouseRef);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = getOffset(1);
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(t * 0.3) * 0.1 + m.rotY,
        0.08
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        m.rotX,
        0.08
      );
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        m.posX * 0.4,
        0.06
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        m.posY * 0.3,
        0.06
      );
    }
    if (coinsRef.current) {
      coinsRef.current.rotation.y = t * 0.5;
    }
    if (arrowRef.current) {
      arrowRef.current.rotation.z = t * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Circular return arrow ring */}
      <group ref={arrowRef}>
        <Torus args={[0.75, 0.07, 12, 48, Math.PI * 1.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#22c55e" roughness={0.15} metalness={0.7} clearcoat={1} />
        </Torus>
        <group position={[0.55, 0, 0.5]} rotation={[0, 0.6, 0]}>
          <Box args={[0.2, 0.04, 0.15]} rotation={[0, 0, 0.5]}>
            <meshStandardMaterial color="#22c55e" metalness={0.7} />
          </Box>
          <Box args={[0.2, 0.04, 0.15]} rotation={[0, 0, -0.5]}>
            <meshStandardMaterial color="#22c55e" metalness={0.7} />
          </Box>
        </group>
      </group>

      {/* Gold coins */}
      <group ref={coinsRef}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const radius = 1.15;
          return (
            <group key={i} position={[Math.cos(angle) * radius, -0.1 + i * 0.03, Math.sin(angle) * radius]}>
              <Cylinder args={[0.15, 0.15, 0.06, 16]} castShadow>
                <meshPhysicalMaterial color="#f59e0b" roughness={0.1} metalness={0.95} clearcoat={1} />
              </Cylinder>
              <Cylinder args={[0.1, 0.1, 0.07, 16]}>
                <meshStandardMaterial color="#fbbf24" metalness={0.9} />
              </Cylinder>
            </group>
          );
        })}
      </group>

      {/* Center star (review) */}
      <group position={[0, 0.15, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return (
            <Box
              key={i}
              args={[0.08, 0.3, 0.05]}
              position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]}
              rotation={[0, 0, a + Math.PI / 2]}
              castShadow
            >
              <meshPhysicalMaterial color="#fbbf24" metalness={0.8} roughness={0.15} emissive="#f59e0b" emissiveIntensity={0.3} />
            </Box>
          );
        })}
      </group>

      {/* Subtle glow ring */}
      <Ring args={[1.0, 1.05, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#22c55e" transparent opacity={0.15} side={THREE.DoubleSide} />
      </Ring>
    </group>
  );
}

/* ─────────────────────────────────────────────
   Main Orchestrator – smoothly transitions between scenes
   and passes mouse data for interactivity
   ───────────────────────────────────────────── */
function StepScenes({ activeStep, mouseRef }) {
  const wrapperRef = useRef();
  const prevStep = useRef(activeStep);

  useFrame(() => {
    if (!wrapperRef.current) return;

    // Smooth scale-in on step change
    const target = 1;
    wrapperRef.current.scale.x = THREE.MathUtils.lerp(wrapperRef.current.scale.x, target, 0.08);
    wrapperRef.current.scale.y = THREE.MathUtils.lerp(wrapperRef.current.scale.y, target, 0.08);
    wrapperRef.current.scale.z = THREE.MathUtils.lerp(wrapperRef.current.scale.z, target, 0.08);

    // Reset scale on step change for a pop-in effect
    if (prevStep.current !== activeStep) {
      prevStep.current = activeStep;
      wrapperRef.current.scale.set(0.7, 0.7, 0.7);
    }
  });

  return (
    <group ref={wrapperRef}>
      {activeStep === 0 && <BrowseScene mouseRef={mouseRef} />}
      {activeStep === 1 && <BookScene mouseRef={mouseRef} />}
      {activeStep === 2 && <ConnectScene mouseRef={mouseRef} />}
      {activeStep === 3 && <ReturnScene mouseRef={mouseRef} />}
    </group>
  );
}

export default function Process3DShowcase({ activeStep = 0 }) {
  // Track mouse position as normalised [-1, 1] values
  const mouseRef = useRef({ x: 0, y: 0 });

  // PERF FIX: Throttle mouse updates with rAF to avoid creating objects on every pointer event
  const rafId = useRef(null);
  const handlePointerMove = useCallback((e) => {
    if (rafId.current) return; // Skip if rAF already pending
    rafId.current = requestAnimationFrame(() => {
      const rect = e.currentTarget?.getBoundingClientRect();
      if (rect) {
        mouseRef.current = {
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
        };
      }
      rafId.current = null;
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    // Smoothly return to center when cursor leaves
    mouseRef.current = { x: 0, y: 0 };
  }, []);

  return (
    <div
      className="w-full h-80 md:h-96 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50/50 to-slate-100/30 border border-slate-200/50 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 4.0], fov: 45 }}
        // PERF FIX: Cap DPR to 1.5 to avoid over-rendering on high-dpi screens
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <directionalLight position={[-5, -4, -3]} intensity={0.5} color="#93c5fd" />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
            <StepScenes activeStep={activeStep} mouseRef={mouseRef} />
          </Float>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
