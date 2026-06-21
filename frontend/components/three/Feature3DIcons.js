import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// 1. Network Icon (Wireframe sphere with inner core)
function NetworkScene({ hovered }) {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current || !innerRef.current) return;
    const speed = hovered ? 1.2 : 0.4;
    meshRef.current.rotation.y += speed * delta;
    meshRef.current.rotation.x += speed * 0.4 * delta;
    innerRef.current.rotation.y -= speed * 0.8 * delta;
    const s = hovered ? 1.2 : 1.0;
    meshRef.current.scale.lerp({ x: s, y: s, z: s }, 0.1);
  });

  return (
    <group>
      <ambientLight intensity={1} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color="#3b82f6"
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial
          color="#10b981"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

// 2. Safe Icon (Chrome security lock)
function SafeScene({ hovered }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = hovered ? 1.0 : 0.3;
    groupRef.current.rotation.y += speed * delta;
    if (hovered) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 8) * 0.2;
    } else {
      groupRef.current.position.y *= 0.9; // ease back to 0
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={1.5} />
      {/* Padlock Body */}
      <RoundedBox args={[1.4, 1, 0.6]} radius={0.15} smoothness={4} position={[0, -0.2, 0]}>
        <meshPhysicalMaterial
          color="#10b981"
          roughness={0.15}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </RoundedBox>
      {/* Padlock Shackle */}
      <Torus args={[0.5, 0.15, 16, 32, Math.PI]} position={[0, 0.3, 0]}>
        <meshPhysicalMaterial
          color="#d4af37"
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </Torus>
    </group>
  );
}

// 3. Speed Icon (Neon Chronometer/Clock)
function SpeedScene({ hovered }) {
  const pointerRef = useRef();
  const discRef = useRef();

  useFrame((state, delta) => {
    if (!pointerRef.current || !discRef.current) return;
    const speed = hovered ? 6 : 1.2;
    pointerRef.current.rotation.z -= speed * delta;
    const discSpeed = hovered ? 2 : 0.5;
    discRef.current.rotation.y += discSpeed * delta;
  });

  return (
    <group>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 3, 3]} intensity={1.5} />
      <group ref={discRef}>
        {/* Clock Face Rim */}
        <Torus args={[1.1, 0.15, 12, 48]}>
          <meshPhysicalMaterial
            color="#14b8a6"
            roughness={0.2}
            metalness={0.7}
          />
        </Torus>
        {/* Clock Center Pin */}
        <Cylinder args={[0.15, 0.15, 0.4, 16]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#ffffff" metalness={0.9} />
        </Cylinder>
      </group>
      {/* Clock pointer */}
      <group ref={pointerRef}>
        <mesh position={[0, 0.5, 0.1]}>
          <boxGeometry args={[0.1, 0.8, 0.08]} />
          <meshPhysicalMaterial
            color="#fb923c"
            emissive="#fb923c"
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>
    </group>
  );
}

// 4. Value Icon (Hopping Golden Coins)
function ValueScene({ hovered }) {
  const coinGroupRef = useRef();

  useFrame((state, delta) => {
    if (!coinGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    const rotationSpeed = hovered ? 2.5 : 0.5;
    coinGroupRef.current.rotation.y += rotationSpeed * delta;
    if (hovered) {
      coinGroupRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.4 - 0.2;
    } else {
      coinGroupRef.current.position.y = Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <group ref={coinGroupRef}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 2]} intensity={2.0} />
      {/* Bottom Coin */}
      <Cylinder args={[0.9, 0.9, 0.2, 32]} rotation={[Math.PI / 2.3, 0.2, 0]} position={[-0.2, -0.2, -0.1]} castShadow>
        <meshPhysicalMaterial
          color="#fbbf24"
          roughness={0.12}
          metalness={0.95}
          clearcoat={0.9}
        />
      </Cylinder>
      {/* Top Coin */}
      <Cylinder args={[0.9, 0.9, 0.2, 32]} rotation={[Math.PI / 2.5, -0.1, 0]} position={[0.2, 0.3, 0.1]} castShadow>
        <meshPhysicalMaterial
          color="#eab308"
          roughness={0.1}
          metalness={0.98}
          clearcoat={1}
        />
      </Cylinder>
    </group>
  );
}

export default function Feature3DIcon({ type, hovered = false }) {
  const renderScene = () => {
    switch (type) {
      case 'network':
        return <NetworkScene hovered={hovered} />;
      case 'safe':
        return <SafeScene hovered={hovered} />;
      case 'speed':
        return <SpeedScene hovered={hovered} />;
      case 'value':
        return <ValueScene hovered={hovered} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {renderScene()}
        </Suspense>
      </Canvas>
    </div>
  );
}
