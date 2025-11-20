/// <reference types="vite/client" />

// Declare module types for 3D model formats
declare module '*.obj' {
  const src: string;
  export default src;
}

declare module '*.mtl' {
  const src: string;
  export default src;
}

declare module '*.fbx' {
  const src: string;
  export default src;
}

declare module '*.3ds' {
  const src: string;
  export default src;
}

declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.gltf' {
  const src: string;
  export default src;
}

