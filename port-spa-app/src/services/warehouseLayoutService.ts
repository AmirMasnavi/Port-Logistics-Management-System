// Service to generate dynamic warehouse layout from backend data
import type { LayoutElement } from '../domain/types';
import type { StorageArea } from '../domain/storageArea/storageArea.model';

/**
 * Generates layout elements for warehouses based on backend storage area data
 * Places warehouses in inland areas of the port
 * Sizes are dynamically adjusted based on capacity
 */
export const generateWarehouseLayout = (storageAreas: StorageArea[]): LayoutElement[] => {
    // Filter only warehouses (Type = "Warehouse")
    const warehouses = storageAreas.filter(area => area.type.toLowerCase() === 'warehouse');
    
    if (warehouses.length === 0) {
        console.warn('No warehouses found in backend, returning empty layout');
        return [];
    }

    console.log(`Generating layout for ${warehouses.length} warehouses`);

    const warehouseElements: LayoutElement[] = [];
    
    // Port layout constants (matching PortLayoutService.cs)
    const portGroundY = 1.0;
    const portGroundHeight = 6.0;
    
    // Capacity-based sizing constants
    const MIN_CAPACITY = 50;      // Below this, use minimum size
    const MAX_CAPACITY = 5000;    // Above this, use maximum size
    const MIN_SIZE: [number, number, number] = [20, 4, 15];   // Minimum warehouse dimensions [width, height, depth]
    const MAX_SIZE: [number, number, number] = [80, 10, 40];  // Maximum warehouse dimensions [width, height, depth]
    
    /**
     * Calculate warehouse size based on capacity
     * Uses linear interpolation between MIN_SIZE and MAX_SIZE
     */
    const calculateSizeFromCapacity = (capacity: number): [number, number, number] => {
        // Clamp capacity to valid range
        const clampedCapacity = Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, capacity));
        
        // Calculate scaling factor (0 to 1) based on capacity
        const scaleFactor = (clampedCapacity - MIN_CAPACITY) / (MAX_CAPACITY - MIN_CAPACITY);
        
        // Interpolate each dimension
        const width = MIN_SIZE[0] + (MAX_SIZE[0] - MIN_SIZE[0]) * scaleFactor;
        const height = MIN_SIZE[1] + (MAX_SIZE[1] - MIN_SIZE[1]) * scaleFactor;
        const depth = MIN_SIZE[2] + (MAX_SIZE[2] - MIN_SIZE[2]) * scaleFactor;
        
        return [
            Math.round(width * 10) / 10,  // Round to 1 decimal place
            Math.round(height * 10) / 10,
            Math.round(depth * 10) / 10
        ];
    };
    
    // Warehouse positioning strategy:
    // - Use the same positions as the fake buildings for consistency
    // - Place warehouses in the inland area (behind the main pier)
    
    // Default warehouse positions (matching the fake buildings)
    const defaultPositions: [number, number, number][] = [
        [40, portGroundY + (portGroundHeight / 2) + 3, -115],  // Position of "Warehouse 1"
        [-100, portGroundY + (portGroundHeight / 2) + 2, -130], // Position of "Admin Building"
    ];
    
    warehouses.forEach((warehouse, index) => {
        // Calculate size based on capacity
        const size = calculateSizeFromCapacity(warehouse.capacity);
        
        // Use default positions for the first warehouses, then arrange others
        let position: [number, number, number];
        
        if (index < defaultPositions.length) {
            // Adjust Y position based on building height to keep it grounded
            position = [
                defaultPositions[index][0],
                portGroundY + (portGroundHeight / 2) + (size[1] / 2), // Center vertically on ground
                defaultPositions[index][2]
            ];
            
            // Apply specific X-axis offset for the 1st warehouse
            if (index === 0) {
                position[0] += -5; // Adjust this value to move the 1st warehouse left (-) or right (+)
            }
            
            // Apply X-axis offset to the 2nd warehouse only (index 1)
            if (index === 1) {
                position[0] += 75; // Adjust this value to move the 2nd warehouse left (-) or right (+)
            }
        } else {
            // For additional warehouses, place them in a row to the right
            const offsetX = 70 + (index - defaultPositions.length) * 60;
            position = [
                offsetX,
                portGroundY + (portGroundHeight / 2) + (size[1] / 2), // Center vertically on ground
                -115
            ];
            
            // Apply X-axis offset to the 4th warehouse (index 3)
            if (index === 3) {
                position[0] += -25; // Adjust this value to move the 4th warehouse left (-) or right (+)
            }
        }
        
        // Rotation: Only rotate the 2nd and 3rd warehouses (index 1) 180° on Y-axis to face opposite direction
        const rotation: [number, number, number] | undefined = 
            (index === 1 || index === 2) ? [0, Math.PI, 0] : undefined; // Math.PI = 180° rotation
        
        const warehouseElement: LayoutElement = {
            type: 'building',
            id: warehouse.code,
            name: warehouse.code,
            position: position,
            size: size,
            rotation: rotation
        };
        
        warehouseElements.push(warehouseElement);
        
        const rotationInfo = rotation ? ` (rotated 180°)` : '';
        console.log(`Positioned warehouse ${warehouse.code} (capacity: ${warehouse.capacity}) at [${position[0]}, ${position[1]}, ${position[2]}] with size [${size[0]}, ${size[1]}, ${size[2]}]${rotationInfo}`);
    });
    
    console.log(`Generated ${warehouseElements.length} warehouse layout elements`);
    return warehouseElements;
};
