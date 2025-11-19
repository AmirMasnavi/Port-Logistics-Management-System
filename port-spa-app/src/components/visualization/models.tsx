import React, { useEffect, useRef } from 'react';
import { useTexture, Text } from '@react-three/drei';
import { RepeatWrapping, ClampToEdgeWrapping, BufferAttribute, SRGBColorSpace, DoubleSide, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';


// Import texture assets from the local textures folder so Vite resolves them correctly
import concreteBaseUrl from './textures/Concrete_Base_Color.png';
import concreteNormalUrl from './textures/Concrete_Normal.png';
import concreteRoughnessUrl from './textures/Concrete_Roughness.png';
import concreteHeightUrl from './textures/Concrete_Height.png';
import concreteAoUrl from './textures/Concrete_AO.png';
import waterColorUrl from './textures/Water_002_COLOR.jpg';
import waterNormalUrl from './textures/Water_002_NORM.jpg';
import waterRoughnessUrl from './textures/Water_002_ROUGH.jpg';
import waterDisplacementUrl from './textures/Water_002_DISP.png';
import waterOccUrl from './textures/Water_002_OCC.jpg';
import dockBaseUrl from './textures/dock/Material _25_Base_Color.png';
import dockNormalUrl from './textures/dock/Material _25_Normal.png';
import dockRoughnessUrl from './textures/dock/Material _25_Roughness.png';
import dockHeightUrl from './textures/dock/Material _25_Height.png';
import dockMetallicUrl from './textures/dock/Material _25_Metallic.png';
import dockAoUrl from './textures/dock/Material _25_Mixed_AO.png';

// Import gantry crane textures for yard cranes
import gantryBaseUrl from './textures/gantryCrane/maquina_portico_BaseColor.png';
import gantryNormalUrl from './textures/gantryCrane/maquina_portico_Normal.png';
import gantryRoughnessUrl from './textures/gantryCrane/maquina_portico_Roughness.png';
import gantryMetallicUrl from './textures/gantryCrane/maquina_portico_Metallic.png';


// Dynamically import all Tower_crane textures and group them by material and map type.
// Filenames are expected like: Tower_crane_{MATERIAL}_{MapType}.png
const towerCraneFiles = import.meta.glob('./textures/Tower_crane*.png', { eager: true, as: 'url' }) as Record<string, string>;


// towerCraneByMaterial: { [MATERIAL]: { [MapType]: url } }
const towerCraneByMaterial: Record<string, Record<string, string>> = {};
Object.entries(towerCraneFiles).forEach(([path, url]) => {
    const fileName = path.split('/').pop() ?? path;
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    const rest = withoutExt.replace(/^Tower_crane_/, '');
    const parts = rest.split('_');
    const material = (parts.shift() ?? 'UNKNOWN').toUpperCase();
    const mapType = parts.join('_'); // e.g. BaseColor, Normal, Roughness, Metallic
    if (!towerCraneByMaterial[material]) towerCraneByMaterial[material] = {};
    towerCraneByMaterial[material][mapType] = url;
});

// Helper: return ordered URLs for common PBR slots for a given material
function getMaterialTextureUrls(material: string) {
    const m = towerCraneByMaterial[material] ?? {};
    return [
        m['BaseColor'] ?? m['Base'] ?? m['Albedo'] ?? m['COLOR'] ?? undefined,
        m['Normal'] ?? m['NORM'] ?? undefined,
        m['Roughness'] ?? m['ROUGH'] ?? m['R'] ?? undefined,
        m['Metallic'] ?? m['METALLIC'] ?? m['M'] ?? undefined,
        m['AO'] ?? m['AmbientOcclusion'] ?? undefined,
        m['Height'] ?? m['DISP'] ?? undefined,
    ].filter(Boolean) as string[];
}

// Provide a safe fallback URL for useTexture when a material has no maps
const defaultCraneUrl = Object.values(towerCraneFiles)[0] ?? concreteBaseUrl;


// Props base para qualquer modelo
type ModelProps = {
    position: [number, number, number];
    size: [number, number, number];
    color?: string;
    label?: string;
    rotation?: [number, number, number];
    isNight?: boolean; // NEW: Tell models if it's nighttime
};

// NEW: Street Lamp Component - Optimized for performance
const StreetLamp: React.FC<{ position: [number, number, number]; isNight: boolean }> = ({ position, isNight }) => {
    // Removed flickering animation for better performance
    
    return (
        <group position={position}>
            {/* Lamp Post - simplified geometry, no shadows */}
            <mesh position={[0, 6, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 12, 6]} /> {/* Reduced segments from 8 to 6 */}
                <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
            </mesh>
            
            {/* Lamp Head - simplified geometry, no shadows */}
            <mesh position={[0, 12, 0]}>
                <sphereGeometry args={[0.8, 12, 12]} /> {/* Reduced segments from 16 to 12 */}
                <meshStandardMaterial 
                    color={isNight ? "#ffaa00" : "#444"} 
                    emissive={isNight ? "#ffaa00" : "#000000"}
                    emissiveIntensity={isNight ? 3.0 : 0}
                    metalness={0.2}
                    roughness={0.4}
                />
            </mesh>
            
            {/* The actual light source - optimized settings */}
            {isNight && (
                <pointLight
                    position={[0, 12, 0]}
                    color="#ffcc66"
                    intensity={20} // Increased to compensate for fewer lights
                    distance={70} // Increased range
                    decay={2}
                    castShadow={false} // DISABLED shadows for performance
                />
            )}
        </group>
    );
};

// NEW: Red Warning Light - Like on tall buildings/cranes - MUCH BIGGER!
const RedWarningLight: React.FC<{ position: [number, number, number]; isNight: boolean }> = ({ position, isNight }) => {
    const lightRef = useRef<any>(null);
    const meshRef = useRef<any>(null);
    
    // Make it blink on/off like real warning lights
    useFrame(({ clock }) => {
        if (!isNight) return;
        const blink = Math.sin(clock.getElapsedTime() * 3) > 0;
        if (lightRef.current) {
            lightRef.current.intensity = blink ? 100 : 0; // 5x stronger (was 20)
        }
        if (meshRef.current && meshRef.current.material) {
            meshRef.current.material.emissiveIntensity = blink ? 8 : 1;
        }
    });
    
    return (
        <group position={position}>
            {/* Red sphere - MUCH BIGGER - no shadow casting for performance */}
            <mesh ref={meshRef} receiveShadow>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshStandardMaterial 
                    color="#ff0000"
                    emissive={isNight ? "#ff0000" : "#330000"}
                    emissiveIntensity={isNight ? 8 : 0}
                    metalness={0.3}
                    roughness={0.2}
                />
            </mesh>
            
            {/* The blinking red light - no shadows for performance */}
            {isNight && (
                <pointLight
                    ref={lightRef}
                    position={[0, 0, 0]}
                    color="#ff0000"
                    intensity={100}
                    distance={300}
                    decay={2}
                    castShadow={false} // No shadows for warning lights - improves performance
                />
            )}
        </group>
    );
};

// --- Componentes Específicos do Porto (mais detalhados) ---

// Dock: plataforma longa com alguns postes/bolardos
export const DockModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label, isNight = false }) => {
    const posts: number[] = [ -0.8, -0.4, 0, 0.4, 0.8 ];

    // Load dock textures
    const [dBase, dNormal, dRoughness, dHeight, dMetallic, dAo] = useTexture([
        dockBaseUrl,
        dockNormalUrl,
        dockRoughnessUrl,
        dockHeightUrl,
        dockMetallicUrl,
        dockAoUrl,
    ]);

    // Clone textures per instance
    const dockTextures = React.useMemo(() => ({
        base: dBase?.clone() ?? null,
        normal: dNormal?.clone() ?? null,
        roughness: dRoughness?.clone() ?? null,
        height: dHeight?.clone() ?? null,
        metallic: dMetallic?.clone() ?? null,
        ao: dAo?.clone() ?? null,
    }), [dBase, dNormal, dRoughness, dHeight, dMetallic, dAo]);

    // Dispose on unmount
    useEffect(() => {
        return () => {
            Object.values(dockTextures).forEach(t => t?.dispose());
        };
    }, [dockTextures]);

    // Use the size provided from layout: [depth, height, length]
    const dockDepth = size[0];      // X dimension (extends into water)
    const dockHeight = size[1];     // Y dimension (height)
    const dockLength = size[2];     // Z dimension (along pier)
    const widthScale = 1;
    const dockWidth = size[2] * widthScale;

    // Configure tiling
    const TILE_SCALE = 25;
    const repeatX = Math.max(1, dockDepth / TILE_SCALE);
    const repeatZ = Math.max(1, dockLength / TILE_SCALE);

    useEffect(() => {
        const list = [dockTextures.base, dockTextures.normal, dockTextures.roughness, dockTextures.height, dockTextures.metallic, dockTextures.ao];
        list.forEach(tex => {
            if (!tex) return;
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat.set(repeatX, repeatZ);
            tex.anisotropy = Math.max(tex.anisotropy ?? 0, 8);
            tex.needsUpdate = true;
        });
        if (dockTextures.base && 'colorSpace' in dockTextures.base) (dockTextures.base as any).colorSpace = SRGBColorSpace;
    }, [dockTextures, repeatX, repeatZ]);

    const meshRef = React.useRef<Mesh | null>(null);

    // Provide uv2 for AO
    useEffect(() => {
        const geom: any = meshRef.current?.geometry;
        if (geom?.attributes?.uv && !geom.attributes.uv2) {
            geom.setAttribute('uv2', new BufferAttribute(geom.attributes.uv.array, 2));
        }
    }, [meshRef]);

    return (
        <group position={position}>
            {/* Plataforma - positioned to sit on land surface */}
            <mesh position={[0, 0, 0]} receiveShadow ref={meshRef}>
                <boxGeometry args={[dockDepth, dockHeight, dockLength]} />
                <meshStandardMaterial 
                    map={dockTextures.base as any}
                    normalMap={dockTextures.normal as any}
                    roughnessMap={dockTextures.roughness as any}
                    displacementMap={dockTextures.height as any}
                    displacementScale={0.01}
                    metalnessMap={dockTextures.metallic as any}
                    aoMap={dockTextures.ao as any}
                    aoMapIntensity={0.3}
                    metalness={0.2}
                    roughness={0.8}
                    // Reduce brightness at night
                    emissive={isNight ? "#000000" : "#000000"}
                    emissiveIntensity={0}
                />
            </mesh>

            {/* Bolardos / postes */}
            {posts.map((p, i) => (
                <mesh
                    key={i}
                    position={[dockDepth / 2 - 0.5, dockHeight / 2, p * (dockLength / 2)]}
                    castShadow
                >
                    <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
                    <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
                </mesh>
            ))}

            {/* RED WARNING LIGHTS at dock corners - KEEP THESE! */}
            <RedWarningLight 
                position={[-dockLength / 2 - 2.91, -1.5 + dockHeight / 2, dockWidth / 2 + 0.5]}
                isNight={isNight}
            />
            <RedWarningLight 
                position={[dockLength / 2 - 2.91, -1.5 + dockHeight / 2, dockWidth / 2 + 0.5]}
                isNight={isNight}
            />
            <RedWarningLight 
                position={[-dockLength / 2 - 2.91, -1.5 + dockHeight / 2, -dockWidth / 2 - 0.5]}
                isNight={isNight}
            />
            <RedWarningLight 
                position={[dockLength / 2 - 2.91, -1.5 + dockHeight / 2, -dockWidth / 2 - 0.5]}
                isNight={isNight}
            />

            {label && (
                <Text
                    position={[0, dockHeight, 0]}
                    fontSize={0.4}
                    color="black"
                    anchorX="center"
                    outlineWidth={0.02}
                    outlineColor="white"
                >
                    {label}
                </Text>
            )}
        </group>
    );
};

