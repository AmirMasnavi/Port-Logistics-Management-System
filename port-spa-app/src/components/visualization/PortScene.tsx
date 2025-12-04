import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Sky, Html, Edges} from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { CargoShipModel } from "./CargoShipModel";
import { ContainerModel } from './ContainerModel';
import type { LayoutElement, RenderableVessel, RenderableResource, RenderableContainer } from '../../domain/types';
import {
    DockModel, LandModel, WaterModel, YardModel, BuildingModel,
    STSCraneModel, YardCraneModel
} from './models';
import { useMemo, useRef } from 'react';
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
                (child as any).userData.pickable = true;
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
    onElementSelect?: (elementInfo: { type: 'vessel' | 'dock' | 'yard' | 'building' | 'resource'; id: string; name?: string }) => void;
}

// Camera Animator Component - Smoothly moves camera to target position
const CameraAnimator: React.FC<{
    targetPosition: [number, number, number] | null;
    targetLookAt: [number, number, number] | null;
    duration?: number; // Duration in seconds (configurable)
    onComplete?: () => void;
}> = ({ targetPosition, targetLookAt, duration = 1.5, onComplete }) => {
    const { camera, controls } = useThree();
    const animationProgress = useRef(0);
    const startPosition = useRef(new THREE.Vector3());
    const startLookAt = useRef(new THREE.Vector3());
    const finalTargetPosition = useRef(new THREE.Vector3());
    const isAnimating = useRef(false);

    // Start animation when target changes
    React.useEffect(() => {
        if (targetLookAt) {
            console.log('🎬 Starting camera animation');
            startPosition.current.copy(camera.position);
            
            // Get current lookAt from controls if available
            if (controls && (controls as any).target) {
                startLookAt.current.copy((controls as any).target);
            } else {
                // Fallback: calculate lookAt from camera direction
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);
                startLookAt.current.copy(camera.position).add(direction.multiplyScalar(10));
            }

            if (targetPosition) {
                finalTargetPosition.current.set(...targetPosition);
            } else {
                // Cálculo de Panning Horizontal (Preserva o zoom/altura atual)
                const currentOffset = new THREE.Vector3().subVectors(camera.position, startLookAt.current);
                finalTargetPosition.current.set(targetLookAt[0], targetLookAt[1], targetLookAt[2]).add(currentOffset);

                console.log('🎬 Horizontal Repositioning calculated');

            }
            
            animationProgress.current = 0;
            isAnimating.current = true;
        }
    }, [targetPosition, targetLookAt, camera, controls]);

    useFrame((_state, delta) => {
        if (!isAnimating.current || !targetPosition || !targetLookAt) return;

        // Update animation progress
        animationProgress.current += delta / duration;

        if (animationProgress.current >= 1) {
            // Animation complete
            animationProgress.current = 1;
            isAnimating.current = false;
            if (onComplete) onComplete();
        }

        // Easing function: easeInOutCubic for smooth acceleration and deceleration
        const easeInOutCubic = (t: number): number => {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const t = easeInOutCubic(animationProgress.current);

        // Interpolate camera position
        camera.position.lerpVectors(
            startPosition.current,
            finalTargetPosition.current,
            t
        );

        // Interpolate lookAt target
        const currentLookAt = new THREE.Vector3().lerpVectors(
            startLookAt.current,
            new THREE.Vector3(...targetLookAt),
            t
        );

        // Update camera to look at the target
        camera.lookAt(currentLookAt);

        // Update controls target if available
        if (controls && (controls as any).target) {
            (controls as any).target.copy(currentLookAt);
            (controls as any).update();
        }
    });

    return null; // This component doesn't render anything
};

