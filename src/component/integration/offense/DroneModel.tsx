import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';

interface ModelProps {
  rotation: [number, number, number];
}

// This component loads the 3D model
function Model({ rotation }: ModelProps) {
  // This free model is from Sketchfab (CC Attribution)
  const { scene } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/drone/model.gltf');
  
  // Apply the rotation prop directly to the primitive object
  return <primitive object={scene} rotation={rotation} />;
}

// This is the main component you will import
export default function DroneModel({ pitch, yaw, roll }: { pitch: number, yaw: number, roll: number }) {
  // Convert pitch, yaw, roll (which are in radians) to the correct Euler rotation order
  // three.js uses [x, y, z] which corresponds to [pitch, yaw, roll]
  const eulerRotation: [number, number, number] = [pitch, yaw, roll];

  return (
    <Canvas 
      camera={{ position: [0, 0, 2], fov: 50 }} 
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        {/* Lights */}
        <ambientLight intensity={1.5} />
        <Environment preset="sunset" />
        
        {/* Model */}
        <Model rotation={eulerRotation} />
        
        {/* Controls (allows user to rotate with mouse) */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={1.0}
        />
      </Suspense>
    </Canvas>
  );
}

// Preload the model
useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/drone/model.gltf');