// Yard: grande plano com pilhas de contentores coloridos
export const YardModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => {
    // --- LÓGICA DO CHÃO DO YARD (textura de betão) ---
    const [base, normal, roughness, height, ao] = useTexture([
        concreteBaseUrl,
        concreteNormalUrl,
        concreteRoughnessUrl,
        concreteHeightUrl,
        concreteAoUrl,
    ]);

    const ground = React.useMemo(() => ({
        base: base?.clone() ?? null,
        normal: normal?.clone() ?? null,
        roughness: roughness?.clone() ?? null,
        height: height?.clone() ?? null,
        ao: ao?.clone() ?? null,
    }), [base, normal, roughness, height, ao]);

    useEffect(() => {
        return () => {
            Object.values(ground).forEach(t => t?.dispose());
        };
    }, [ground]);

    const TILE_SCALE = 4;
    const repeatX = Math.max(1, size[0] / TILE_SCALE);
    const repeatZ = Math.max(1, size[2] / TILE_SCALE);

    useEffect(() => {
        const list = [ground.base, ground.normal, ground.roughness, ground.height, ground.ao];
        list.forEach(tex => {
            if (!tex) return;
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat.set(repeatX, repeatZ);
            tex.anisotropy = Math.max(tex.anisotropy ?? 0, 8);
            tex.needsUpdate = true;
        });
        if (ground.base && 'colorSpace' in ground.base) (ground.base as any).colorSpace = SRGBColorSpace;
    }, [ground.base, ground.normal, ground.roughness, ground.height, ground.ao, repeatX, repeatZ]);

    const segX = Math.min(100, Math.ceil(size[0] / 2));
    const segZ = Math.min(100, Math.ceil(size[2] / 2));
    const meshRef = React.useRef<Mesh | null>(null);

    useEffect(() => {
        const geom: any = meshRef.current?.geometry;
        if (geom?.attributes?.uv && !geom.attributes.uv2) {
            geom.setAttribute('uv2', new BufferAttribute(geom.attributes.uv.array, 2));
        }
    }, [meshRef]);

    // Pequena espessura para o yard (bem fininho, só para não parecer folha)
    const YARD_THICKNESS = 0.6;

    return (
        <group position={position}>
            {/* Bloco de yard fininho, com textura em cima (mais escuro que a land) */}
            <mesh position={[0, YARD_THICKNESS - 9.43, 0]} receiveShadow ref={meshRef}>
                <boxGeometry args={[size[0], YARD_THICKNESS, size[2], segX, 1, segZ]} />
                <meshStandardMaterial
                    side={DoubleSide}
                    // same concrete texture as land, but slightly darker / rougher
                    color="#d0d0d0"
                    map={ground.base as any}
                    normalMap={ground.normal as any}
                    roughnessMap={ground.roughness as any}
                    displacementMap={ground.height as any}
                    displacementScale={0.01}
                    aoMap={ground.ao as any}
                    aoMapIntensity={0.25}
                    metalness={0.02}
                    roughness={0.9}
                />
            </mesh>

            {label && (
                <Text
                    position={[0, size[1] / 2 + 0.6, 0]}
                    fontSize={0.4}
                    color="black"
                    anchorX="center"
                    outlineWidth={0.02}
                    outlineColor="white"
                >
                    {label}
                </Text>
            )}
        </group>
    );
};

