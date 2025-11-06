import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

// React.FC is a type that represents a Functional Component in React.
const PortScene: React.FC = () => {
    return (
        // The Canvas component sets up the Three.js scene and renderer.
        <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
            {/* 1. Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {/* 2. Objects - A placeholder box */}
            <Box position={[0, 0.5, 0]}>
                <meshStandardMaterial color="royalblue" />
            </Box>

            {/* A simple plane to act as the ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="gray" />
            </mesh>

            {/* 3. Controls - Allows mouse navigation */}
            <OrbitControls />
        </Canvas>
    );
};

export default PortScene;