// Dynamic Spotlight Component that follows the camera
const DynamicSpotlight: React.FC<{
    target: [number, number, number];
}> = ({ target }) => {
    const spotlightRef = useRef<THREE.SpotLight>(null);
    const { camera } = useThree();

    React.useEffect(() => {
        console.log('🔦 DynamicSpotlight component mounted with target:', target);
    }, []);

    useFrame(() => {
        if (spotlightRef.current) {
            // Update spotlight position to follow camera
            spotlightRef.current.position.copy(camera.position);
            // Update spotlight target to the selected element
            spotlightRef.current.target.position.set(target[0], target[1], target[2]);
            spotlightRef.current.target.updateMatrixWorld();
        }
    });

    return (
        <>
            <spotLight
                ref={spotlightRef}
                intensity={1500} // DRAMATICALLY increased for clear highlighting
                angle={Math.PI / 4} // Wide beam
                penumbra={0.5}
                distance={1000}
                decay={1}
                castShadow={false} // Disable shadows for better performance
                color="#ffffff" // Bright white
            />
            {/* Debug sphere to show target position - LARGE and RED */}
            <mesh position={target}>
                <sphereGeometry args={[5, 16, 16]} />
                <meshBasicMaterial color="red" opacity={1} transparent={false} />
            </mesh>
        </>
    );
};