// Land: grama / chão
export const LandModel: React.FC<Omit<ModelProps, 'color'> & { isMiddle?: boolean; isNight?: boolean }> = ({ position, size, isMiddle, isNight = false }) => {
    // Load all available PBR maps (AO optional)
    const [base, normal, roughness, heightTex, ao] = useTexture([
        concreteBaseUrl,
        concreteNormalUrl,
        concreteRoughnessUrl,
        concreteHeightUrl,
        concreteAoUrl,
    ]);

    // IMPORTANT: clone textures per instance so repeat/wrap changes don't leak to other tiles
    const cloned = React.useMemo(() => {
        return {
            base: base?.clone() ?? null,
            normal: normal?.clone() ?? null,
            roughness: roughness?.clone() ?? null,
            height: heightTex?.clone() ?? null,
            ao: ao?.clone() ?? null,
        };
    }, [base, normal, roughness, heightTex, ao]);
    // Dispose cloned textures on unmount to avoid memory leaks when many LandModel tiles exist
    useEffect(() => {
        return () => {
            Object.values(cloned).forEach(tex => tex?.dispose());
        };
    }, [cloned]);

    // Ajustes específicos para a land do meio: mais comprida e mais estreita
    const [rawWidth, rawHeight, rawLength] = size;
    const WIDTH_FACTOR = isMiddle ? 0.75 : 1.0;  // reduzir bastante a largura da land do meio
    const LENGTH_FACTOR = isMiddle ? 1.3 : 1.0; // aumentar um pouco o comprimento

    const width = rawWidth * WIDTH_FACTOR;
    const height = rawHeight;
    const length = rawLength * LENGTH_FACTOR;

    // Tiling configuration
    const TILE_SCALE = 35; // adjust (smaller -> more repeats)
    const repeatX = Math.max(1, width / TILE_SCALE);
    const repeatZ = Math.max(1, length / TILE_SCALE);

    useEffect(() => {
        const list = [cloned.base, cloned.normal, cloned.roughness, cloned.height, cloned.ao];
        list.forEach(tex => {
            if (!tex) return;
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat.set(repeatX, repeatZ);
            tex.anisotropy = Math.max(tex.anisotropy ?? 0, 8);
            tex.needsUpdate = true;
        });
        // Set sRGB color space where supported (Three r152+)
        if (cloned.base && 'colorSpace' in cloned.base) (cloned.base as any).colorSpace = SRGBColorSpace;
    }, [cloned.base, cloned.normal, cloned.roughness, cloned.height, cloned.ao, repeatX, repeatZ]);

    // Subdivisions for displacement (cap to avoid huge geometries)
    const segX = Math.min(100, Math.ceil(width / 2));
    const segZ = Math.min(100, Math.ceil(length / 2));
    const meshRef = React.useRef<Mesh | null>(null);

    useEffect(() => {
        const geom: any = meshRef.current?.geometry;
        if (geom?.attributes?.uv && !geom.attributes.uv2) {
            geom.setAttribute('uv2', new BufferAttribute(geom.attributes.uv.array, 2));
        }
    }, [meshRef]);

    // Espessura do terreno (altura do “bloco” de land) - usa a altura numérica, não a textura
    const LAND_THICKNESS = Math.max(0.5, height);

    // Add strategic lamps near dock areas only - SIMPLE & FAST
    // Just 4 fixed lamps per land area, close together near the dock edge
    const landLamps: Array<[number, number, number]> = [
        // Front-left corner
        [-width / 4, LAND_THICKNESS - 27, -length / 2 + 5],
        // Front-center-left
        [-width / 8, LAND_THICKNESS - 27, -length / 2 + 5],
        // Front-center-right
        [width / 8, LAND_THICKNESS - 27, -length / 2 + 5],
        // Front-right corner
        [width / 4, LAND_THICKNESS - 27, -length / 2 + 5],
    ];

    return (
        <group position={position}>
            {/* Bloco de terreno com espessura */}
            <mesh position={[0, LAND_THICKNESS - 27, 0]} receiveShadow ref={meshRef}>
                <boxGeometry args={[width, LAND_THICKNESS, length, segX, 1, segZ]} />
                <meshStandardMaterial
                    side={DoubleSide}
                    color="#f5f5f5" // brighten base
                    map={cloned.base as any}
                    normalMap={cloned.normal as any}
                    roughnessMap={cloned.roughness as any}
                    displacementMap={cloned.height as any}
                    displacementScale={0.01}
                    aoMap={cloned.ao as any}
                    aoMapIntensity={0.15}
                    metalness={0.03}
                    roughness={0.85}
                    // Remove emissive glow at night so it's darker
                    emissive={isNight ? "#000000" : "#f0f0f0"}
                    emissiveIntensity={isNight ? 0 : 0.2}
                />
            </mesh>

            {/* Strategic street lamps near dock areas */}
            {landLamps.map((lampPos, i) => (
                <StreetLamp 
                    key={`land-lamp-${i}`}
                    position={lampPos}
                    isNight={isNight}
                />
            ))}
        </group>
    );
};

