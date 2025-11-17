import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { CargoShipModel } from "./CargoShipModel";
import type { LayoutElement, RenderableVessel, RenderableResource } from '../../domain/types';
import {
    DockModel, LandModel, WaterModel, YardModel, BuildingModel,
    STSCraneModel, YardCraneModel
} from './models';
import { useMemo } from 'react';
import * as THREE from 'three';

// This version correctly applies shadows to loaded models.
const ImportedModel: React.FC<{
    modelUrl: string;
    position: [number, number, number];
    scale: [number, number, number] | number;
    rotation?: [number, number, number];
}> = ({ modelUrl, position, scale, rotation }) => {
    const { scene } = useGLTF(modelUrl);

    // We use useMemo to traverse the scene only once when it loads
    const memoizedScene = useMemo(() => {
        // This loop goes through every single part of the loaded model
        scene.traverse((child) => {
            // We check if the part is a 3D mesh
            if ((child as THREE.Mesh).isMesh) {
                // And tell it to cast and receive shadows
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return scene;
    }, [scene]);

    // We now render the 'memoizedScene' which has shadows enabled
    return <primitive object={memoizedScene} position={position} scale={scale} />;
    return <primitive object={scene} position={position} rotation={rotation as any} scale={scale as any} />;
};

interface PortSceneProps {
    layoutElements: LayoutElement[];
    vessels: RenderableVessel[];
    resources: RenderableResource[];
}

const PortScene: React.FC<PortSceneProps> = ({ layoutElements, vessels, resources }) => {
    // Build a quick lookup by id for layout elements to avoid repeated finds
    const layoutMap = React.useMemo(() => new Map(layoutElements.map(el => [el.id, el])), [layoutElements]);

    // Debugging info to help identify why cranes may not be rendered
    React.useEffect(() => {
        console.debug('PortScene: layoutElements count =', layoutElements.length);
        console.debug('PortScene: resources count =', resources.length, resources);
    }, [layoutElements, resources]);

    // Enable visual markers when URL contains ?debugCrane
    const showMarkers = typeof window !== 'undefined' && window.location.search.includes('debugCrane');

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

            {/* Render vessels: imported model if available, else use CargoShipModel */}
            {/* 2. Renderizar Navios nos seus locais */}
            {vessels.map(v => (
                v.modelUrl ? (
                    <ImportedModel key={v.id} modelUrl={v.modelUrl} position={v.position} scale={v.size} rotation={v.rotation} />
                ) : (
                    <CargoShipModel
                        key={v.id}
                        position={v.position}
                        // vessels.size can be either a number or an array; pass it through or fallback to 0.5
                        scale={Array.isArray(v.size) ? (v.size as any) : (v.size ?? 0.5)}
                        rotation={v.rotation}
                    />
                )
            ))}

            {/* Render cranes: imported model if available, else procedural based on area type */}
            {/* 3. Renderizar Recursos (Gruas) nos seus locais */}
            {resources.map(r => {
                if (r.kind.toLowerCase().includes('crane')) {
                    // Resolve area robustly: try several guesses (r.id, r.code, r.assignedArea)
                    const resolveArea = (): LayoutElement | undefined => {
                        // Candidates we will try to match against layout elements
                        const candidates: string[] = [];
                        if (r.id) candidates.push(String(r.id));
                        // Some callers might attach assignedArea on the resource object
                        if ((r as any).assignedArea) candidates.push(String((r as any).assignedArea));
                        if (r.code) candidates.push(String(r.code));

                        // Try exact id lookup first
                        for (const c of candidates) {
                            const byId = layoutMap.get(c);
                            if (byId) {
                                console.debug('PortScene: matched layout element by id', c, 'for resource', r);
                                return byId;
                            }
                        }

                        // Try matching by name or id equality
                        for (const c of candidates) {
                            const byName = layoutElements.find(el => el.name === c || el.id === c);
                            if (byName) {
                                console.debug('PortScene: matched layout element by name/id', c, 'for resource', r);
                                return byName;
                            }
                        }

                        // Fallback: fuzzy match (case-insensitive contains)
                        const lowerCandidates = candidates.map(x => x.toLowerCase());
                        const fuzzy = layoutElements.find(el => {
                            const idLower = String(el.id).toLowerCase();
                            const nameLower = String(el.name ?? '').toLowerCase();
                            return lowerCandidates.some(c => idLower.includes(c) || nameLower.includes(c));
                        });
                        if (fuzzy) {
                            console.debug('PortScene: matched layout element by fuzzy contains for resource', r, 'matched', fuzzy.id);
                            return fuzzy;
                        }

                        return undefined;
                    };

                    const area = resolveArea();
                    if (!area) {
                        console.warn('PortScene: could not find layout area for resource', r, '— tried id/code/assignedArea');
                        return null;
                    }

                    if (r.modelUrl) {
                        return <ImportedModel key={`${r.id}-${r.code}`} modelUrl={r.modelUrl} position={r.position} scale={r.size} />;
                    }

                    // Optional debug marker to show expected position
                    const marker = showMarkers ? (
                        <mesh key={`marker-${r.id}-${r.code}`} position={r.position}>
                            <sphereGeometry args={[0.3, 8, 6]} />
                            <meshStandardMaterial color="red" metalness={0.1} roughness={0.6} opacity={0.9} transparent={false} />
                        </mesh>
                    ) : null;

                    if (area.type === 'dock') {
                        return (
                            <group key={`${r.id}-${r.code}`}>
                                <STSCraneModel position={r.position} size={r.size} label={r.code} />
                                {marker}
                            </group>
                        );
                    }

                    if (area.type === 'yard') {
                        return (
                            <group key={`${r.id}-${r.code}`}>
                                <YardCraneModel position={r.position} size={r.size} label={r.code} />
                                {marker}
                            </group>
                        );
                    }
                }
                return null;
            })}

            <OrbitControls />
        </Canvas>
    );
};

export default PortScene;