import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

export function CargoShipModel(props: any) {
    const gltf = useGLTF('/models/small_cargo_ship/scene.gltf') as any;
    
    // Clone the scene for each instance so multiple vessels can be rendered
    // Without cloning, only one instance can exist in the scene graph
    const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
    
    return <primitive object={clonedScene} {...props} />;
}

useGLTF.preload('/models/small_cargo_ship/scene.gltf');