// Water: plano azul com leve brilho
export const WaterModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size }) => {
    const meshRef = useRef<Mesh | null>(null);
    const originalPositionsRef = useRef<Float32Array | null>(null);

    // Load Water_002 PBR maps (color, normal, roughness, displacement, occlusion)
    const [wColor, wNormal, wRough, wDisp, wOcc] = useTexture([
        waterColorUrl,
        waterNormalUrl,
        waterRoughnessUrl,
        waterDisplacementUrl,
        waterOccUrl,
    ]);

    // Clone per-instance to isolate repeat/wrap
    const water = React.useMemo(() => ({
        base: wColor?.clone() ?? null,
        normal: wNormal?.clone() ?? null,
        roughness: wRough?.clone() ?? null,
        disp: wDisp?.clone() ?? null,
        occ: wOcc?.clone() ?? null,
    }), [wColor, wNormal, wRough, wDisp, wOcc]);

    // Dispose on unmount
    useEffect(() => {
        return () => {
            Object.values(water).forEach(t => t?.dispose());
        };
    }, [water]);

    // Configure tiling
    const TILE_SCALE = 6; // slightly larger tiles for water
    const repeatX = Math.max(1, size[0] / TILE_SCALE);
    const repeatZ = Math.max(1, size[2] / TILE_SCALE);

    useEffect(() => {
        const list = [water.base, water.normal, water.roughness, water.disp, water.occ];
        list.forEach(tex => {
            if (!tex) return;
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat.set(repeatX, repeatZ);
            tex.anisotropy = Math.max(tex.anisotropy ?? 0, 8);
            tex.needsUpdate = true;
        });
        if (water.base && 'colorSpace' in water.base) (water.base as any).colorSpace = SRGBColorSpace;
    }, [water.base, water.normal, water.roughness, water.disp, water.occ, repeatX, repeatZ]);

    // Subtle UV scroll to animate water
    useFrame((_, delta) => {
        const list = [water.base, water.normal, water.roughness, water.disp, water.occ];
        list.forEach(tex => {
            if (!tex) return;
            tex.offset.x = (tex.offset.x + delta * 0.02) % 1; // slow x drift
            tex.offset.y = (tex.offset.y + delta * 0.01) % 1; // slower y drift
        });
    });

    useEffect(() => { originalPositionsRef.current = null; }, [size[0], size[2]]);

    useFrame(({ clock }) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const geom: any = mesh.geometry;
        const posAttr = geom.attributes?.position;
        if (!posAttr) return;
        if (!originalPositionsRef.current) {
            originalPositionsRef.current = new Float32Array(posAttr.array.length);
            originalPositionsRef.current.set(posAttr.array);
        }
        const uvAttr = geom.attributes?.uv; // for edge stop/fade based on UVs
        const orig = originalPositionsRef.current;
        const time = clock.getElapsedTime();
        const count = posAttr.count;
        // Calmer wave parameters
        const amp1 = 1.10;
        const amp2 = 0.6;
        const freq1 = 0.18;
        const freq2 = 0.12;
        const speed1 = 0.7;
        const speed2 = 0.35;
        // Edge stop/fade settings (UV-based primary)
        const stopUV = 0.2; // outer 2% band: waves fully stopped
        const fadeUV = 0.1; // next 10%: smooth fade-in to full amplitude
        const w = size[0];
        // Removed unused stopWorld and fadeWorld
        // Helper function for smoothstep
        function smoothstep(edge0: number, edge1: number, x: number) {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        }
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            const x = orig[ix];
            const y = orig[ix + 1];
            const baselineZ = orig[ix + 2] ?? 0;
            const wave1 = Math.sin(x * freq1 + time * speed1);
            const wave2 = Math.sin((y + x * 0.25) * freq2 + time * speed2 + 1.2);
            let height = wave1 * amp1 + wave2 * amp2;

            // Clamp attenuation so waves are strictly zero outside water area (now on horizontal axis)
            let atten = 0;
            const rampStart = stopUV + (1 - stopUV) * fadeUV;
            if (uvAttr) {
                const iu = i * 2;
                const u = uvAttr.array[iu]; // use u (horizontal) instead of v
                if (u >= stopUV) {
                    atten = smoothstep(rampStart, 1.0, u);
                    atten = Math.pow(atten, 1.2);
                }
            } else {
                // Fallback: normalized horizontal position
                const xNorm = Math.max(0, Math.min(1, (x + w * 0.5) / w));
                if (xNorm >= stopUV) {
                    atten = smoothstep(rampStart, 1.0, xNorm);
                    atten = Math.pow(atten, 1.2);
                }
            }
            posAttr.array[ix + 2] = baselineZ + height * atten;
        }
        posAttr.needsUpdate = true;
        geom.computeVertexNormals();
    });

    // Geometry segments to support displacement
    const segX = Math.min(100, Math.ceil(size[0] / 2));
    const segZ = Math.min(100, Math.ceil(size[2] / 2));

    // Provide uv2 for AO on water geometry
    useEffect(() => {
        const g: any = meshRef.current?.geometry;
        if (g?.attributes?.uv && !g.attributes.uv2) {
            g.setAttribute('uv2', new BufferAttribute(g.attributes.uv.array, 2));
        }
    }, [meshRef, size[0], size[2]]);

    return (
        <group position={position}>
            {/* Lift slightly to avoid z-fighting with ground */}
            <mesh ref={meshRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[size[0], size[2], segX, segZ]} />
                <meshStandardMaterial
                    side={DoubleSide}
                    color="#ffffff"
                    map={water.base as any}
                    normalMap={water.normal as any}
                    roughnessMap={water.roughness as any}
                    displacementMap={water.disp as any}
                    aoMap={water.occ as any}
                    aoMapIntensity={0.2}
                    displacementScale={0.01}
                    metalness={0.05}
                    roughness={0.4}
                    emissive="#0e1b2a"
                    emissiveIntensity={0.05}
                    opacity={0.15}
                />
            </mesh>
        </group>
    );
};

