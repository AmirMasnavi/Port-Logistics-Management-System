// Service to generate dynamic yard layout from backend data
import type { LayoutElement } from '../domain/types';
import type { StorageArea } from '../domain/storageArea/storageArea.model';

/**
 * Generates layout elements for yards based on backend storage area data
 * Places yards on inland areas of the port
 * Each yard is subdivided into 4 sections (2x2 grid) for better organization
 */
export const generateYardLayout = (storageAreas: StorageArea[]): LayoutElement[] => {
    // Filter only yards (Type = "Yard")
    const yards = storageAreas.filter(area => area.type.toLowerCase() === 'yard');
    
    if (yards.length === 0) {
        console.warn('No yards found in backend, returning empty layout');
        return [];
    }

    console.log(`Generating layout for ${yards.length} yards (each will be subdivided into 4 sections)`);

    /**
     * Helper function to subdivide a yard into 4 sections (2x2 grid)
     * Returns 4 layout elements representing the subdivisions
     */
    const subdivideYard = (
        yardCode: string,
        centerPosition: [number, number, number],
        fullSize: [number, number, number]
    ): LayoutElement[] => {
        const [fullWidth, height, fullDepth] = fullSize;
        const [centerX, y, centerZ] = centerPosition;
        
        // Each subdivision is half the width and half the depth
        const subWidth = fullWidth / 2;
        const subDepth = fullDepth / 2;
        
        // Calculate offsets for each quadrant
        const offsetX = subWidth / 2;
        const offsetZ = subDepth / 2;
        
        // Create 4 subdivisions: top-left, top-right, bottom-left, bottom-right
        return [
            {
                type: 'yard',
                id: `${yardCode}-1`,
                name: `${yardCode}-1`,
                position: [centerX - offsetX, y, centerZ - offsetZ], // Top-left
                size: [subWidth, height, subDepth]
            },
            {
                type: 'yard',
                id: `${yardCode}-2`,
                name: `${yardCode}-2`,
                position: [centerX + offsetX, y, centerZ - offsetZ], // Top-right
                size: [subWidth, height, subDepth]
            },
            {
                type: 'yard',
                id: `${yardCode}-3`,
                name: `${yardCode}-3`,
                position: [centerX - offsetX, y, centerZ + offsetZ], // Bottom-left
                size: [subWidth, height, subDepth]
            },
            {
                type: 'yard',
                id: `${yardCode}-4`,
                name: `${yardCode}-4`,
                position: [centerX + offsetX, y, centerZ + offsetZ], // Bottom-right
                size: [subWidth, height, subDepth]
            }
        ];
    };

    const yardElements: LayoutElement[] = [];
    
    // Port layout constants (matching PortLayoutService.cs)
    const portGroundY = 1.0;
    const portGroundHeight = 6.0;
    
    // Main pier land: position [0, 1.0, 0], size [80, 6.0, 120]
    // We'll place yards in the inland area and on the main pier
    
    // Positioning strategy:
    // - Place yards on the main pier area (center of the port)
    // - If more yards exist, place them in the inland area (behind the main pier)
    
    const mainPierCenterX = 0;
    const mainPierCenterZ = 0;
    const yardY = portGroundY + (portGroundHeight / 2) + 0.05; // Slightly above ground
    const yardHeight = 0.1; // Thin plane for yards
    
    // Default yard dimensions
    const defaultYardWidth = 55;
    const defaultYardDepth = 50;
    const spacingBetweenYards = 15;
    
    if (yards.length === 1) {
        // Single yard: place in center of main pier and subdivide into 4
        const yard = yards[0];
        const yardWidth = defaultYardWidth;
        const yardDepth = defaultYardDepth;
        
        console.log(`Positioning yard ${yard.code} at main pier center (subdivided into 4)`);
        
        const subdivisions = subdivideYard(
            yard.code,
            [mainPierCenterX, yardY, mainPierCenterZ],
            [yardWidth, yardHeight, yardDepth]
        );
        
        yardElements.push(...subdivisions);
        
    } else if (yards.length === 2) {
        // Two yards: one on main pier, one in inland area (both subdivided into 4)
        const [yard1, yard2] = yards;
        
        // Yard 1: Main pier (subdivided)
        const sub1 = subdivideYard(
            yard1.code,
            [mainPierCenterX, yardY, mainPierCenterZ],
            [defaultYardWidth, yardHeight, defaultYardDepth]
        );
        yardElements.push(...sub1);
        
        console.log(`Positioned yard ${yard1.code} at main pier (subdivided into 4)`);
        
        // Yard 2: Inland area (left side, subdivided)
        const sub2 = subdivideYard(
            yard2.code,
            [-90, yardY, -100],
            [60, yardHeight, 50]
        );
        yardElements.push(...sub2);
        
        console.log(`Positioned yard ${yard2.code} at inland area (subdivided into 4)`);
        
    } else {
        // Multiple yards: distribute between main pier and inland areas (all subdivided)
        
        // First yard on main pier (subdivided)
        const mainYard = yards[0];
        const mainSub = subdivideYard(
            mainYard.code,
            [mainPierCenterX, yardY, mainPierCenterZ],
            [defaultYardWidth, yardHeight, defaultYardDepth]
        );
        yardElements.push(...mainSub);
        
        console.log(`Positioned yard ${mainYard.code} at main pier (subdivided into 4)`);
        
        // Remaining yards in inland area, arranged in a grid (each subdivided)
        const remainingYards = yards.slice(1);
        
        // Calculate grid layout
        const yardsPerRow = 2;
        let currentX = -90;
        let currentZ = -100;
        let yardIndex = 0;
        
        remainingYards.forEach((yard) => {
            const smallYardWidth = 50;
            const smallYardDepth = 40;
            
            const subs = subdivideYard(
                yard.code,
                [currentX, yardY, currentZ],
                [smallYardWidth, yardHeight, smallYardDepth]
            );
            yardElements.push(...subs);
            
            console.log(`Positioned yard ${yard.code} at inland [${currentX}, ${yardY}, ${currentZ}] (subdivided into 4)`);
            
            // Move to next position
            yardIndex++;
            if (yardIndex % yardsPerRow === 0) {
                // Move to next row
                currentX = -90;
                currentZ += smallYardDepth + spacingBetweenYards;
            } else {
                // Move to next column
                currentX += smallYardWidth + spacingBetweenYards;
            }
        });
    }
    
    console.log(`Generated ${yardElements.length} yard layout elements (${yards.length} yards × 4 subdivisions each)`);
    return yardElements;
};

