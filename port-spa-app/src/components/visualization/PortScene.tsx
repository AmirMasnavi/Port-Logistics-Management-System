import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import type { LayoutElement, RenderableVessel, RenderableResource } from '../../types';
import {
    DockModel, LandModel, WaterModel, YardModel, BuildingModel,
    VesselModel, STSCraneModel, YardCraneModel
} from './models';

// Generic component to render imported GLTF/OBJ models
const ImportedModel: React.FC<{
    modelUrl: string;
    position: [number, number, number];
    scale: [number, number, number];
}> = ({ modelUrl, position, scale }) => {
    const { scene } = useGLTF(modelUrl);
    return <primitive object={scene} position={position} scale={scale} />;
};

interface PortSceneProps {
    layoutElements: LayoutElement[];
    vessels: RenderableVessel[];
    resources: RenderableResource[];
}

const PortScene: React.FC<PortSceneProps> = ({ layoutElements, vessels, resources }) => {
    return (
        // Ensure the Canvas will size to its parent container which should control layout
        <Canvas className="w-full h-full" style={{ width: '100%', height: '100%' }} shadows camera={{ position: [0, 40, 50], fov: 50 }}>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[50, 50, 25]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />

            <Grid infiniteGrid cellThickness={0} sectionThickness={0} sectionColor="gray" fadeDistance={100} />

            {/* Render layout.elements as base structures */}
            {/* 1. Renderizar Elementos do Layout Estático */}
            {layoutElements.map(el => {
                switch (el.type) {
                    case 'dock':
                        return <DockModel key={el.id} position={el.position} size={el.size} label={el.name} />;
                    case 'yard':
                        return <YardModel key={el.id} position={el.position} size={el.size} label={el.name} />;
                    case 'land':
                        return <LandModel key={el.id} position={el.position} size={el.size} />;
                    case 'water':
                        return <WaterModel key={el.id} position={el.position} size={el.size} />;
                    case 'building':
                        return <BuildingModel key={el.id} position={el.position} size={el.size} label={el.name} />;
                    default:
                        return null;
                }
            })}

            {/* Render vessels: imported model if available, else procedural */}
            {/* 2. Renderizar Navios nos seus locais */}
            {vessels.map(v => (
                v.modelUrl ? (
                    <ImportedModel key={v.id} modelUrl={v.modelUrl} position={v.position} scale={v.size} />
                ) : (
                    <VesselModel key={v.id} position={v.position} size={v.size} label={v.name} />
                )
            ))}

            {/* Render cranes: imported model if available, else procedural based on area type */}
            {/* 3. Renderizar Recursos (Gruas) nos seus locais */}
            {resources.map(r => {
                if(r.kind.toLowerCase().includes('crane')){
                    // Simplificação: assumimos que gruas em docas são STS, e em pátios são de pátio
                    const area = layoutElements.find(el => el.id === r.id); // area.id = resource.assignedArea

                    if (r.modelUrl) {
                        return <ImportedModel key={r.id} modelUrl={r.modelUrl} position={r.position} scale={r.size} />;
                    }
                    
                    if(area?.type === 'dock') {
                        return <STSCraneModel key={r.id} position={r.position} size={r.size} label={r.code} />;
                    }
                    
                    if(area?.type === 'yard') {
                        return <YardCraneModel key={r.id} position={r.position} size={r.size} label={r.code} />;
                    }
                }
                return null;
            })}

            <OrbitControls />
        </Canvas>
    );
};

export default PortScene;