// Building: simples com janelas (material diferente)
export const BuildingModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => (
    <group position={position}>
        <mesh castShadow receiveShadow>
            <boxGeometry args={[size[0], size[1], size[2]]} />
            <meshStandardMaterial color="#708090" metalness={0.2} roughness={0.6} />
        </mesh>
        {label && (
            <Text
                position={[0, size[1] / 2 + 0.6, 0]}
                fontSize={0.35}
                color="black"
                anchorX="center"
                outlineWidth={0.02}
                outlineColor="white"
            >
                {label}
            </Text>
        )}
    </group>
);

// Vessel: casco, ponte, chaminé — mais parecido com um navio
export const VesselModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label, rotation }) => {
    // size = [width, height, length]
    const [w, h, l] = size;
    const hullHeight = Math.max(0.5, h * 0.6);
    const deckHeight = Math.max(0.2, h * 0.4);

    return (
        <group position={position} rotation={rotation}>
            {/* Hull (um box arredondado em aparência) */}
            <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
                <boxGeometry args={[w, hullHeight, l]} />
                <meshStandardMaterial color="#0b3d91" metalness={0.4} roughness={0.4} />
            </mesh>

            {/* Bow - cone frontal para dar forma */}
            <mesh position={[0, 0, l / 2 + 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[w * 0.5, 0.001, 0.6, 16]} />
                <meshStandardMaterial color="#0b3d91" metalness={0.4} roughness={0.4} />
            </mesh>

            {/* Deck */}
            <mesh position={[0, hullHeight / 2 + deckHeight / 2, 0]} castShadow>
                <boxGeometry args={[w * 0.9, deckHeight, l * 0.9]} />
                <meshStandardMaterial color="#5577aa" metalness={0.2} roughness={0.6} />
            </mesh>

            {/* Superstructure / bridge */}
            <mesh position={[0, hullHeight / 2 + deckHeight + 0.4, -l * 0.15]} castShadow>
                <boxGeometry args={[w * 0.5, 0.8, l * 0.25]} />
                <meshStandardMaterial color="#dfe7f3" metalness={0.1} roughness={0.5} />
            </mesh>

            {/* Funnel */}
            <mesh position={[w * 0.18, hullHeight / 2 + deckHeight + 0.7, 0.1]} castShadow>
                <cylinderGeometry args={[0.12, 0.12, 0.6, 12]} />
                <meshStandardMaterial color="#2f2f2f" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Label */}
            {label && (
                <Text
                    position={[0, hullHeight + 0.8, 0]}
                    fontSize={0.45}
                    color="white"
                    anchorX="center"
                    outlineWidth={0.02}
                    outlineColor="#000"
                >
                    {label}
                </Text>
            )}
        </group>
    );
};

