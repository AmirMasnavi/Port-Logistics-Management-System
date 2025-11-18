// Service to generate dynamic dock layout from backend data
import type { Dock, LayoutElement } from '../domain/types';

/**
 * Generates layout elements for docks based on backend data
 * Positions docks along the edges of land masses
 */
export const generateDockLayout = (docks: Dock[]): LayoutElement[] => {
    if (docks.length === 0) {
        console.warn('No docks found in backend, returning empty layout');
        return [];
    }

    console.log(`Generating layout for ${docks.length} docks`);

    const dockElements: LayoutElement[] = [];
    
    // Port layout constants (from PortLayoutService.cs)
    const portGroundY = 1.0;
    const portGroundHeight = 6.0;
    
    // Main pier land: position [0, 1.0, 0], size [80, 6.0, 120]
    // This means the main pier extends:
    // - X: from -40 to +40 (width of 80)
    // - Z: from -60 to +60 (length of 120)
    
    // Docks should be positioned at the edges of this land mass
    const mainPierLeftEdge = -40;  // Left edge X coordinate
    const mainPierRightEdge = 40;   // Right edge X coordinate
    const mainPierFrontEdge = 60;   // Front edge Z coordinate (towards water)
    
    const dockY = portGroundY;
    const dockHeight = portGroundHeight;
    const spacingBetweenDocks = 10; // Increased spacing between docks for clear separation
    
    // Strategy based on number of docks:
    // 1-3 docks: Place on left edge of main pier
    // 4-6 docks: Split between left and right edges
    // 7+ docks: Distribute across left, right, and front edges
    
    if (docks.length <= 3) {
        // Place all docks along the left edge of the main pier
        let currentZ = -40; // Start from a clear position
        
        docks.forEach((dock) => {
            const dockLength = Math.min(dock.lengthInMeters || 50, 120); // Máximo de 120 metros
            const dockDepth = dock.depthInMeters || 15;
            
            const positionX = mainPierLeftEdge; // At the left edge
            const positionZ = currentZ + (dockLength / 2); // Center of the dock
            
            console.log(`Positioning dock ${dock.name} on LEFT edge at [${positionX}, ${dockY}, ${positionZ}] with size [${dockDepth}, ${dockHeight}, ${dockLength}]`);
            
            dockElements.push({
                type: 'dock',
                id: dock.id,
                name: dock.name,
                position: [positionX, dockY, positionZ],
                size: [dockDepth, dockHeight, dockLength] // depth (extends into water), height, length (along pier)
            });
            
            // Move to next position: current position + dock length + spacing
            currentZ += dockLength + spacingBetweenDocks;
        });
        
    } else if (docks.length <= 6) {
        // Split between left and right edges
        const leftDocks = docks.slice(0, Math.ceil(docks.length / 2));
        const rightDocks = docks.slice(Math.ceil(docks.length / 2));
        
        // Left edge docks
        let currentLeftZ = -40; // Start position along Z axis
        leftDocks.forEach((dock) => {
            const dockLength = Math.min(dock.lengthInMeters || 50, 120); // Máximo de 120 metros
            const dockDepth = dock.depthInMeters || 15;
            
            const positionX = mainPierLeftEdge;
            const positionZ = currentLeftZ + (dockLength / 2); // Center position
            
            console.log(`Positioning dock ${dock.name} on LEFT edge at [${positionX}, ${dockY}, ${positionZ}] with spacing`);
            
            dockElements.push({
                type: 'dock',
                id: dock.id,
                name: dock.name,
                position: [positionX, dockY, positionZ],
                size: [dockDepth, dockHeight, dockLength]
            });
            
            // Next dock position
            currentLeftZ += dockLength + spacingBetweenDocks;
        });
        
        // Right edge docks
        let currentRightZ = -40;
        rightDocks.forEach((dock) => {
            const dockLength = Math.min(dock.lengthInMeters || 50, 120); // Máximo de 120 metros
            const dockDepth = dock.depthInMeters || 15;
            
            const positionX = mainPierRightEdge;
            const positionZ = currentRightZ + (dockLength / 2); // Center position
            
            console.log(`Positioning dock ${dock.name} on RIGHT edge at [${positionX}, ${dockY}, ${positionZ}] with spacing`);
            
            dockElements.push({
                type: 'dock',
                id: dock.id,
                name: dock.name,
                position: [positionX, dockY, positionZ],
                size: [dockDepth, dockHeight, dockLength]
            });
            
            // Next dock position
            currentRightZ += dockLength + spacingBetweenDocks;
        });
        
    } else {
        // Distribute across left, right, and front edges
        const docksPerEdge = Math.ceil(docks.length / 3);
        const leftDocks = docks.slice(0, docksPerEdge);
        const rightDocks = docks.slice(docksPerEdge, docksPerEdge * 2);
        const frontDocks = docks.slice(docksPerEdge * 2);
        
        // Left edge
        let currentLeftZ = -40;
        leftDocks.forEach((dock) => {
            const dockLength = Math.min(dock.lengthInMeters || 50, 120); // Máximo de 120 metros
            const dockDepth = dock.depthInMeters || 15;
            
            const positionZ = currentLeftZ + (dockLength / 2);
            
            dockElements.push({
                type: 'dock',
                id: dock.id,
                name: dock.name,
                position: [mainPierLeftEdge, dockY, positionZ],
                size: [dockDepth, dockHeight, dockLength]
            });
            
            console.log(`Positioning dock ${dock.name} on LEFT edge with ${spacingBetweenDocks}m spacing`);
            currentLeftZ += dockLength + spacingBetweenDocks;
        });
        
        // Right edge
        let currentRightZ = -40;
        rightDocks.forEach((dock) => {
            const dockLength = Math.min(dock.lengthInMeters || 50, 120); // Máximo de 120 metros
            const dockDepth = dock.depthInMeters || 15;
            
            const positionZ = currentRightZ + (dockLength / 2);
            
            dockElements.push({
                type: 'dock',
                id: dock.id,
                name: dock.name,
                position: [mainPierRightEdge, dockY, positionZ],
                size: [dockDepth, dockHeight, dockLength]
            });
            
            console.log(`Positioning dock ${dock.name} on RIGHT edge with ${spacingBetweenDocks}m spacing`);
            currentRightZ += dockLength + spacingBetweenDocks;
        });
        
        // Front edge (perpendicular orientation)
        let currentFrontX = -40;
        frontDocks.forEach((dock) => {
            const dockLength = Math.min(dock.lengthInMeters || 50, 120); // Máximo de 120 metros
            const dockDepth = dock.depthInMeters || 15;
            
            const positionX = currentFrontX + (dockLength / 2);
            
            dockElements.push({
                type: 'dock',
                id: dock.id,
                name: dock.name,
                position: [positionX, dockY, mainPierFrontEdge],
                size: [dockLength, dockHeight, dockDepth] // Rotated: length along X, depth along Z
            });
            
            console.log(`Positioning dock ${dock.name} on FRONT edge with ${spacingBetweenDocks}m spacing`);
            currentFrontX += dockLength + spacingBetweenDocks;
        });
    }
    
    console.log(`Generated ${dockElements.length} dock layout elements along land edges`);
    return dockElements;
};
