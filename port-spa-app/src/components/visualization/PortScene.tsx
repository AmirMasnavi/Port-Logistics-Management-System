import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { CargoShipModel } from "./CargoShipModel";
import { ContainerModel } from './ContainerModel';
import type { LayoutElement, RenderableVessel, RenderableResource, RenderableContainer } from '../../domain/types';
import {
    DockModel, LandModel, WaterModel, YardModel, BuildingModel,
    STSCraneModel, YardCraneModel
} from './models';
import { useMemo } from 'react';
import * as THREE from 'three';

// Global scale factor to make the whole port layout "bigger" in world units
const WORLD_SCALE = 3; // tweak this to 2, 3, 4... until the map feels right

// Fator extra para aumentar o comprimento da land do meio do porto
const MIDDLE_LAND_LENGTH_FACTOR = 1.5; // 1.0 = igual, 1.5 = +50%, 2.0 = dobro

// This version correctly applies shadows to loaded models.
const ImportedModel: React.FC<{
    modelUrl: string;
    position: [number, number, number];
    scale: [number, number, number] | number;
}> = ({ modelUrl, position, scale }) => {
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
};

interface PortSceneProps {
    layoutElements: LayoutElement[];
    vessels: RenderableVessel[];
    resources: RenderableResource[];
    containers?: RenderableContainer[]; // optional (defaults to [])
}