// Ship-to-Shore Crane (grua de cais) — duas torres, viga superior e trole simples
export const STSCraneModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label, isNight = false }) => {
    const towerHeight = Math.max(3, size[1] * 8);
    const span = Math.max(4, size[2] * 1.2);

    // Load textures for known crane materials (fall back to a default URL if material missing)
    const bucketUrls = getMaterialTextureUrls('BUCKET');
    const ironUrls = getMaterialTextureUrls('IRON');
    const ropeUrls = getMaterialTextureUrls('ROPE');
    const concreteUrls = getMaterialTextureUrls('CONCRETE');
    const glassUrls = getMaterialTextureUrls('GLASS');
    const frameUrls = getMaterialTextureUrls('FRAME');
    const uvUrls = getMaterialTextureUrls('UV');

    // For each material, request only the maps we plan to use to avoid unused variables
    const [bBase, bNormal, bRough, bMetal, bAO, bHeight] = useTexture(bucketUrls.length ? bucketUrls : [defaultCraneUrl]);
    const [iBase, iNormal, iRough, iMetal] = useTexture(ironUrls.length ? ironUrls.slice(0, 4) : [defaultCraneUrl]);
    const [rBase] = useTexture(ropeUrls.length ? [ropeUrls[0]] : [defaultCraneUrl]);
    const [cBase] = useTexture(concreteUrls.length ? [concreteUrls[0]] : [defaultCraneUrl]);
    const [gBase] = useTexture(glassUrls.length ? [glassUrls[0]] : [defaultCraneUrl]);
    const [fBase, fNormal, fRough, fMetal] = useTexture(frameUrls.length ? frameUrls.slice(0,4) : [defaultCraneUrl]);
    const [uBase] = useTexture(uvUrls.length ? [uvUrls[0]] : [defaultCraneUrl]);

    // Clone per-instance
    const bucketTex = React.useMemo(() => ({
        base: (bBase as any)?.clone?.() ?? null,
        normal: (bNormal as any)?.clone?.() ?? null,
        roughness: (bRough as any)?.clone?.() ?? null,
        metallic: (bMetal as any)?.clone?.() ?? null,
        ao: (bAO as any)?.clone?.() ?? null,
        height: (bHeight as any)?.clone?.() ?? null,
    }), [bBase, bNormal, bRough, bMetal, bAO, bHeight]);

    const ironTex = React.useMemo(() => ({
        base: (iBase as any)?.clone?.() ?? null,
        normal: (iNormal as any)?.clone?.() ?? null,
        roughness: (iRough as any)?.clone?.() ?? null,
        metallic: (iMetal as any)?.clone?.() ?? null,
    }), [iBase, iNormal, iRough, iMetal]);

    const ropeTex = React.useMemo(() => ({
        base: (rBase as any)?.clone?.() ?? null,
    }), [rBase]);

    const concreteTex = React.useMemo(() => ({
        base: (cBase as any)?.clone?.() ?? null,
    }), [cBase]);

    const glassTex = React.useMemo(() => ({
        base: (gBase as any)?.clone?.() ?? null,
    }), [gBase]);

    const frameTex = React.useMemo(() => ({
        base: (fBase as any)?.clone?.() ?? null,
        normal: (fNormal as any)?.clone?.() ?? null,
        roughness: (fRough as any)?.clone?.() ?? null,
        metallic: (fMetal as any)?.clone?.() ?? null,
    }), [fBase, fNormal, fRough, fMetal]);

    const uvTex = React.useMemo(() => ({
        base: (uBase as any)?.clone?.() ?? null,
    }), [uBase]);

    // Configure wrapping/repeat and colorSpace for all loaded textures
    useEffect(() => {
        const all = [bucketTex.base, bucketTex.normal, bucketTex.roughness, bucketTex.metallic, bucketTex.ao,
            ironTex.base, ironTex.normal, ironTex.roughness, ironTex.metallic,
            ropeTex.base, concreteTex.base, glassTex.base];
        all.push(frameTex.base, frameTex.normal, frameTex.roughness, frameTex.metallic, uvTex.base);
        all.forEach(tex => {
            if (!tex) return;
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat.set(1, 1);
            tex.anisotropy = Math.max(tex.anisotropy ?? 0, 8);
            tex.needsUpdate = true;
        });
        if (bucketTex.base && 'colorSpace' in bucketTex.base) (bucketTex.base as any).colorSpace = SRGBColorSpace;
        if (ironTex.base && 'colorSpace' in ironTex.base) (ironTex.base as any).colorSpace = SRGBColorSpace;
        if (glassTex.base && 'colorSpace' in glassTex.base) (glassTex.base as any).colorSpace = SRGBColorSpace;
        return () => {
            [...Object.values(bucketTex), ...Object.values(ironTex), ...Object.values(ropeTex), ...Object.values(concreteTex), ...Object.values(glassTex), ...Object.values(frameTex), ...Object.values(uvTex)].forEach(t => t?.dispose());
        };
    }, [bucketTex, ironTex, ropeTex, concreteTex, glassTex]);

    // Positions for additional decorative parts
    const cabinPos: [number, number, number] = [span * 0.25, towerHeight - 0.65, 0.2];
    const bucketPos: [number, number, number] = [0, towerHeight - 1.6, 0];
    const ropeLength = 1.2;

    return (
        <group position={position}>
            {/* Base / small concrete pad at tower feet */}
            <mesh position={[-span / 2 + 0.3, 0.08, 0]} receiveShadow>
                <boxGeometry args={[0.6, 0.16, 0.6]} />
                <meshStandardMaterial map={concreteTex.base as any} metalness={0.02} roughness={0.9} />
            </mesh>
            <mesh position={[span / 2 - 0.3, 0.08, 0]} receiveShadow>
                <boxGeometry args={[0.6, 0.16, 0.6]} />
                <meshStandardMaterial map={concreteTex.base as any} metalness={0.02} roughness={0.9} />
            </mesh>

            {/* Towers (iron) */}
            <mesh position={[-span / 2 + 0.3, towerHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.3, towerHeight, 0.3]} />
                <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.6}
                    map={ironTex.base as any}
                    normalMap={ironTex.normal as any}
                    roughnessMap={ironTex.roughness as any}
                    metalnessMap={ironTex.metallic as any}
                />
            </mesh>
            <mesh position={[span / 2 - 0.3, towerHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.3, towerHeight, 0.3]} />
                <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.6}
                    map={ironTex.base as any}
                    normalMap={ironTex.normal as any}
                    roughnessMap={ironTex.roughness as any}
                    metalnessMap={ironTex.metallic as any}
                />
            </mesh>

            {/* Overhead beam (BUCKET material) */}
            <mesh position={[0, towerHeight - 0.2, 0]} castShadow>
                <boxGeometry args={[span, 0.2, 0.4]} />
                <meshStandardMaterial color="#ffffff" metalness={0.7} roughness={0.5}
                    map={bucketTex.base as any}
                    normalMap={bucketTex.normal as any}
                    roughnessMap={bucketTex.roughness as any}
                    metalnessMap={bucketTex.metallic as any}
                />
            </mesh>

            {/* Decorative frame plates near beam ends (FRAME material) */}
            <mesh position={[span/2 - 0.25, towerHeight - 0.2 + 0.05, 0.45]} rotation={[0, 0, 0]} castShadow>
                <planeGeometry args={[0.4, 0.25]} />
                <meshStandardMaterial map={frameTex.base as any} normalMap={frameTex.normal as any} roughnessMap={frameTex.roughness as any} metalnessMap={frameTex.metallic as any} side={DoubleSide} />
            </mesh>
            <mesh position={[-span/2 + 0.25, towerHeight - 0.2 + 0.05, 0.45]} rotation={[0, 0, 0]} castShadow>
                <planeGeometry args={[0.4, 0.25]} />
                <meshStandardMaterial map={frameTex.base as any} normalMap={frameTex.normal as any} roughnessMap={frameTex.roughness as any} metalnessMap={frameTex.metallic as any} side={DoubleSide} />
            </mesh>

            {/* Cabin (glass) attached to beam */}
            <mesh position={cabinPos} castShadow>
                <boxGeometry args={[0.6, 0.4, 0.5]} />
                <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.2} opacity={0.95} transparent={true}
                    map={glassTex.base as any}
                />
            </mesh>

            {/* Trolley */}
            <mesh position={[0, towerHeight - 0.6, 0]} castShadow>
                <boxGeometry args={[0.6, 0.2, 0.6]} />
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} map={bucketTex.base as any} />
            </mesh>

            {/* Rope/cable under trolley */}
            <mesh position={[0, towerHeight - 0.95 - ropeLength / 2, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, ropeLength, 8]} />
                <meshStandardMaterial color="#444" metalness={0.1} roughness={0.7} map={ropeTex.base as any} />
            </mesh>

            {/* Bucket / grab at the end of cable */}
            <mesh position={bucketPos} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4}
                    map={bucketTex.base as any}
                    normalMap={bucketTex.normal as any}
                    roughnessMap={bucketTex.roughness as any}
                    metalnessMap={bucketTex.metallic as any}
                />
            </mesh>

            {/* Small UV decal on top of bucket (UV material) */}
            <mesh position={[bucketPos[0], bucketPos[1] + 0.28, bucketPos[2]]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                <planeGeometry args={[0.38, 0.38]} />
                <meshStandardMaterial map={uvTex.base as any} transparent={true} opacity={0.95} side={DoubleSide} />
            </mesh>

            {/* NEW: Red warning lights on top of both towers - like on real cranes! */}
            <RedWarningLight 
                position={[-span / 2 + 0.3, towerHeight + 0.2, 0]} 
                isNight={isNight}
            />
            <RedWarningLight 
                position={[span / 2 - 0.3, towerHeight + 0.2, 0]} 
                isNight={isNight}
            />

            {label && (
                <Text
                    position={[0, towerHeight + 0.4, 0]}
                    fontSize={0.35}
                    color="black"
                    anchorX="center"
                    outlineWidth={0.02}
                    outlineColor="white"
                >
                    {label}
                </Text>
            )}
        </group>
    );
};

