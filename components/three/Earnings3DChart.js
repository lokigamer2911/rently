import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

const barConfigs = [
  { targetH: 0.7, label: 'Month 1', value: '₹5,000', color: '#34d399', delay: 0.1 },
  { targetH: 1.4, label: 'Month 2', value: '₹12,000', color: '#10b981', delay: 0.4 },
  { targetH: 2.1, label: 'Month 3', value: '₹18,000', color: '#059669', delay: 0.7 },
  { targetH: 2.9, label: 'Month 4', value: '₹28,000+', color: '#047857', delay: 1.0 },
];

function Bar({ position, targetH, label, value, color, delay }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    if (elapsed > delay) {
      // Smoothly lerp height scale Y
      const currentScaleY = meshRef.current.scale.y;
      const targetScaleY = targetH;
      const nextScaleY = THREE.MathUtils.lerp(currentScaleY, targetScaleY, 0.08);
      meshRef.current.scale.y = nextScaleY;
      
      // Shift position so it grows from base
      meshRef.current.position.y = nextScaleY / 2 - 1.5;
    }
  });

  return (
    <group position={position}>
      {/* 3D Bar */}
      <mesh ref={meshRef} position={[0, -1.5, 0]} scale={[1, 0.01, 1]} castShadow>
        <boxGeometry args={[0.7, 1, 0.7]} />
        <meshPhysicalMaterial 
          color={color}
          roughness={0.15}
          metalness={0.8}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Floating Tooltip HTML Overlay */}
      <Html position={[0, targetH - 1.4, 0]} center distanceFactor={5.2} style={{ transition: 'all 0.5s ease' }}>
        <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-white/95 border border-emerald-100 shadow-[0_12px_24px_-10px_rgba(4,120,87,0.15)] text-[10px] font-bold text-slate-800 whitespace-nowrap animate-pulse">
          <span className="text-emerald-600 font-extrabold">{value}</span>
          <span className="text-[8px] text-slate-400 font-semibold">{label}</span>
        </div>
      </Html>
    </group>
  );
}

function ChartScene() {
  const chartGroup = useRef();

  useFrame(({ clock }) => {
    if (!chartGroup.current) return;
    // Slow rotational drift
    chartGroup.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.15 - 0.2;
  });

  return (
    <group ref={chartGroup} position={[0, 0.1, 0]}>
      {/* Glass Base Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshPhysicalMaterial 
          color="#a7f3d0"
          roughness={0.2}
          metalness={0.2}
          transmission={0.5}
          thickness={0.4}
        />
      </mesh>

      {/* Render 4 growing bars */}
      {barConfigs.map((bar, i) => (
        <Bar 
          key={i}
          position={[(i - 1.5) * 1.35, 0, 0]}
          targetH={bar.targetH}
          label={bar.label}
          value={bar.value}
          color={bar.color}
          delay={bar.delay}
        />
      ))}
    </group>
  );
}

export default function Earnings3DChart() {
  return (
    <div className="w-full h-96 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50/50 to-emerald-50/20 border border-emerald-100/50 shadow-inner flex items-center justify-center">
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 4.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[4, 6, 3]} 
          intensity={1.8} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#a7f3d0" />
        <Suspense fallback={null}>
          <ChartScene />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
