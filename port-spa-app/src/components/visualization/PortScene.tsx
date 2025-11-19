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

// Simple deterministic pseudo-random generator based on a string seed
function seededRandom(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
        h = Math.imul(1664525, h) + 1013904223 | 0;
        // convert to [0,1)
        return ((h >>> 0) % 10000) / 10000;
    };
}

const PortScene: React.FC<PortSceneProps> = ({ layoutElements, vessels, resources, containers }) => {
    // Safe default for containers until backend integration is wired
    const containerList = containers ?? [];

    // Yard surface height constant - matches YardModel positioning (YARD_THICKNESS - 9.43 + YARD_THICKNESS/2)
    // If you change the YardModel height in models.tsx, update this value accordingly
    const YARD_SURFACE_Y_OFFSET = -8.53;

    // Build a quick lookup by id for layout elements to avoid repeated finds
    const layoutMap = React.useMemo(() => new Map(layoutElements.map(el => [el.id, el])), [layoutElements]);

    // Helper to deterministically generate exactly 15 containers laid out in a 3D block
    const generateYardContainers = React.useCallback((yardId: string): RenderableContainer[] => {
        const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'lightblue'];
        const result: RenderableContainer[] = [];
        const size: [number, number, number] = [2.5 * WORLD_SCALE, 1.5 * WORLD_SCALE, 1.2 * WORLD_SCALE];
        const spacingX = 3.0 * WORLD_SCALE;
        const spacingZ = 2.6 * WORLD_SCALE;
        const height = size[1]; // Use exact container height to eliminate air gaps

        // Create a seeded random generator for this specific yard
        const rand = seededRandom(yardId);
        
        // Track occupied positions: Map<"col,row,level", boolean>
        const occupied = new Map<string, boolean>();
        
        // Helper function to check if a position has support below it
        const hasSupport = (col: number, row: number, level: number): boolean => {
            if (level === 0) return true; // Ground level always has support
            // Check if the position directly below is occupied
            const belowKey = `${col},${row},${level - 1}`;
            return occupied.has(belowKey);
        };
        
        // Create all possible ground-level positions first
        const groundPositions: Array<{ col: number; row: number; level: number }> = [];
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 5; col++) {
                groundPositions.push({ col, row, level: 0 });
            }
        }
        
        // Shuffle ground positions using yard-specific random seed
        for (let i = groundPositions.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [groundPositions[i], groundPositions[j]] = [groundPositions[j], groundPositions[i]];
        }
        
        // Place containers using a stack-building approach
        let containersPlaced = 0;
        const maxContainers = 200;
        let attempts = 0;
        const maxAttempts = 1000; // Prevent infinite loops
        
        // Try to place up to 100 containers
        while (containersPlaced < maxContainers && attempts < maxAttempts) {
            attempts++;
            
            // Randomly decide: place on ground (60%) or stack on existing (40%)
            const placeOnGround = rand() < 0.6 || containersPlaced < 20;
            
            if (placeOnGround) {
                // Try to place on a random ground position
                const startIdx = Math.floor(rand() * groundPositions.length);
                let found = false;
                
                for (let i = 0; i < groundPositions.length; i++) {
                    const idx = (startIdx + i) % groundPositions.length;
                    const pos = groundPositions[idx];
                    const key = `${pos.col},${pos.row},${pos.level}`;
                    
                    if (!occupied.has(key)) {
                        // Place container here
                        const x = (pos.col - 1) * spacingX;
                        const y = height * (pos.level + 0.5);
                        const z = (pos.row - 1) * spacingZ;
                        const colorIndex = Math.floor(rand() * COLORS.length);
                        
                        result.push({
                            id: `${yardId}-C${containersPlaced + 1}`,
                            code: `C${(containersPlaced + 1).toString().padStart(2, '0')}`,
                            yardId,
                            position: [x, y, z],
                            size,
                            textureUrl: COLORS[colorIndex],
                        });
                        
                        occupied.set(key, true);
                        containersPlaced++;
                        found = true;
                        break;
                    }
                }
                
                if (!found && containersPlaced >= groundPositions.length) {
                    // All ground positions filled, force stacking mode
                    continue;
                }
            } else {
                // Try to stack on an existing container
                // Get all occupied positions
                const occupiedList = Array.from(occupied.keys());
                if (occupiedList.length === 0) continue;
                
                const startIdx = Math.floor(rand() * occupiedList.length);
                
                for (let i = 0; i < occupiedList.length; i++) {
                    const idx = (startIdx + i) % occupiedList.length;
                    const [colStr, rowStr, levelStr] = occupiedList[idx].split(',');
                    const col = parseInt(colStr);
                    const row = parseInt(rowStr);
                    const level = parseInt(levelStr);
                    
                    // Try to place one level above this container
                    const newLevel = level + 1;
                    if (newLevel >= 5) continue; // Max 5 levels
                    
                    const newKey = `${col},${row},${newLevel}`;
                    if (!occupied.has(newKey) && hasSupport(col, row, newLevel)) {
                        // Place container here
                        const x = (col - 1) * spacingX;
                        const y = height * (newLevel + 0.5);
                        const z = (row - 1) * spacingZ;
                        const colorIndex = Math.floor(rand() * COLORS.length);
                        
                        result.push({
                            id: `${yardId}-C${containersPlaced + 1}`,
                            code: `C${(containersPlaced + 1).toString().padStart(2, '0')}`,
                            yardId,
                            position: [x, y, z],
                            size,
                            textureUrl: COLORS[colorIndex],
                        });
                        
                        occupied.set(newKey, true);
                        containersPlaced++;
                        break;
                    }
                }
            }
        }

        return result;
    }, []);

    // Pre-index containers by yard id for fast lookup
    const containersByYard = React.useMemo(() => {
        const map = new Map<string, RenderableContainer[]>();
        for (const c of containerList) {
            if (!map.has(c.yardId)) map.set(c.yardId, []);
            map.get(c.yardId)!.push(c);
        }
        return map;
    }, [containerList]);

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

    // If there are no yard elements coming from backend, create a couple of static yards
    const hasBackendYards = scaledLayoutElements.some(el => el.type === 'yard');

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
                    case 'dock': {
                        
                        const numSplits = 1;
                        const gapZ = 5 * WORLD_SCALE; // Gap along Z (depth)
                        const gapX = 3 * WORLD_SCALE; // Gap along X (length) - spacing between docks
                        const rawSplitDepth = el.size[2] / numSplits;
                        const adjustedDepth = rawSplitDepth - gapZ;
                        
                        // Adjust X size to add spacing
                        const adjustedLength = el.size[0] - gapX;
                        
                        // Detect if this is Dock B (the right-side dock that needs adjustment)
                        const isDockB = el.name === 'Dock B';
                        // Add extra offset for Dock B to move it away from land
                        const dockBOffset = isDockB ? 2 * WORLD_SCALE : 0;
                        
                        
                        
                        const dockSplits: React.ReactElement[] = [];
                        for (let i = 0; i < numSplits; i++) {
                            const offsetZ = (i - (numSplits - 1) / 2) * rawSplitDepth;
                            const finalZ = el.position[2] + offsetZ;
                            const finalX = el.position[0] + dockBOffset; // Apply offset to X-axis instead
                            const splitPosition: [number, number, number] = [
                                finalX,
                                el.position[1],
                                finalZ,
                            ];
                            
                            dockSplits.push(
                                <DockModel 
                                    key={`${el.id}_D${i + 1}`} 
                                    position={splitPosition} 
                                    size={[adjustedLength, el.size[1], adjustedDepth]}
                                    label={`${el.name} ${i + 1}`} 
                                />
                            );
                        }
                        return <group key={el.id}>{dockSplits}</group>;
                    }
                    case 'yard': {
                        const yardContainers = containersByYard.get(el.id) ?? generateYardContainers(el.id);

                        const tileCols = 2;
                        const tileRows = 2;
                        const gap = 5 * WORLD_SCALE;
                        const rawTileWidth = el.size[0] / tileCols;
                        const rawTileDepth = el.size[2] / tileRows;
                        const tileWidth = rawTileWidth - gap;
                        const tileDepth = rawTileDepth - gap;

                        const tiles: React.ReactElement[] = [];
                        let tileIndex = 0;

                        for (let r = 0; r < tileRows; r++) {
                            for (let c = 0; c < tileCols; c++) {
                                tileIndex++;
                                const tileId = `${el.id}_T${tileIndex}`;
                                const offsetX = (c - (tileCols - 1) / 2) * rawTileWidth;
                                const offsetZ = (r - (tileRows - 1) / 2) * rawTileDepth;
                                const tileCenter: [number, number, number] = [
                                    el.position[0] + offsetX,
                                    el.position[1],
                                    el.position[2] + offsetZ,
                                ];

                                // Calculate max containers that fit in this tile
                                const spacingX = 3.0 * WORLD_SCALE;
                                const spacingZ = 2.6 * WORLD_SCALE;
                                const containerWidth = 2.5 * WORLD_SCALE;
                                const containerDepth = 1.2 * WORLD_SCALE;
                                
                                // Calculate max columns and rows that fit (with margins)
                                const marginX = 2.5 * containerWidth;
                                const marginZ = 3.5 * containerDepth;
                                const availableWidth = tileWidth - marginX;
                                const availableDepth = tileDepth - marginZ;
                                const maxCols = Math.max(1, Math.floor(availableWidth / spacingX) + 1);
                                const maxRows = Math.max(1, Math.floor(availableDepth / spacingZ) + 1);
                                const maxFit = maxCols * maxRows * 5; // 5 levels max

                                // Deterministic random count per tile between 20 and available capacity
                                const rand = seededRandom(tileId);
                                const min = Math.min(100, maxFit); // Ensure min doesn't exceed capacity
                                const max = Math.min(maxFit, yardContainers.length);
                                const count = max > 0 ? Math.max(min, Math.floor(rand() * (max - min + 1)) + min) : 0;

                                // Filter containers to only those within the calculated capacity
                                const visibleContainers = yardContainers.filter((c, idx) => {
                                    if (idx >= count) return false;
                                    // Calculate which row this container is in (based on position)
                                    const rowNum = Math.floor((c.position[2] + spacingZ) / spacingZ);
                                    return rowNum < maxRows;
                                });

                                tiles.push(
                                    <group key={tileId}>
                                        <YardModel
                                            position={tileCenter}
                                            size={[tileWidth, el.size[1], tileDepth]}
                                            label={el.name}
                                        />
                                        {/* Containers centered on this tile, limited by yard capacity */}
                                        {visibleContainers.map(c => (
                                            <ContainerModel
                                                key={`${tileId}-${c.id}`}
                                                position={[
                                                    // start 1.5 containers in from the left edge
                                                    tileCenter[0] - tileWidth / 2 + 2.5 * (c.size[0] ?? 0) + c.position[0],
                                                    // Place containers on top of yard surface
                                                    tileCenter[1] + YARD_SURFACE_Y_OFFSET + (c.position[1] ?? 0),
                                                    // start 1.5 containers in from the top edge
                                                    tileCenter[2] - tileDepth / 2 + 3.5 * (c.size[2] ?? 0) + c.position[2],
                                                ]}
                                                size={c.size}
                                                textureUrl={c.textureUrl}
                                            />
                                        ))}
                                    </group>
                                );
                            }
                        }

                        return <group key={el.id}>{tiles}</group>;
                    }
                    case 'land':
                        return <LandModel key={el.id} position={el.position} size={el.size} isMiddle={el.id === middleLandId} />;
                    case 'water':
                        return <WaterModel key={el.id} position={el.position} size={el.size} />;
                    case 'building':
                        return <BuildingModel key={el.id} position={el.position} size={el.size} label={el.name} />;
                    default:
                        return null;
                }
            })}

            {/* Static demo yard + containers when backend does not provide any yard */}
            {!hasBackendYards && (() => {
                const demoYardId = 'DEMO_YARD_1';
                const demoYardCenter: [number, number, number] = [0 * WORLD_SCALE, 0, 10 * WORLD_SCALE];
                const totalWidth = 40 * WORLD_SCALE;
                const totalDepth = 25 * WORLD_SCALE;
                const tileCols = 2; // split big yard into 2 tiles along X
                const tileRows = 2; // and 2 tiles along Z -> 4 smaller yards
                const gap = 1 * WORLD_SCALE; // small gap between tiles
                const rawTileWidth = totalWidth / tileCols;
                const rawTileDepth = totalDepth / tileRows;
                const tileWidth = rawTileWidth - gap;
                const tileDepth = rawTileDepth - gap;

                // Pre-generate container pattern once (local positions) to reuse for each tile
                const baseContainers = generateYardContainers(demoYardId);

                const tiles: React.ReactElement[] = [];
                let tileIndex = 0;

                for (let r = 0; r < tileRows; r++) {
                    for (let c = 0; c < tileCols; c++) {
                        tileIndex++;
                        const id = `${demoYardId}_T${tileIndex}`;
                        const offsetX = (c - (tileCols - 1) / 2) * rawTileWidth;
                        const offsetZ = (r - (tileRows - 1) / 2) * rawTileDepth;
                        const tileCenter: [number, number, number] = [
                            demoYardCenter[0] + offsetX,
                            demoYardCenter[1],
                            demoYardCenter[2] + offsetZ,
                        ];

                        // Calculate max containers that fit in this demo tile
                        const spacingX = 3.0 * WORLD_SCALE;
                        const spacingZ = 2.6 * WORLD_SCALE;
                        const containerWidth = 2.5 * WORLD_SCALE;
                        const containerDepth = 1.2 * WORLD_SCALE;
                        
                        // Calculate max columns and rows that fit (with margins)
                        const marginX = 1.5 * containerWidth;
                        const marginZ = 1.5 * containerDepth;
                        const availableWidth = tileWidth - marginX;
                        const availableDepth = tileDepth - marginZ;
                        const maxCols = Math.max(1, Math.floor(availableWidth / spacingX) + 1);
                        const maxRows = Math.max(1, Math.floor(availableDepth / spacingZ) + 1);
                        const maxFit = maxCols * maxRows * 5; // 5 levels max

                        const rand = seededRandom(id);
                        const min = Math.min(100, maxFit); // Ensure min doesn't exceed capacity
                        const max = Math.min(maxFit, baseContainers.length);
                        const count = max > 0 ? Math.max(min, Math.floor(rand() * (max - min + 1)) + min) : 0;

                        // Filter containers to only those within the calculated capacity
                        const visibleDemoContainers = baseContainers.filter((c, idx) => {
                            if (idx >= count) return false;
                            const rowNum = Math.floor((c.position[2] + spacingZ) / spacingZ);
                            return rowNum < maxRows;
                        });

                        tiles.push(
                            <group key={id}>
                                <YardModel
                                    position={tileCenter}
                                    size={[tileWidth, 0.5 * WORLD_SCALE, tileDepth]}
                                    label={`Demo Yard ${tileIndex}`}
                                />
                                {visibleDemoContainers.map(cObj => (
                                    <ContainerModel
                                        key={`${id}-${cObj.id}`}
                                        position={[
                                            // start 1.5 containers in from the left edge
                                            tileCenter[0] - tileWidth / 2 + 1.5 * (cObj.size[0] ?? 0) + cObj.position[0],
                                            // Place containers on top of yard surface
                                            tileCenter[1] + YARD_SURFACE_Y_OFFSET + (cObj.position[1] ?? 0),
                                            // start 1.5 containers in from the top edge
                                            tileCenter[2] - tileDepth / 2 + 1.5 * (cObj.size[2] ?? 0) + cObj.position[2],
                                        ]}
                                        size={cObj.size}
                                        textureUrl={cObj.textureUrl}
                                    />
                                ))}
                            </group>
                        );
                    }
                }

                return <group>{tiles}</group>;
            })()}

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
