import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTFLoader, Text } from '@react-three/drei';
import * as THREE from 'three';

export default function LandingHero() {
  const groupRef = useRef();
  const spheresRef = useRef([]);

  // Create animated spheres
  useEffect(() => {
    if (!groupRef.current) return;

    const spheres = [];
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3];

    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.IcosahedronGeometry(0.5, 4);
      const material = new THREE.MeshPhongMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 0.2,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geometry, material);

      const angle = (i / 4) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 3, Math.sin(angle) * 2, 0);
      mesh.userData.startPos = mesh.position.clone();
      mesh.userData.angle = angle;

      groupRef.current.add(mesh);
      spheres.push(mesh);
    }

    spheresRef.current = spheres;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.z += 0.001;
    }

    spheresRef.current.forEach((sphere, i) => {
      const angle = sphere.userData.angle + t * 0.5;
      sphere.position.x = Math.cos(angle) * 3;
      sphere.position.y = Math.sin(angle) * 2 + Math.sin(t * 0.7 + i) * 0.5;
      sphere.position.z = Math.cos(t * 0.3 + i) * 1;

      sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.02;
    });
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 5]} intensity={0.5} color={0x4ecdc4} />
    </group>
  );
}