// Yard Gantry Crane (grua de pátio) — pernas laterais e viga superior com trole
export const YardCraneModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label, isNight = false }) => {
    const legHeight = Math.max(25, size[1] * 6);
    const span = Math.max(3, size[0] * 0.9);
    
    // Increased dimensions for better visibility and realism
    const legThickness = 5;      // Much thicker legs (was 0.25)
    const beamHeight = 7;        // Taller beam (was 0.2)
    const beamDepth = 7;         // Much deeper beam (was 0.6)
    const trolleySize = 5;       // Larger trolley (was 0.5)
    const trolleyHeight = 8;     // Taller trolley (was 0.2)

    // Load gantry crane textures (NO displacement - causes problems)
    const [gBase, gNormal, gRough, gMetal] = useTexture([
        gantryBaseUrl,
        gantryNormalUrl,
        gantryRoughnessUrl,
        gantryMetallicUrl,
    ]);

    // Configure textures - use ClampToEdgeWrapping to avoid tiling/repeating
    useEffect(() => {
        [gBase, gNormal, gRough, gMetal].forEach(tex => {
            if (!tex) return;
            tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
            tex.repeat.set(1, 1);
            tex.anisotropy = 16;
            tex.needsUpdate = true;
        });
        
        if (gBase && 'colorSpace' in gBase) {
            (gBase as any).colorSpace = SRGBColorSpace;
        }
    }, [gBase, gNormal, gRough, gMetal]);

    return (
        <group position={position}>
            {/* Left Leg - with properly tiled texture */}
            <mesh position={[-span / 2, legHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[legThickness, legHeight, legThickness]} />
                <meshStandardMaterial 
                    map={gBase as any}
                    normalMap={gNormal as any}
                    roughnessMap={gRough as any}
                    metalnessMap={gMetal as any}
                    metalness={0.5}
                    roughness={0.6}
                />
            </mesh>
            
            {/* Right Leg */}
            <mesh position={[span / 2, legHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[legThickness, legHeight, legThickness]} />
                <meshStandardMaterial 
                    map={gBase as any}
                    normalMap={gNormal as any}
                    roughnessMap={gRough as any}
                    metalnessMap={gMetal as any}
                    metalness={0.5}
                    roughness={0.6}
                />
            </mesh>

            {/* Top beam */}
            <mesh position={[0, legHeight - beamHeight/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[span + 1.5, beamHeight, beamDepth]} />
                <meshStandardMaterial 
                    map={gBase as any}
                    normalMap={gNormal as any}
                    roughnessMap={gRough as any}
                    metalnessMap={gMetal as any}
                    metalness={0.5}
                    roughness={0.6}
                />
            </mesh>

            {/* Trolley */}
            <mesh position={[0, legHeight - beamHeight - trolleyHeight/2 - 0.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[trolleySize, trolleyHeight, trolleySize]} />
                <meshStandardMaterial 
                    color="#666666"
                    map={gBase as any}
                    normalMap={gNormal as any}
                    roughnessMap={gRough as any}
                    metalnessMap={gMetal as any}
                    metalness={0.6}
                    roughness={0.4}
                />
            </mesh>
            
            {/* Add cross-bracing for more realistic gantry crane structure */}
            <mesh position={[-span / 4, legHeight / 2, 0]} castShadow>
                <boxGeometry args={[span / 2, 0.3, 0.3]} />
                <meshStandardMaterial 
                    map={gBase as any}
                    metalness={0.7} 
                    roughness={0.3} 
                />
            </mesh>
            <mesh position={[span / 4, legHeight / 2, 0]} castShadow>
                <boxGeometry args={[span / 2, 0.3, 0.3]} />
                <meshStandardMaterial 
                    map={gBase as any}
                    metalness={0.7} 
                    roughness={0.3} 
                />
            </mesh>

            {/* Red warning lights on top of the crane legs */}
            <RedWarningLight 
                position={[-span / 2, legHeight + 0.2, 0]} 
                isNight={isNight}
            />
            <RedWarningLight 
                position={[span / 2, legHeight + 0.2, 0]} 
                isNight={isNight}
            />

            {label && (
                <Text
                    position={[0, legHeight + 0.8, 0]}
                    fontSize={0.5}
                    color="white"
                    anchorX="center"
                    outlineWidth={0.05}
                    outlineColor="black"
                >
                    {label}
                </Text>
            )}
        </group>
    );
};
