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
    const [intensity, setIntensity] = React.useState(0);
    const targetIntensity = useRef(1500);
    const debugMode = false; // Set to true to show debug sphere

    React.useEffect(() => {
        console.log('🔦 DynamicSpotlight component mounted with target:', target);
        // Fade in spotlight
        setIntensity(0);
        targetIntensity.current = 1500;
    }, [target]);

    useFrame((_state, delta) => {
        if (spotlightRef.current) {
            // Update spotlight position to follow camera
            spotlightRef.current.position.copy(camera.position);
            // Update spotlight target to the selected element
            spotlightRef.current.target.position.set(target[0], target[1], target[2]);
            spotlightRef.current.target.updateMatrixWorld();

            // Smooth intensity transition
            const diff = targetIntensity.current - intensity;
            if (Math.abs(diff) > 1) {
                const newIntensity = intensity + diff * delta * 5; // Smooth fade
                setIntensity(newIntensity);
                spotlightRef.current.intensity = newIntensity;
            }
        }
    });

    return (
        <>
            <spotLight
                ref={spotlightRef}
                intensity={intensity}
                angle={Math.PI / 4} // Wide beam
                penumbra={0.5} // Visible penumbra for soft edges
                distance={1000}
                decay={1}
                castShadow={false} // Disable shadows for better performance
                color="#ffffff" // Bright white
            />
            {/* Debug sphere - only visible in debug mode */}
            {debugMode && (
                <mesh position={target}>
                    <sphereGeometry args={[2, 16, 16]} />
                    <meshBasicMaterial color="red" opacity={0.5} transparent={true} />
                </mesh>
            )}
        </>
    );
};

