import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CGI product viewer for listings/[id].
 * 360 turntable + exploded toggle, same palette. Additive only.
 */
function PhotoMesh({ url, autoRotate }) {
  const mesh = useRef();
  const texture = useTexture(url);
  useFrame((state, delta) => {
    if (!mesh.current || !autoRotate) return;
    mesh.current.rotation.y += delta * 0.5;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={mesh}>
        <boxGeometry args={[2.2, 1.5, 0.08]} />
        <meshPhysicalMaterial map={texture} roughness={0.35} metalness={0.05} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[2.3, 1.6, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
    </Float>
  );
}

function ExplodedLayers({ url, exploded }) {
  const group = useRef();
  const texture = useTexture(url);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    const target = exploded ? 1 : 0;
    group.current.children.forEach((child, i) => {
      const dir = i === 0 ? 1 : -1;
      child.position.z = THREE.MathUtils.lerp(child.position.z, dir * target * 0.9 + (i === 0 ? 0.15 : -0.15), 0.08);
      child.rotation.y = Math.sin(t * 0.4) * 0.08;
    });
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.35, 0.15]}>
        <planeGeometry args={[2.0, 1.3]} />
        <meshPhysicalMaterial map={texture} roughness={0.3} clearcoat={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.35, -0.15]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.0, 1.3]} />
        <meshPhysicalMaterial map={texture} roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

export default function ProductViewer({ images = [], title = '' }) {
  const [mode, setMode] = useState('turntable'); // turntable | exploded
  const [autoRotate, setAutoRotate] = useState(true);
  const [index, setIndex] = useState(0);
  const url = images[index] || images[0];

  if (!url) return null;

  return (
    <div className="product-viewer">
      <div className="product-viewer-bar">
        <span>CGI view · {title.slice(0, 28)}</span>
        <div className="product-viewer-btns">
          <button type="button" onClick={() => setMode('turntable')} className={mode === 'turntable' ? 'is-active' : ''}>360°</button>
          <button type="button" onClick={() => setMode('exploded')} className={mode === 'exploded' ? 'is-active' : ''}>Exploded</button>
          <button type="button" onClick={() => setAutoRotate((v) => !v)}>{autoRotate ? 'Pause' : 'Spin'}</button>
        </div>
      </div>
      <div className="product-viewer-canvas">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.4, 4.2], fov: 40 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 6, 4]} intensity={1.4} />
          <Suspense fallback={null}>
            {mode === 'turntable' ? (
              <PhotoMesh url={url} autoRotate={autoRotate} />
            ) : (
              <ExplodedLayers url={url} exploded />
            )}
            <ContactShadows position={[0, -1.2, 0]} opacity={0.32} scale={9} blur={2.6} far={4} />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>
      {images.length > 1 && (
        <div className="product-viewer-thumbs">
          {images.slice(0, 4).map((img, i) => (
            <button key={img + i} type="button" onClick={() => setIndex(i)} className={i === index ? 'is-active' : ''}>
              <img src={img} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
