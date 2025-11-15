import { useGLTF } from '@react-three/drei';

export function CargoShipModel(props: any) {
    const gltf = useGLTF('/models/small_cargo_ship/scene.gltf') as any;
    return <primitive object={gltf.scene} {...props} />;
}

useGLTF.preload('/models/small_cargo_ship/scene.gltf');
