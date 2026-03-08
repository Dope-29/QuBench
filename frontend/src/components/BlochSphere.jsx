import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

const VectorArrow = ({ vector, color = "#a855f7" }) => {
  const ref = useRef();
  
  // Calculate endpoint based on normalized vector [-1, 1] mapped to sphere radius 2
  const endPoint = new THREE.Vector3(vector.x * 2, vector.y * 2, vector.z * 2);
  
  return (
    <group>
      <Line
        points={[[0, 0, 0], endPoint.toArray()]}
        color={color}
        lineWidth={3}
      />
      <mesh position={endPoint.toArray()}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

const BlochSphereCore = ({ vector }) => {
  const sphereRef = useRef();

  useFrame(() => {
    // Optional slow rotation of the sphere mesh itself
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Outer translucent sphere */}
      <Sphere ref={sphereRef} args={[2, 32, 32]}>
        <meshStandardMaterial 
          color="#3b82f6" 
          transparent={true} 
          opacity={0.15} 
          wireframe={true} 
        />
      </Sphere>

      {/* Axes */}
      <Line points={[[-2.2, 0, 0], [2.2, 0, 0]]} color="#ffffff" opacity={0.3} transparent />
      <Line points={[[0, -2.2, 0], [0, 2.2, 0]]} color="#ffffff" opacity={0.3} transparent />
      <Line points={[[0, 0, -2.2], [0, 0, 2.2]]} color="#ffffff" opacity={0.3} transparent />
      
      {/* Axis Labels */}
      <Text position={[2.4, 0, 0]} fontSize={0.2} color="white">X</Text>
      <Text position={[0, 2.4, 0]} fontSize={0.2} color="white">|0⟩ (Z)</Text>
      <Text position={[0, -2.4, 0]} fontSize={0.2} color="white">|1⟩ (-Z)</Text>
      <Text position={[0, 0, 2.4]} fontSize={0.2} color="white">Y</Text>

      {/* The Quantum State Vector */}
      <VectorArrow vector={vector} />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
    </group>
  );
};

export default function BlochSphere({ vector = { x: 0, y: 0, z: 1 }, title="Qubit 0" }) {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center relative">
      <h3 className="absolute top-2 left-4 text-sm font-semibold text-gray-300 z-10">{title}</h3>
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }}>
        <OrbitControls enableZoom={false} enablePan={false} />
        <BlochSphereCore vector={vector} />
      </Canvas>
    </div>
  );
}
