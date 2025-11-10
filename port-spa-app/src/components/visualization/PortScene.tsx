import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import type { LayoutElement, RenderableVessel, RenderableResource } from '../../types';
import {
    DockModel, LandModel, WaterModel, YardModel, BuildingModel,
    VesselModel, STSCraneModel, YardCraneModel
} from './models';

interface PortSceneProps {
    layoutElements: LayoutElement[];
    vessels: RenderableVessel[];
    resources: RenderableResource[];
}

const PortScene: React.FC<PortSceneProps> = ({ layoutElements, vessels, resources }) => {
    return (
        <Canvas shadows camera={{ position: [0, 40, 50], fov: 50 }}>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[50, 50, 25]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />

            <Grid infiniteGrid sectionColor="gray" fadeDistance={100} />

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

            {/* 2. Renderizar Navios nos seus locais */}
            {vessels.map(v => (
                <VesselModel key={v.id} position={v.position} size={v.size} label={v.name} />
            ))}

            {/* 3. Renderizar Recursos (Gruas) nos seus locais */}
            {resources.map(r => {
                if(r.kind.toLowerCase().includes('crane')){
                    // Simplificação: assumimos que gruas em docas são STS, e em pátios são de pátio
                    const area = layoutElements.find(el => el.id === r.id); // area.id = resource.assignedArea
                    if(area?.type === 'dock') {
                        return <STSCraneModel key={r.id} position={r.position} size={r.size} label={r.code} />;
                    }
                    if(area?.type === 'yard') {
                        return <YardCraneModel key={r.id} position={r.position} size={r.size} label={r.code} />;
                    }
                }
                return null;
            })}


    );
};

export default PortScene;