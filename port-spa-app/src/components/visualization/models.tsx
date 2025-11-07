import React from 'react';
import { Text } from '@react-three/drei';

// Props base para qualquer modelo
type ModelProps = {
    position: [number, number, number];
    size: [number, number, number];
    color?: string;
    label?: string;
};

// --- Componentes Específicos do Porto (mais detalhados) ---

// Dock: plataforma longa com alguns postes/bolardos
export const DockModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => {
    const posts: number[] = [ -0.8, -0.4, 0, 0.4, 0.8 ];
    return (
        <group position={position}>
            {/* Plataforma */}
            <mesh receiveShadow>
                <boxGeometry args={[size[0], Math.max(0.1, size[1]), size[2]]} />
                <meshStandardMaterial color="#7f6a52" metalness={0.1} roughness={0.8} />
            </mesh>

            {/* Bolardos / postes */}
            {posts.map((p, i) => (
                <mesh key={i} position={[p * (size[0] / 2), size[1] / 2 + 0.15, size[2] / 2 - 0.5]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
                    <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
                </mesh>
            ))}

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

// Yard: grande plano com pilhas de contentores coloridos
export const YardModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => {
    // cria uma grelha de contentores dentro do yard
    const cols = Math.max(1, Math.floor(size[2] / 3));
    const rows = Math.max(1, Math.floor(size[0] / 3));
    const colors = ['#ff7f50', '#ff6347', '#1e90ff', '#32cd32', '#ffd700', '#8a2be2'];

    const stacks: React.ReactElement[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const stackHeight = Math.floor(Math.random() * 3) + 1; // 1..3
            for (let h = 0; h < stackHeight; h++) {
                const w = 2.4, d = 1.2, hh = 0.6;
                const x = (r - rows/2) * 3 + w/2;
                const z = (c - cols/2) * 1.5 + d/2;
                const y = h * (hh + 0.05) + hh/2;
                const color = colors[(r + c + h) % colors.length];
                stacks.push(
                    <mesh key={`${r}-${c}-${h}`} position={[x, y, z]} castShadow receiveShadow>
                        <boxGeometry args={[w, hh, d]} />
                        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
                    </mesh>
                );
            }
        }
    }

    return (
        <group position={position}>
            <mesh receiveShadow>
                <boxGeometry args={[size[0], Math.max(0.1, size[1]), size[2]]} />
                <meshStandardMaterial color="#3c6b5a" metalness={0.1} roughness={0.9} />
            </mesh>

            {stacks}

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
export const LandModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size }) => (
    <group position={position}>
        <mesh receiveShadow>
            <boxGeometry args={[size[0], Math.max(0.1, size[1]), size[2]]} />
            <meshStandardMaterial color="limegreen" metalness={0.05} roughness={0.9} />
        </mesh>
    </group>
);

// Water: plano azul com leve brilho
export const WaterModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size }) => (
    <group position={position}>
        <mesh receiveShadow>
            <boxGeometry args={[size[0], Math.max(0.05, size[1]), size[2]]} />
            <meshStandardMaterial color="deepskyblue" metalness={0.1} roughness={0.2} transparent opacity={0.95} />
        </mesh>
    </group>
);

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
export const VesselModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => {
    // size = [width, height, length]
    const [w, h, l] = size;
    const hullHeight = Math.max(0.5, h * 0.6);
    const deckHeight = Math.max(0.2, h * 0.4);

    return (
        <group position={position}>
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
export const STSCraneModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => {
    const towerHeight = Math.max(3, size[1] * 8);
    const span = Math.max(4, size[2] * 1.2);

    return (
        <group position={position}>
            {/* Towers */}
            <mesh position={[-span / 2 + 0.3, towerHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.3, towerHeight, 0.3]} />
                <meshStandardMaterial color="orangered" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[span / 2 - 0.3, towerHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.3, towerHeight, 0.3]} />
                <meshStandardMaterial color="orangered" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Overhead beam */}
            <mesh position={[0, towerHeight - 0.2, 0]} castShadow>
                <boxGeometry args={[span, 0.2, 0.4]} />
                <meshStandardMaterial color="orangered" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Trolley */}
            <mesh position={[0, towerHeight - 0.6, 0]} castShadow>
                <boxGeometry args={[0.6, 0.2, 0.6]} />
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
            </mesh>

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
export const YardCraneModel: React.FC<Omit<ModelProps, 'color'>> = ({ position, size, label }) => {
    const legHeight = Math.max(2, size[1] * 6);
    const span = Math.max(3, size[0] * 0.9);

    return (
        <group position={position}>
            {/* Legs */}
            <mesh position={[-span / 2, legHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.25, legHeight, 0.25]} />
                <meshStandardMaterial color="yellow" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[span / 2, legHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.25, legHeight, 0.25]} />
                <meshStandardMaterial color="yellow" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Top beam */}
            <mesh position={[0, legHeight - 0.15, 0]} castShadow>
                <boxGeometry args={[span + 0.5, 0.2, 0.6]} />
                <meshStandardMaterial color="yellow" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Trolley */}
            <mesh position={[0, legHeight - 0.45, 0]} castShadow>
                <boxGeometry args={[0.5, 0.2, 0.5]} />
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
            </mesh>

            {label && (
                <Text
                    position={[0, legHeight + 0.3, 0]}
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