const InfoCard: React.FC<{
    title?: string;
    id?: string;
    type: string;
    onClose: () => void;
}> = ({ title, id, type, onClose }) => {
    return (
        <Html center distanceFactor={15} zIndexRange={[100, 0]}>
            <div className="pointer-events-none select-none min-w-[200px] transform transition-all duration-300 origin-bottom hover:scale-105">
                {/* Linha de conexão animada */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-t from-blue-500 to-transparent translate-y-full" />

                {/* Card Principal com efeito Glassmorphism */}
                <div className="bg-slate-900/90 backdrop-blur-md border-l-4 border-blue-500 text-white p-4 rounded-r-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] pointer-events-auto">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold border border-blue-500/30 px-1 rounded">
                            {type}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <h3 className="font-bold text-lg leading-tight mb-1">{title || 'Unknown Asset'}</h3>
                    <p className="text-xs text-gray-400 font-mono mb-3">ID: {id}</p>

                    {/* Botão de Ação Fake - Para dar aspeto funcional */}
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-xs py-1.5 rounded transition-colors font-medium">
                        View Manifest
                    </button>
                </div>
            </div>
        </Html>
    );
};

// Clickable wrapper for elements to handle selection
const ClickableElement: React.FC<{
    position: [number, number, number];
    elementType?: 'vessel' | 'dock' | 'yard' | 'building' | 'resource';
    elementId?: string;
    elementName?: string;
    children: React.ReactNode;
    onSelect?: (position: [number, number, number], id?: string, size?: [number, number, number]) => void;    onElementInfo?: (info: { type: 'vessel' | 'dock' | 'yard' | 'building' | 'resource'; id: string; name?: string }) => void;
    isSelected?: boolean;                 
    size?: [number, number, number];
    // Função para limpar seleção
    onDeselect?: () => void;
}> = ({ position, elementType, elementId, elementName, isSelected, size, children, onSelect, onElementInfo, onDeselect }) => {

    const [hovered, setHover] = React.useState(false);

    // Efeito para gerir o cursor de forma limpa (evita conflitos e "flickering")
    React.useEffect(() => {
        if (hovered) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
        // Limpeza quando o componente desmonta ou o hover muda
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered]);
    
    const handleClick = (e: any) => {
        // Only respond to LEFT mouse button (button === 0)
        if (e.button !== undefined && e.button !== 0) {
            console.log('🖱️ Ignoring non-LMB click (button:', e.button, ')');
            return;
        }
        
        console.log('🖱️ LMB CLICK detected at', position);

        // IGNORE clicks over DOM UI elements (adjust selector to your UI)
        const cx = (e.clientX ?? e.nativeEvent?.clientX) || 0;
        const cy = (e.clientY ?? e.nativeEvent?.clientY) || 0;
        const topEl = (typeof document !== 'undefined' && document.elementFromPoint) ? document.elementFromPoint(cx, cy) : null;
        if (topEl && topEl.closest && topEl.closest('[data-ui], .ui, .modal, .panel')) {
            console.log('Ignored click over UI element');
            return;
        }
        
        e.stopPropagation();
        
        if (onSelect) {
            onSelect(position, elementId, size);
        }
        
        // Call element info callback if available and we have element details
        if (onElementInfo && elementType && elementId) {
            console.log('📋 Calling onElementInfo with:', { type: elementType, id: elementId, name: elementName });
            onElementInfo({ type: elementType, id: elementId, name: elementName });
        }
    };

    return (
        <group 
            onClick={handleClick}
            onPointerDown={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={() => { setHover(false); }}
        >
            {children}
            {(isSelected || hovered) && size && (
                <mesh>
                    <boxGeometry args={[size[0], size[1], size[2]]} />
                    <meshBasicMaterial visible={false} />
                    <Edges
                        scale={1.0}
                        threshold={15}
                        color={isSelected ? "#3b82f6" : "#ffffff"}
                        renderOrder={1000}
                    />
                </mesh>
            )}
            {isSelected && size && elementType && (
                <group position={[0, size[1] / 2, 0]}>
                    <InfoCard
                        title={elementName}
                        id={elementId}
                        type={elementType}
                        onClose={() => onDeselect && onDeselect()}
                    />
                </group>
            )}
        </group>    
    );
};

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

const PortScene: React.FC<PortSceneProps> = ({ layoutElements, vessels, resources, containers, onElementSelect }) => {
    // 🚢 DEBUG: Log props received by PortScene
    console.log('🎬 ========== PortScene RENDER ==========');
    console.log('🎬 PortScene received props:');
    console.log('  - layoutElements count:', layoutElements.length);
    console.log('  - vessels count:', vessels.length);
    console.log('  - resources count:', resources.length);
    console.log('  - containers count:', containers?.length || 0);
    console.log('🚢 Vessels array received:', vessels);
    
    if (vessels.length > 0) {
        console.log('🚢 First vessel details:', vessels[0]);
        vessels.forEach((v, idx) => {
            console.log(`🚢 Vessel ${idx + 1}:`, {
                id: v.id,
                name: v.name,
                imo: v.imo,
                position: v.position,
                size: v.size,
                rotation: v.rotation,
                modelUrl: v.modelUrl
            });
        });
    } else {
        console.warn('⚠️ PortScene received ZERO vessels!');
    }
    
    // 1. State for the time of day (0 to 24 hours)
    const [hour, setHour] = React.useState(12); // Start at noon
    const [isPanelHovered, setIsPanelHovered] = React.useState(false);
    const [isCompactMode, setIsCompactMode] = React.useState(true); // Start in compact mode
    
    // 2. Calculate Sun Position based on hour
    // This moves the sun in an arc over the scene
    const sunPosition = React.useMemo(() => {
        const angle = ((hour - 6) / 12) * Math.PI; // Map 6am-6pm to 0-PI radians
        const x = Math.cos(angle) * 100;
        const y = Math.sin(angle) * 100;
        return [x, Math.max(y, -10), 50] as [number, number, number]; // Keep z fixed mostly
    }, [hour]);
    // 3. Determine if it is night time (simplified logic)
    const isNight = hour < 6 || hour > 18;
    // 4. Sun Color (Warm at sunset, White at noon, Dark at night)
    const lightIntensity = React.useMemo(() => {
        if (isNight) return 0; // Sun is off at night
        // Peak intensity at noon (hour 12), lower at 6 and 18
        return Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI) * 2);
    }, [hour, isNight]);
    // 5. Ambient light color (Much darker at night for realistic darkness)
    const ambientIntensity = isNight ? 0.15 : 0.5; // Much darker at night!
    const ambientColor = isNight ? "#0a0f1a" : "#ffffff"; // Almost black-blue for night
        
    // Safe default for containers until backend integration is wired
    const containerList = containers ?? [];

    // Selection state for dynamic spotlight
    const [selectedElement, setSelectedElement] = React.useState<[number, number, number] | null>(null);
    const [selectedId, setSelectedId] = React.useState<string | null>(null); 

    // Camera animation state
    const [targetCameraPosition, setTargetCameraPosition] = React.useState<[number, number, number] | null>(null);
    const [targetCameraLookAt, setTargetCameraLookAt] = React.useState<[number, number, number] | null>(null);

    // Handler for element selection
    const handleElementSelect = React.useCallback((position: [number, number, number], id?: string,  size?: [number, number, number]) => {
        console.log(`🎯 Element selected at [${position.join(', ')}]`);
        setSelectedElement(position);
        setSelectedId(id || null); // Guardar ID

        const maxDimension = size ? Math.max(size[0], size[1], size[2]) : 10;

        // 2. Calcular distância:
        // Objetos pequenos precisam de zoom (min 15 un)
        // Objetos grandes (navios) precisam de espaço (multiplicador 2.0x a 3.0x)
        const distanceMultiplier = 2.5;
        const minDistance = 20;
        const targetDistance = Math.max(maxDimension * distanceMultiplier, minDistance);

        // 3. Definir ângulo de visualização "Cinemático"
        // Olha de "cima e de lado" (Isometric-ish)
        const angleY = Math.PI / 4; // 45 graus vertical
        const angleX = Math.PI / 4; // 45 graus horizontal

        // Calcular offset baseado na distância esférica
        const offsetX = Math.sin(angleX) * Math.cos(angleY) * targetDistance;
        const offsetY = Math.sin(angleY) * targetDistance;
        const offsetZ = Math.cos(angleX) * Math.cos(angleY) * targetDistance;
              
        const newCameraPos: [number, number, number] = [
            position[0] + offsetX,
            position[1] + offsetY,
            position[2] + offsetZ
        ];
        
        setTargetCameraPosition(newCameraPos);
        setTargetCameraLookAt(position);
        
        console.log(`📹 Camera will move to [${newCameraPos.join(', ')}] looking at [${position.join(', ')}]`);
    }, []);

    // Função para fechar o card (passar para o ClickableElement)
    const handleDeselect = React.useCallback(() => {
        setSelectedId(null);
        setSelectedElement(null);
        setTargetCameraPosition([0, 60, 80]); 
        setTargetCameraLookAt([0, 0, 0]);
    }, []);

    // Debug: Log when selectedElement changes
    React.useEffect(() => {
        if (selectedElement) {
            console.log(`✅ Spotlight activated at [${selectedElement.join(', ')}]`);
        } else {
            console.log(`❌ No element selected`);
        }
    }, [selectedElement]);

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
        () => {
            console.log(`🎨 PortScene: Scaling ${vessels.length} vessels for rendering`);
            const scaled = vessels.map(v => ({
                ...v,
                position: [
                    v.position[0] * WORLD_SCALE,
                    (v.position[1] - 3.5) * WORLD_SCALE,
                    v.position[2] * WORLD_SCALE,
                ] as [number, number, number],
                size: Array.isArray(v.size)
                    ? ([
                        v.size[0] * WORLD_SCALE,
                        v.size[1] * WORLD_SCALE,
                        v.size[2] * WORLD_SCALE,
                    ] as [number, number, number])
                    : (v.size ?? 0.5) * WORLD_SCALE,
            }));
            console.log(`🎨 PortScene: Scaled vessels:`, scaled.map(v => ({ id: v.id, name: v.name, position: v.position })));
            return scaled;
        },
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
        <div className="relative w-full h-full">
            {/* --- COMPACT/DETAILED TIME PANEL WITH TOGGLE --- */}
            <div 
                className="absolute top-6 right-6 z-10 backdrop-blur-xl bg-gradient-to-br from-white/30 to-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out"
                onMouseEnter={() => setIsPanelHovered(true)}
                onMouseLeave={() => setIsPanelHovered(false)}
                style={{ 
                    opacity: isPanelHovered ? 1 : 0.3,
                    transform: isPanelHovered ? 'scale(1)' : 'scale(0.95)',
                    width: isCompactMode ? '180px' : '320px',
                }}
            >
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative p-4">
                    {/* COMPACT MODE */}
                    {isCompactMode ? (
                        <>
                            {/* Icon and Compact Time */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-2xl">
                                    {isNight ? "🌙" : hour >= 6 && hour <= 8 ? "🌅" : hour >= 17 && hour <= 19 ? "🌇" : "☀️"}
                                </div>
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {Math.floor(hour).toString().padStart(2, '0')}:{Math.floor((hour % 1) * 60).toString().padStart(2, '0')}
                                </div>
                            </div>

                            {/* Compact Slider */}
                            <input
                                type="range"
                                min="0"
                                max="24"
                                step="0.1"
                                value={hour}
                                onChange={(e) => setHour(parseFloat(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer mb-2"
                                style={{
                                    background: `linear-gradient(to right, 
                                        #1e3a8a 0%, 
                                        #3b82f6 12.5%, 
                                        #fbbf24 25%, 
                                        #f59e0b 50%, 
                                        #f97316 75%, 
                                        #1e40af 87.5%, 
                                        #1e3a8a 100%)`
                                }}
                            />

                            {/* Compact Status */}
                            <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                isNight ? 'bg-indigo-500/20 text-indigo-700' : 'bg-amber-500/20 text-amber-700'
                            }`}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
                                    backgroundColor: isNight ? '#6366f1' : '#f59e0b'
                                }}></span>
                                {isNight ? "Night" : "Day"}
                            </div>

                            {/* Expand Button */}
                            <button
                                onClick={() => setIsCompactMode(false)}
                                className="absolute -top-0.5 right-2 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                                title="Show details"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        /* DETAILED MODE */
                        <>
                            {/* Collapse Button */}
                            <button
                                onClick={() => setIsCompactMode(true)}
                                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                                title="Minimize"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>

                            {/* Icon and Title */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-3xl">
                                    {isNight ? "🌙" : hour >= 6 && hour <= 8 ? "🌅" : hour >= 17 && hour <= 19 ? "🌇" : "☀️"}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight">Time Control</h3>
                                    <p className="text-xs text-gray-600">
                                        {hour >= 0 && hour < 6 ? "Deep Night" : 
                                         hour >= 6 && hour < 8 ? "Sunrise" : 
                                         hour >= 8 && hour < 12 ? "Morning" : 
                                         hour >= 12 && hour < 17 ? "Afternoon" : 
                                         hour >= 17 && hour < 19 ? "Sunset" : "Night"}
                                    </p>
                                </div>
                            </div>

                            {/* Time Display */}
                            <div className="mb-4 text-center">
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {Math.floor(hour).toString().padStart(2, '0')}:{Math.floor((hour % 1) * 60).toString().padStart(2, '0')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">24-Hour Format</div>
                            </div>

                            {/* Slider with gradient track */}
                            <div className="relative mb-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="24"
                                    step="0.1"
                                    value={hour}
                                    onChange={(e) => setHour(parseFloat(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, 
                                            #1e3a8a 0%, 
                                            #3b82f6 12.5%, 
                                            #fbbf24 25%, 
                                            #f59e0b 50%, 
                                            #f97316 75%, 
                                            #1e40af 87.5%, 
                                            #1e3a8a 100%)`
                                    }}
                                />
                                {/* Time markers */}
                                <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                                    <span>00:00</span>
                                    <span>06:00</span>
                                    <span>12:00</span>
                                    <span>18:00</span>
                                    <span>24:00</span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                isNight 
                                    ? 'bg-indigo-500/20 text-indigo-700 border border-indigo-500/30' 
                                    : 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
                            }`}>
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{
                                    backgroundColor: isNight ? '#6366f1' : '#f59e0b'
                                }}></span>
                                {isNight ? "Street Lights Active" : "Sun Shadows Active"}
                            </div>
                        </>
                    )}

                    {/* Hint text */}
                    {!isPanelHovered && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-xs text-gray-600 font-medium bg-white/60 px-3 py-1 rounded-full">
                                Hover to adjust
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <Canvas className="w-full h-full" shadows camera={{ position: [0, 40, 50], fov: 50 }}   onPointerMissed={() => { handleDeselect(); console.log('Missed click - deselect'); }} >
                
                <Sky
                sunPosition={sunPosition}    
                />
                
                {/* PBR Reflections (Makes the water and metal cranes look AMAZING) */}
                <Environment preset="sunset" />

                <ambientLight intensity={ambientIntensity} color={ambientColor} />

                {/* The Sun */}
                <directionalLight
                    position={sunPosition}
                    intensity={lightIntensity}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    // Important: Stop shadows from being calculated when sun is "off" to save performance
                    visible={!isNight}
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
                            const dockSize: [number, number, number] = [adjustedLength, el.size[1], adjustedDepth];
                            dockSplits.push(
                                <ClickableElement
                                    key={`${el.id}_D${i + 1}`}
                                    position={splitPosition}
                                    elementType="dock"
                                    elementId={el.id}
                                    elementName={el.name}
                                    isSelected={selectedId === el.id}  
                                    size={dockSize}
                                    onSelect={handleElementSelect}
                                    onElementInfo={onElementSelect}
                                >
                                    <DockModel 
                                        position={splitPosition} 
                                        size={[adjustedLength, el.size[1], adjustedDepth]}
                                        label={`${el.name} ${i + 1}`}
                                        isNight={isNight}
                                    />
                                </ClickableElement>
                            );
                        }
                        return <group key={el.id}>{dockSplits}</group>;
                    }
                    case 'yard': {
                        const yardContainers = containersByYard.get(el.id) ?? generateYardContainers(el.id);

                        // NOTE: Each yard element (e.g., YARD-03-1) is already a subdivision from yardLayoutService
                        // Here we further divide each subdivision into 4 visual tiles (2x2 grid) for better organization
                        // This gives us visual separation within each subdivision
                        const tileCols = 1;
                        const tileRows = 1;
                        const gap = 1.5 * WORLD_SCALE;  // Small gap between tiles for visual separation
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
                                const tileSize: [number, number, number] = [tileWidth, el.size[1], tileDepth];

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
                                    <ClickableElement
                                        key={tileId}
                                        position={tileCenter}
                                        elementType="yard"
                                        elementId={el.id}
                                        elementName={el.name}
                                        isSelected={selectedId === el.id}
                                        size={tileSize}
                                        onSelect={handleElementSelect}
                                        onElementInfo={onElementSelect}
                                    >
                                        <group>
                                            <YardModel
                                                position={tileCenter}
                                                size={[tileWidth, el.size[1], tileDepth]}
                                                label={el.name}
                                                isNight={isNight}
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
                                    </ClickableElement>
                                );
                            }
                        }

                        return <group key={el.id}>{tiles}</group>;
                    }
                    case 'land':
                        return <LandModel key={el.id} position={el.position} size={el.size} isMiddle={el.id === middleLandId} isNight={isNight} />;
                    case 'water':
                        return <WaterModel key={el.id} position={el.position} size={el.size} />;
                    case 'building':
                        return (
                            <ClickableElement
                                key={el.id}
                                position={el.position}
                                elementType="building"
                                elementId={el.id}
                                elementName={el.name}
                                isSelected={selectedId === el.id} 
                                size={el.size}
                                onSelect={handleElementSelect}
                                onElementInfo={onElementSelect}
                                onDeselect={handleDeselect}
                            >
                                <BuildingModel position={el.position} size={el.size} label={el.name} rotation={el.rotation} />
                            </ClickableElement>
                        );
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
                            <ClickableElement
                                key={id}
                                position={tileCenter}
                                onSelect={handleElementSelect}
                            >
                                <group>
                                    <YardModel
                                        position={tileCenter}
                                        size={[tileWidth, 0.5 * WORLD_SCALE, tileDepth]}
                                        label={`Demo Yard ${tileIndex}`}
                                        isNight={isNight}
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
                            </ClickableElement>
                        );
                    }
                }

                return <group>{tiles}</group>;
            })()}

            {/* Render vessels: imported model if available, else use CargoShipModel */}
            {/* 2. Renderizar Navios nos seus locais */}
            {(() => {
                console.log(`🎨 About to render ${scaledVessels.length} vessels`);
                scaledVessels.forEach((v, idx) => {
                    console.log(`  Rendering vessel ${idx + 1}: id=${v.id}, name=${v.name}, position=[${v.position.join(', ')}], hasModel=${!!v.modelUrl}`);
                });
                return scaledVessels.map(v => (
                    <ClickableElement
                        key={v.id}
                        position={v.position}
                        elementType="vessel"
                        elementId={v.id}
                        elementName={v.name}
                        isSelected={selectedId === v.id}                         
                        size={Array.isArray(v.size) ? (v.size as [number, number, number]) : [v.size || 1, v.size || 1, v.size || 1]}
                        onSelect={handleElementSelect}
                        onElementInfo={onElementSelect}
                        onDeselect={handleDeselect}
                    >
                        {v.modelUrl ? (
                            <ImportedModel modelUrl={v.modelUrl} position={v.position} scale={v.size} />
                        ) : (
                            <CargoShipModel
                                position={v.position}
                                // vessels.size can be either a number or an array; pass it through or fallback to 0.5
                                scale={Array.isArray(v.size) ? (v.size as any) : (v.size ?? 0.5)}
                                rotation={v.rotation}
                            />
                        )}
                    </ClickableElement>
                ));
            })()}

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
                            <ClickableElement
                                key={`${r.id}-${r.code}`}
                                position={r.position}
                                elementType="resource"
                                elementId={r.code}
                                elementName={r.kind}
                                isSelected={selectedId === r.code} 
                                size={r.size}
                                onSelect={handleElementSelect}
                                onElementInfo={onElementSelect}
                                onDeselect={handleDeselect}
                            >
                                <group>
                                    <STSCraneModel position={r.position} size={r.size} label={r.kind} isNight={isNight} />
                                    {marker}
                                </group>
                            </ClickableElement>
                        );
                    }

                    if (area.type === 'yard') {
                        return (
                            <ClickableElement
                                key={`${r.id}-${r.code}`}
                                position={r.position}
                                elementType="resource"
                                elementId={r.code}
                                elementName={r.kind}
                                isSelected={selectedId === r.code} 
                                size={r.size}
                                onSelect={handleElementSelect}
                                onElementInfo={onElementSelect}
                                onDeselect={handleDeselect}
                            >
                                <group>
                                    <YardCraneModel position={r.position} size={r.size} label={r.kind} isNight={isNight} />
                                    {marker}
                                </group>
                            </ClickableElement>
                        );
                    }
                }
                return null;
            })}

            {/* Render dynamic spotlight for selected elements */}
            {selectedElement && (
                <DynamicSpotlight target={selectedElement} />
            )}

            {/* Camera animator for smooth transitions */}
            <CameraAnimator 
                targetPosition={targetCameraPosition}
                targetLookAt={targetCameraLookAt}
                duration={0.5}
                onComplete={() => {
                    console.log('🎬 Camera animation complete');
                    // Clear animation targets after completion
                    setTargetCameraPosition(null);
                    setTargetCameraLookAt(null);
                }}
            />

            <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.05}
                mouseButtons={{
                    LEFT: THREE.MOUSE.PAN,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.ROTATE,
                }}
                // Allow zooming further out for the larger world
                maxDistance={50 * WORLD_SCALE}
                minDistance={20}
                rotateSpeed={0.20}
                panSpeed={0.50}
            />
        </Canvas>
        </div>
    );
};

export default PortScene;