// SelectionHighlight Component with pulsating glow effect
const SelectionHighlight: React.FC<{
    size: [number, number, number];
    isSelected: boolean;
    elementType?: string;
}> = ({ size, isSelected, elementType }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Determine color based on element type
    const getHighlightColor = () => {
        if (!isSelected) return "#ffffff"; // White for hover
        
        switch (elementType) {
            case 'vessel':
                return "#00bfff"; // Deep sky blue
            case 'dock':
                return "#00ff00"; // Green
            case 'resource':
                return "#ff8c00"; // Dark orange
            case 'yard':
            case 'building':
                return "#ffd700"; // Gold
            default:
                return "#00ff00"; // Default green
        }
    };

    // Pulsating animation for selected elements
    useFrame((_state) => {
        if (meshRef.current && isSelected) {
            // Keep mesh transparent - edges provide the visual feedback
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
            // TODO: Implement pulsating effect on edges in future update
        }
    });

    return (
        <mesh ref={meshRef} renderOrder={1000}>
            <boxGeometry args={[size[0] * 1.05, size[1] * 1.05, size[2] * 1.05]} />
            <meshBasicMaterial
                color="black"
                transparent={true}
                opacity={0}
                depthWrite={false}
            />
            <Edges
                scale={1}
                threshold={15}
                color={getHighlightColor()}
                toneMapped={false}
            />
        </mesh>
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
                {/* Linha de conexão animada - VERDE */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-t from-green-500 to-transparent translate-y-full" />

                {/* Card Principal - Borda e Sombra VERDES */}
                <div className="bg-slate-900/90 backdrop-blur-md border-l-4 border-green-500 text-white p-4 rounded-r-lg shadow-[0_0_20px_rgba(34,197,94,0.5)] pointer-events-auto">
                    <div className="flex justify-between items-start mb-2">
                        {/* Badge do Tipo - VERDE */}
                        <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold border border-green-500/30 px-1 rounded">
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

                    {/* Botão de Ação - VERDE */}
                    <button className="w-full bg-green-600 hover:bg-green-500 text-xs py-1.5 rounded transition-colors font-medium">
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
    onSelect?: (position: [number, number, number], id?: string, size?: [number, number, number]) => void;
    onElementInfo?: (info: { type: 'vessel' | 'dock' | 'yard' | 'building' | 'resource'; id: string; name?: string }) => void;
    isSelected?: boolean;
    size?: [number, number, number];
    onDeselect?: () => void;
}> = ({ position, elementType, elementId, elementName, isSelected, size, children, onSelect, onElementInfo, onDeselect }) => {

    const [hovered, setHover] = React.useState(false);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Efeito para cursor (Mãozinha quando passa por cima)
    React.useEffect(() => {
        if (hovered) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
        return () => { document.body.style.cursor = 'auto'; };
    }, [hovered]);

    // Show tooltip after brief hover delay
    React.useEffect(() => {
        if (hovered && !isSelected) {
            hoverTimeoutRef.current = setTimeout(() => {
                setShowTooltip(true);
            }, 500); // Show after 500ms hover
        } else {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            setShowTooltip(false);
        }
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, [hovered, isSelected]);

    const handleClick = (e: any) => {
        if (e.button !== undefined && e.button !== 0) return;

        // Bloqueio de cliques na UI (botões, painéis)
        const cx = (e.clientX ?? e.nativeEvent?.clientX) || 0;
        const cy = (e.clientY ?? e.nativeEvent?.clientY) || 0;
        const topEl = (typeof document !== 'undefined' && document.elementFromPoint) ? document.elementFromPoint(cx, cy) : null;
        if (topEl && topEl.closest && topEl.closest('[data-ui], .ui, .modal, .panel')) return;

        e.stopPropagation();

        if (onSelect) onSelect(position, elementId, size);
        if (onElementInfo && elementType && elementId) onElementInfo({ type: elementType, id: elementId, name: elementName });
    };
 
    return (
        <group
            onClick={handleClick}
            onPointerDown={handleClick}
            onPointerOver={(e: any) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={() => { setHover(false); }}
        >
            {/* O Elemento 3D Real (Navio, Contentor, etc.) */}
            {children}

            {/* A CAIXA DE LINHAS */}
            {(isSelected || hovered) && size && (
                <SelectionHighlight 
                    size={size} 
                    isSelected={isSelected || false} 
                    elementType={elementType}
                />
            )}

            {/* Hover Tooltip (Shows on hover, before click) */}
            {showTooltip && !isSelected && size && (
                <Html
                    position={[0, size[1] + 2, 0]}
                    center
                    distanceFactor={10}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap opacity-90">
                        <div className="font-semibold">{elementName || "Unknown"}</div>
                        <div className="text-gray-400 text-[10px] mt-0.5">{elementType || "object"}</div>
                        <div className="text-gray-500 text-[9px] mt-1">Click to select</div>
                    </div>
                </Html>
            )}

            {/* Info Card (Só aparece se estiver clicado/selecionado) */}
            {isSelected && size && (
                <group position={[0, size[1] + 6, 0]}>
                    <InfoCard
                        title={elementName || "Sem Nome"}
                        id={elementId || "N/A"}
                        type={elementType || "Object"}
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
    
    // Camera view mode state: 'isometric' or 'topdown'
    const [cameraViewMode, setCameraViewMode] = React.useState<'isometric' | 'topdown'>('isometric');
    
    // State for showing the view mode indicator
    const [showViewModeIndicator, setShowViewModeIndicator] = React.useState(false);
    const viewModeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Handler for element selection
    const handleElementSelect = React.useCallback((position: [number, number, number], id?: string,  size?: [number, number, number]) => {
        console.log(`🎯 Element selected at [${position.join(', ')}]`);
        setSelectedElement(position);
        setSelectedId(id || null);

        // 1. Calcular o tamanho do objeto
        const maxDimension = size ? Math.max(size[0], size[1], size[2]) : 5;

        // 2. Definimos a distância. 
        // Multiplicador 2.5x para garantir que vemos a grua toda de lado.
        const distance = Math.max(maxDimension * 1.0, 15);

        // 3. Definir Altura (Y)
        // Mantemos baixo (10% da distância ou mínimo de 5) para ser "Horizontal"
        const height = Math.max(distance * 0.3, 5);

        // 4. Cálculo das Coordenadas 
        const newCameraPos: [number, number, number] = [
            position[0], // Afasta apenas no eixo X (Visão Lateral/Perpendicular)
            position[1] + height,   // Sobe ligeiramente
            position[2]+ distance     // Mantém o Z exato do objeto (Alinhamento Perfeito)
        ];

        setTargetCameraPosition(newCameraPos);
        setTargetCameraLookAt(position);

        console.log(`📹 Camera moving to Perpendicular View: [${newCameraPos.join(', ')}]`);
    }, []);

    // Função para fechar o card (passar para o ClickableElement)
    const handleDeselect = React.useCallback(() => {
        setSelectedId(null);            // Limpa seleção (fecha UI)
        setSelectedElement(null);       // Apaga luz/highlight
        
        // Show indicator
        setShowViewModeIndicator(true);
        if (viewModeTimeoutRef.current) {
            clearTimeout(viewModeTimeoutRef.current);
        }
        viewModeTimeoutRef.current = setTimeout(() => {
            setShowViewModeIndicator(false);
        }, 3000);
        
        // Contextual Reset: Toggle between Isometric and Top-Down views
        if (cameraViewMode === 'isometric') {
            // Switch to Top-Down (Blueprint) view
            console.log('📹 Switching to TOP-DOWN (Blueprint) view');
            setTargetCameraPosition([0, 100, 0]); // Directly above, high altitude
            setTargetCameraLookAt([0, 0, 0]);
            setCameraViewMode('topdown');
        } else {
            // Switch to Isometric (Standard Overview) view
            console.log('📹 Switching to ISOMETRIC (Standard Overview) view');
            setTargetCameraPosition([0, 60, 80]); // 45-degree angle view
            setTargetCameraLookAt([0, 0, 0]);
            setCameraViewMode('isometric');
        }
    }, [cameraViewMode]);

    // Keyboard shortcuts handler
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Escape key - deselect current element
            if (event.key === 'Escape') {
                if (selectedId) {
                    console.log('⌨️ Escape pressed - deselecting element');
                    handleDeselect();
                }
            }
            
            // 'r' key - reset camera to initial position
            if (event.key === 'r' || event.key === 'R') {
                console.log('⌨️ R pressed - resetting camera');
                handleDeselect();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedId, handleDeselect]);

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
                duration={1.5}
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
        
        {/* Camera View Mode Indicator Button - Only visible temporarily after view change */}
        {showViewModeIndicator && (
            <div
                className="absolute bottom-4 left-4 z-10 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg px-4 py-3 flex items-center gap-2 shadow-2xl animate-fade-in pointer-events-none"
                style={{
                    animation: 'fadeIn 0.3s ease-in-out'
                }}
            >
                {cameraViewMode === 'topdown' ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <span className="text-sm font-semibold">Top-Down View</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm font-semibold">Isometric View</span>
                    </>
                )}
            </div>
        )}
        {/* Keyboard Shortcuts Help Button */}
        <KeyboardShortcutsHelp />
        </div>
    );
};

// Keyboard Shortcuts Help Component
const KeyboardShortcutsHelp: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            {/* Help Button - Animado e Atrativo */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute bottom-4 right-4 z-10 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 animate-pulse hover:animate-none group"
                title="Keyboard Shortcuts (Press ?)"
            >
                <span className="text-xl font-bold group-hover:rotate-12 transition-transform duration-300">?</span>
            </button>

            {/* Help Overlay - Design Moderno com Animações */}
            {isOpen && (
                <div 
                    className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300" 
                    onClick={() => setIsOpen(false)}
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                >
                    <div 
                        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl max-w-2xl w-full m-4 overflow-hidden transform transition-all duration-300" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'slideUp 0.3s ease-out' }}
                    >
                        {/* Header com Gradiente e Ícone */}
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 px-6 py-5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-bold text-xl tracking-wide">Keyboard Shortcuts</h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Content com Seções Organizadas */}
                        <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto">
                            {/* Mouse Controls Section */}
                            <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                        </svg>
                                    </div>
                                    <h4 className="text-gray-800 font-semibold text-base">Mouse Controls</h4>
                                </div>
                                <div className="space-y-2">
                                    <ShortcutRow shortcut="Left Click" description="Select object" icon="cursor" />
                                    <ShortcutRow shortcut="Right Click + Drag" description="Rotate camera" icon="rotate" />
                                    <ShortcutRow shortcut="Middle Click + Drag" description="Pan camera" icon="move" />
                                    <ShortcutRow shortcut="Scroll Wheel" description="Zoom in/out" icon="zoom" />
                                </div>
                            </div>
                            
                            {/* Keyboard Controls Section */}
                            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-gray-800 font-semibold text-base">Keyboard Controls</h4>
                                </div>
                                <div className="space-y-2">
                                    <ShortcutRow shortcut="i" description="Toggle info overlay" icon="info" />
                                    <ShortcutRow shortcut="Escape" description="Deselect object" icon="escape" />
                                    <ShortcutRow shortcut="r" description="Reset camera" icon="reset" />
                                    <ShortcutRow shortcut="?" description="Show this help" icon="help" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer com Gradiente */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 flex justify-end border-t border-blue-100">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const ShortcutRow: React.FC<{ shortcut: string; description: string; icon?: string }> = ({ shortcut, description, icon }) => {
    const getIcon = () => {
        switch(icon) {
            case 'cursor':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>;
            case 'rotate':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
            case 'move':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
            case 'zoom':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>;
            case 'info':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'escape':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
            case 'reset':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
            case 'help':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            default:
                return null;
        }
    };
    
    return (
        <div className="flex justify-between items-center group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2.5 rounded-lg transition-all">
            <div className="flex items-center gap-2">
                {icon && (
                    <div className="text-blue-600 group-hover:text-purple-600 transition-colors">
                        {getIcon()}
                    </div>
                )}
                <kbd className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 group-hover:border-blue-400 rounded-lg text-sm font-mono font-semibold text-gray-700 shadow-sm group-hover:shadow-md transition-all">
                    {shortcut}
                </kbd>
            </div>
            <span className="text-gray-600 text-sm font-medium ml-4">{description}</span>
        </div>
    );
};

export default PortScene;
