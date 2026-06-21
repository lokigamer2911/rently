import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Torus, Cylinder, Box, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 3D Objects matching each step
function StepObjects({ activeStep }) {
  const groupRef = useRef();
  const matRef = useRef();

  const stepConfig = [
    {
      // Step 1: Browse - Rotating search rings
      color: new THREE.Color('#3b82f6'),
      rotation: [0.5, Math.PI / 4, 0],
      scale: 1.0,
    },
    {
      // Step 2: Book - Ticket / Card
      color: new THREE.Color('#10b981'),
      rotation: [0.2, -Math.PI / 4, 0.4],
      scale: 1.1,
    },
    {
      // Step 3: Pickup - Cargo container box
      color: new THREE.Color('#8b5cf6'),
      rotation: [0.8, Math.PI / 2, -0.2],
      scale: 0.95,
    },
    {
      // Step 4: Return - Coins stack
      color: new THREE.Color('#f59e0b'),
      rotation: [0.3, Math.PI * 1.5, 0.2],
      scale: 1.05,
    },
  ];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const config = stepConfig[activeStep] || stepConfig[0];

    // Rotation interpolation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, config.rotation[0], 0.08);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, config.rotation[1], 0.08);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, config.rotation[2], 0.08);

    // Scale interpolation (slightly larger for active step)
    const targetScale = config.scale * 1.15;
    const nextScale = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);

    // Step‑specific subtle motion
    const t = state.clock.getElapsedTime();
    switch (activeStep) {
      case 0:
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;
        break;
      case 1:
        groupRef.current.rotation.x += Math.sin(t * 2) * 0.005;
        break;
      case 2:
        groupRef.current.position.z = Math.sin(t * 1.2) * 0.05;
        break;
      case 3:
        groupRef.current.rotation.y += 0.02;
        break;
      default:
        groupRef.current.position.set(0, 0, 0);
    }

    // Color lerp
    if (matRef.current) {
      matRef.current.color.lerp(config.color, 0.08);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Glass Showcase Pod */}
      <mesh>
        <cylinderGeometry args={[1.3, 1.3, 0.15, 32]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.1}
          metalness={0.2}
          transmission={0.4}
          thickness={0.8}
        />
      </mesh>

      {/* Step 1: Browse */}
      {activeStep === 0 && (
        <group>
          <Torus args={[0.7, 0.12, 16, 48]} castShadow>
            <meshPhysicalMaterial ref={matRef} roughness={0.1} metalness={0.7} />
          </Torus>
          <Box args={[0.12, 0.8, 0.12]} position={[0, -0.9, 0]} castShadow>
            <meshStandardMaterial color="#64748b" roughness={0.3} />
          </Box>
          <Torus args={[1.1, 0.06, 8, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} wireframe />
          </Torus>
        </group>
      )}

      {/* Step 2: Book */}
      {activeStep === 1 && (
        <group position={[0, 0.2, 0]}>
          <RoundedBox args={[1.2, 0.8, 0.1]} radius={0.08} smoothness={4} castShadow>
            <meshPhysicalMaterial ref={matRef} roughness={0.2} metalness={0.6} />
          </RoundedBox>
          <Box args={[0.9, 0.1, 0.12]} position={[0, 0.2, 0.02]} castShadow>
            <meshBasicMaterial color="#ffffff" />
          </Box>
          <Box args={[0.4, 0.1, 0.12]} position={[-0.25, -0.15, 0.02]} castShadow>
            <meshBasicMaterial color="#ffffff" />
          </Box>
          <Cylinder args={[0.18, 0.18, 0.12]} position={[0.3, -0.15, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#fbbf24" metalness={0.9} />
          </Cylinder>
        </group>
      )}

      {/* Step 3: Pickup */}
      {activeStep === 2 && (
        <group position={[0, 0.2, 0]}>
          <Box args={[1, 0.8, 1]} castShadow>
            <meshPhysicalMaterial ref={matRef} roughness={0.4} metalness={0.2} />
          </Box>
          <Box args={[1.05, 0.12, 1.05]} position={[0, 0.45, 0.2]} rotation={[-0.3, 0, 0]} castShadow>
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
          </Box>
        </group>
      )}

      {/* Step 4: Return */}
      {activeStep === 3 && (
        <group>
          <Cylinder args={[0.65, 0.65, 0.18, 24]} position={[-0.3, -0.15, 0]} rotation={[0.4, 0.2, 0]} castShadow>
            <meshPhysicalMaterial ref={matRef} roughness={0.1} metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.65, 0.65, 0.18, 24]} position={[0.3, 0.35, 0.1]} rotation={[0.2, -0.4, 0]} castShadow>
            <meshPhysicalMaterial color="#f59e0b" roughness={0.1} metalness={0.95} />
          </Cylinder>
          <Torus args={[1.1, 0.06, 12, 32]} rotation={[Math.PI / 2.5, 0, 0]}>
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
          </Torus>
        </group>
      )}
    </group>
  );
}

export default function Process3DShowcase({ activeStep = 0 }) {
  return (
    <div className="w-full h-80 md:h-96 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50/50 to-slate-100/30 border border-slate-200/50 shadow-inner flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 4.0], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <directionalLight position={[-5, -4, -3]} intensity={0.5} color="#93c5fd" />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
            <StepObjects activeStep={activeStep} />
          </Float>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}

