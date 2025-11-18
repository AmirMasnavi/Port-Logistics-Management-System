import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ContainerModelProps {
    position: [number, number, number];
    size: [number, number, number];
    textureUrl: string; // can be a filename, shorthand (red/blue/green/yellow), or a full URL
}

// Eagerly import all container baseColor textures as URLs so Vite bundles them correctly
// Matches files like: ContainerRed_baseColor.png, ContainerDarkBlue_baseColor.png, etc.
const containerTextureFiles = import.meta.glob('./textures/Container*_*Color.png', { eager: true, as: 'url' }) as Record<string, string>;

// Build a map by basename (e.g., 'ContainerRed_baseColor.png' => url)
const containerByFileName: Record<string, string> = Object.fromEntries(
    Object.entries(containerTextureFiles).map(([path, url]) => [path.split('/').pop() ?? path, url])
);

// Build a shorthand map by color name
const byColor: Record<string, string | undefined> = {
    red: containerByFileName['ContainerRed_baseColor.png'],
    blue: containerByFileName['ContainerDarkBlue_baseColor.png'],
    green: containerByFileName['ContainerGreen_baseColor.png'],
    yellow: containerByFileName['ContainerYellow_baseColor.png'],
    lightblue: containerByFileName['ContainerLightBlue_baseColor.png'],
    orange: containerByFileName['ContainerOrange_baseColor.png'],
};

// Resolve an incoming textureUrl (which might be a filename, a shorthand color, or a full/relative URL)
function resolveTextureUrl(input: string): string {
    if (!input) {
        return byColor.blue || Object.values(containerByFileName)[0];
    }

    const lower = input.toLowerCase().trim();

    // If input is a shorthand color key
    if (byColor[lower]) return byColor[lower]!;

    // If input looks like a path (e.g. '/textures/ContainerRed_baseColor.png' or 'textures/ContainerRed_baseColor.png'),
    // try to match by its basename to an imported asset; if not found, fall back to original input (it might be in public/)
    const maybeFile = input.split(/[\\/]/).pop() ?? input;
    if (containerByFileName[maybeFile]) return containerByFileName[maybeFile]!;

    // Otherwise, treat as-is. This allows using absolute/public URLs when desired.
    return input;
}

export const ContainerModel: React.FC<ContainerModelProps> = ({ position, size, textureUrl }) => {
    const resolvedUrl = resolveTextureUrl(textureUrl);

    // Carrega a textura do contentor (via URL resolvida para assets locais ou URL pública)
    const texture = useTexture(resolvedUrl);

    // Garante que a textura não parece "desbotada"
    if (texture) {
        (texture as any).colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
    }

    return (
        <mesh position={position} castShadow receiveShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial
                map={texture as any}
                metalness={0.4}
                roughness={0.6}
            />
        </mesh>
    );
};