const PortScene: React.FC<PortSceneProps> = ({ layoutElements, vessels, resources, containers }) => {
    // Safe default for containers until backend integration is wired
    const containerList = containers ?? [];

    // Build a quick lookup by id for layout elements to avoid repeated finds
    const layoutMap = React.useMemo(() => new Map(layoutElements.map(el => [el.id, el])), [layoutElements]);

    // Criar uma versão ajustada dos layoutElements onde as duas lands trocam de posição
    const swappedLayoutElements = React.useMemo(() => {
        const cloned = layoutElements.map(el => ({ ...el }));
        const landIndexes = cloned
            .map((el, index) => ({ el, index }))
            .filter(x => x.el.type === 'land');

        if (landIndexes.length === 2) {
            const [a, b] = landIndexes;
            const tempPos = [...a.el.position] as [number, number, number];
            const tempSize = [...a.el.size] as [number, number, number];
            a.el.position = [...b.el.position] as [number, number, number];
            a.el.size = [...b.el.size] as [number, number, number];
            b.el.position = tempPos;
            b.el.size = tempSize;
        }

        return cloned;
    }, [layoutElements]);

    // Identificar a "land do meio" de forma determinística: a land cujo X está mais próximo de 0
    const middleLandId = React.useMemo(() => {
        const lands = swappedLayoutElements.filter(el => el.type === 'land');
        if (lands.length === 0) return undefined;
        let best = lands[0];
        let bestAbsX = Math.abs(lands[0].position[0]);
        for (const el of lands) {
            const absX = Math.abs(el.position[0]);
            if (absX < bestAbsX) {
                best = el;
                bestAbsX = absX;
            }
        }
        return best.id;
    }, [swappedLayoutElements]);

    // Scale layout elements so docks, yards, land, water, buildings are larger and further apart
    const scaledLayoutElements = React.useMemo(
        () => swappedLayoutElements.map(el => {
            const basePosition: [number, number, number] = [
                el.position[0] * WORLD_SCALE,
                el.position[1] * WORLD_SCALE,
                el.position[2] * WORLD_SCALE,
            ];
            const baseSize: [number, number, number] = [
                el.size[0] * WORLD_SCALE,
                el.size[1] * WORLD_SCALE,
                el.size[2] * WORLD_SCALE,
            ];

            // Se esta for a land do meio, aumentamos o comprimento (eixo Z)
            if (el.type === 'land' && el.id === middleLandId) {
                return {
                    ...el,
                    position: basePosition,
                    size: [
                        baseSize[0],
                        baseSize[1],
                        baseSize[2] * MIDDLE_LAND_LENGTH_FACTOR,
                    ] as [number, number, number],
                };
            }

            return {
                ...el,
                position: basePosition,
                size: baseSize,
            };
        }),
        [swappedLayoutElements, middleLandId]
    );

    // Scale vessels (position + size)
    const scaledVessels = React.useMemo(
        () => vessels.map(v => ({
            ...v,
            position: [
                v.position[0] * WORLD_SCALE,
                v.position[1] * WORLD_SCALE,
                v.position[2] * WORLD_SCALE,
            ] as [number, number, number],
            size: Array.isArray(v.size)
                ? ([
                    v.size[0] * WORLD_SCALE,
                    v.size[1] * WORLD_SCALE,
                    v.size[2] * WORLD_SCALE,
                ] as [number, number, number])
                : (v.size ?? 0.5) * WORLD_SCALE,
        })),
        [vessels]
    );

    // Scale resources (cranes)
    const scaledResources = React.useMemo(
        () => resources.map(r => ({
            ...r,
            position: [
                r.position[0] * WORLD_SCALE,
                r.position[1] * WORLD_SCALE,
                r.position[2] * WORLD_SCALE,
            ] as [number, number, number],
            size: [
                r.size[0] * WORLD_SCALE,
                r.size[1] * WORLD_SCALE,
                r.size[2] * WORLD_SCALE,
            ] as [number, number, number],
        })),
        [resources]
    );

    // Debugging info to help identify why cranes may not be rendered
    React.useEffect(() => {
        console.debug('PortScene: layoutElements count =', layoutElements.length);
        console.debug('PortScene: resources count =', resources.length, resources);
    }, [layoutElements, resources]);

    // Enable visual markers when URL contains ?debugCrane
    const showMarkers = typeof window !== 'undefined' && window.location.search.includes('debugCrane');

    // Pre-index containers by yard id for fast lookup
    const containersByYard = React.useMemo(() => {
        const map = new Map<string, RenderableContainer[]>();
        for (const c of containerList) {
            if (!map.has(c.yardId)) map.set(c.yardId, []);
            map.get(c.yardId)!.push(c);
        }
        return map;
    }, [containerList]);

    return (
        // Ensure the Canvas will size to its parent container which should control layout
        <Canvas
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            shadows
            // Move the camera further back so the enlarged map fits nicely
            camera={{ position: [0, 120 * WORLD_SCALE / 3, 200 * WORLD_SCALE / 3], fov: 60 }}
        >
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[50 * WORLD_SCALE / 3, 50 * WORLD_SCALE / 3, 25 * WORLD_SCALE / 3]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />

            <Grid
                infiniteGrid
                cellThickness={0}
                sectionThickness={0}
                sectionColor="gray"
                // Increase fade distance for larger world
                fadeDistance={100 * WORLD_SCALE}
            />

            {/* Render layout.elements as base structures */}
            {/* 1. Renderizar Elementos do Layout Estático */}
            {scaledLayoutElements.map(el => {
                switch (el.type) {
                    case 'dock':
                        return <DockModel key={el.id} position={el.position} size={el.size} label={el.name} />;
                    case 'yard': {
                        const yardContainers = containersByYard.get(el.id) ?? [];
                        return (
                            <group key={el.id}>
                                <YardModel position={el.position} size={el.size} label={el.name} />
                                {/* Dynamic containers from backend positioned relative to yard center */}
                                {yardContainers.map(c => (
                                    <ContainerModel
                                        key={c.id}
                                        position={[
                                            el.position[0] + c.position[0] * WORLD_SCALE,
                                            el.position[1] + c.position[1] * WORLD_SCALE,
                                            el.position[2] + c.position[2] * WORLD_SCALE,
                                        ]}
                                        size={[c.size[0] * WORLD_SCALE, c.size[1] * WORLD_SCALE, c.size[2] * WORLD_SCALE]}
                                        textureUrl={c.textureUrl}
                                    />
                                ))}
                            </group>
                        );
                    }
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
            {scaledVessels.map(v => (
                v.modelUrl ? (
                    <ImportedModel key={v.id} modelUrl={v.modelUrl} position={v.position} scale={v.size} />
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
            {scaledResources.map(r => {
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
                        console.warn('PortScene: could not find layout area for resource', r, '- tried id/code/assignedArea');
                        return null;
                    }

                    if (r.modelUrl) {
                        return <ImportedModel key={`${r.id}-${r.code}`} modelUrl={r.modelUrl} position={r.position} scale={r.size} />;
                    }

                    // Optional debug marker to show expected position
                    const marker = showMarkers ? (
                        <mesh key={`marker-${r.id}-${r.code}`} position={r.position}>
                            <sphereGeometry args={[0.3 * WORLD_SCALE, 8, 6]} />
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

            <OrbitControls
                mouseButtons={{
                    LEFT: THREE.MOUSE.PAN,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.ROTATE,
                }}
                // Allow zooming further out for the larger world
                maxDistance={50 * WORLD_SCALE}
                minDistance={10}
                rotateSpeed={0.20}
                panSpeed={0.30}
            />
        </Canvas>
    );
};

export default PortScene;
