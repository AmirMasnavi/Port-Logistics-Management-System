import React, { useState, useEffect } from 'react';
    import PortScene from '../components/visualization/PortScene';
    import { InfoOverlay } from '../components/visualization/InfoOverlay';
    import { useInfoOverlay } from '../components/visualization/useInfoOverlay';
    import { useAuth } from '../auth/AuthProvider';
    
import {
    getPortLayout,
    getApprovedVesselVisits,
    getAllVesselTypes,
    getVesselByImo,
    getDockById,
    getAllDocks,
} from '../services/apiService';
import { vveService } from '../services/vveService';
import type { VveWithMetrics } from '../services/vveService';
import { StorageAreaService } from '../app/storageArea/storageArea.service';
import { storageAreaApiRepository } from '../infrastructure/repositories/storageArea/storageAreaApi.repository';
import { ResourceService } from '../app/resource/resource.service';
import { resourceApiRepository } from '../infrastructure/repositories/resource/resourceApi.repository';
import { generateDockLayout } from '../services/dockLayoutService';
import { generateYardLayout } from '../services/yardLayoutService';
import { generateWarehouseLayout } from '../services/warehouseLayoutService';
    import type {
        PortLayout,
        RenderableVessel,
        RenderableResource,
        VesselType,
        LayoutElement,
        VesselVisit,
    } from '../domain/types';
    import type { Resource } from '../domain/resource/resource.model';

    // Initialize services
    const storageAreaService = new StorageAreaService(storageAreaApiRepository);
    const resourceService = new ResourceService(resourceApiRepository);
    
    const VisualizationPage: React.FC = () => {
        const [layout, setLayout] = useState<PortLayout | null>(null);
        const [vessels, setVessels] = useState<RenderableVessel[]>([]);
        const [resources, setResources] = useState<RenderableResource[]>([]);
        const [vesselStatuses, setVesselStatuses] = useState<VveWithMetrics[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [selectedLayout, setSelectedLayout] = useState('layout1');
        
        // Get user role from auth context
        const { internalRole } = useAuth();
        
        // Initialize info overlay hook
        const { isVisible, selectedElement, elementData, selectElement } = useInfoOverlay();
        
        // Poll for vessel statuses
        useEffect(() => {
            const fetchVesselStatuses = async () => {
                try {
                    // Fetch active VVEs (In Progress)
                    const vves = await vveService.getAllVves({ status: 'In Progress' });
                    console.log('📡 Fetched active vessel statuses:', vves);
                    setVesselStatuses(vves);
                } catch (err) {
                    console.error('Failed to fetch vessel statuses', err);
                }
            };

            fetchVesselStatuses(); // Initial fetch
            const interval = setInterval(fetchVesselStatuses, 5000); // Poll every 5s

            return () => clearInterval(interval);
        }, []);

        useEffect(() => {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    console.log('🚀 ========== STARTING DATA FETCH ==========');
                    console.log('📍 Selected layout:', selectedLayout);
                    
                    // Implement getPortLayout(layoutId) API call
                    // Fetch approved vessel visits via getApprovedVesselVisits()
                    // 1. Buscar todos os dados em paralelo
                    const [layoutData, approvedVisits, allResources, vesselTypes, backendDocks, backendStorageAreas] = await Promise.all([
                        getPortLayout(selectedLayout),
                        getApprovedVesselVisits(),
                        resourceService.fetchAllResources(),
                        getAllVesselTypes(),
                        getAllDocks(), // Fetch docks from backend
                        storageAreaService.fetchAllStorageAreas(), // Fetch storage areas using service
                    ]);

                    console.log('📦 ========== DATA FETCHED FROM BACKEND ==========');
                    console.log('📍 Layout data:', layoutData);
                    console.log('🚢 Approved visits count:', approvedVisits.length);
                    console.log('🚢 Approved visits details:', approvedVisits);
                    console.log('🏗️ Backend docks count:', backendDocks.length);
                    console.log('🏗️ Backend docks details:', backendDocks);
                    console.log('⚙️ Resources count:', allResources.length);
                    console.log('🏷️ Vessel types count:', vesselTypes.length);
                    console.log('📦 Storage areas count:', backendStorageAreas.length);

                    // Generate dynamic dock layout elements from backend docks
                    const dynamicDockElements = generateDockLayout(backendDocks);
                    
                    // Generate dynamic yard layout elements from backend storage areas (Type = "Yard")
                    const dynamicYardElements = generateYardLayout(backendStorageAreas);
                    
                    // Generate dynamic warehouse layout elements from backend storage areas (Type = "Warehouse")
                    const dynamicWarehouseElements = generateWarehouseLayout(backendStorageAreas);
                    
                    console.log('Dynamic dock elements generated:', dynamicDockElements);
                    console.log('Dynamic yard elements generated:', dynamicYardElements);
                    console.log('Dynamic warehouse elements generated:', dynamicWarehouseElements);
                    
                    // Remove static docks, yards, and buildings from layout and add dynamic ones
                    const layoutElementsWithoutDynamicTypes = layoutData.elements.filter(
                        el => el.type !== 'dock' && el.type !== 'yard' && el.type !== 'building'
                    );
                    const finalLayoutElements = [
                        ...layoutElementsWithoutDynamicTypes, 
                        ...dynamicDockElements,
                        ...dynamicYardElements,
                        ...dynamicWarehouseElements
                    ];
                    
                    console.log('Final layout elements:', finalLayoutElements);
                    
                    // Update layout with dynamic docks
                    const updatedLayout: PortLayout = {
                        elements: finalLayoutElements
                    };
                    
                    setLayout(updatedLayout); // Store response in PortLayout type
    
                    // Log layout structure for debugging
                    console.debug('Port layout elements:', updatedLayout.elements);
                    console.debug('Dynamic docks created:', dynamicDockElements.length);
                    console.debug('Dynamic yards created:', dynamicYardElements.length);
                    console.debug('Approved vessel visits from API:', approvedVisits);
    
                    // Extract layout.elements and map by ID
                    const layoutElementsMap = new Map<string, LayoutElement>(updatedLayout.elements.map((el: LayoutElement) => [el.id, el]));
                    const vesselTypesMap = new Map<string, VesselType>(vesselTypes.map((vt: VesselType) => [vt.id, vt]));
    
                    // 2. Processar Navios (Vessels)
                    console.log('🚢 ========== PROCESSING VESSELS ==========');
                    console.log('🚢 Total approved visits to process:', approvedVisits.length);
                    
                    const renderableVessels: RenderableVessel[] = [];
                    
                    for (const visit of approvedVisits as VesselVisit[]) {
                        console.log(`\n🚢 --- Processing Visit ${visit.id} ---`);
                        console.log('  Full visit object:', visit);
                        console.log('  assignedDockId:', visit.assignedDockId);
                        console.log('  vesselImo:', visit.vesselImo);
                        console.log('  status:', visit.status);
                        
                        // Apenas visualizar navios que têm uma doca atribuída
                        if (!visit.assignedDockId) {
                            console.warn(`  ⚠️ No assignedDockId - SKIPPING this vessel`);
                            continue;
                        }
                        
                        // Match assignedDockId to layout element by ID (GUID)
                        // O dockLayoutService já usa o GUID como id do elemento de layout
                        let dock = layoutElementsMap.get(visit.assignedDockId);
                        
                        console.log(`  🔍 Looking for dock with ID: ${visit.assignedDockId}`);
                        console.log(`  Direct GUID match result:`, dock ? `✓ Found dock "${dock.name}"` : '✗ Not found');

                        // Se não encontrar diretamente pelo GUID, o dock pode não existir no backend
                        // ou o layout pode não ter sido carregado corretamente
                        if (!dock) {
                            console.error(`  ❌ Could not find dock with ID ${visit.assignedDockId} in layout`);
                            console.error(`  Available dock IDs in layout (${layoutElementsMap.size} total):`, 
                                Array.from(layoutElementsMap.entries())
                                    .filter(([_, el]) => el.type === 'dock')
                                    .map(([id, el]) => `\n    - ${id} (name: "${el.name}")`)
                                    .join('')
                            );
                            console.error(`  🔍 Checking if assignedDockId exists in backendDocks...`);
                            const dockExistsInBackend = backendDocks.find(d => d.id === visit.assignedDockId);
                            if (dockExistsInBackend) {
                                console.error(`  ✓ Dock EXISTS in backend: ${dockExistsInBackend.name}`);
                                console.error(`  ❌ BUT was NOT added to layout! Check dockLayoutService.`);
                            } else {
                                console.error(`  ✗ Dock does NOT exist in backend. Invalid assignedDockId!`);
                            }
                            continue;
                        }

                        if (dock.type !== 'dock') {
                            console.warn(`  ⚠️ Element ${visit.assignedDockId} is not a dock (type: ${dock.type}). Skipping vessel.`);
                            continue;
                        }
                        
                        console.log(`  ✓ Dock found and validated: "${dock.name}" (type: ${dock.type})`);
                        console.log(`  Dock position:`, dock.position);
                        console.log(`  Dock size:`, dock.size);
                        
                        // Fetch vessel details via getVesselByImo(visit.vesselImo)
                        console.log(`  📡 Fetching vessel details for IMO: ${visit.vesselImo}...`);
                        const vesselDetails = await getVesselByImo(visit.vesselImo);
                        
                        if (!vesselDetails) {
                            console.error(`  ❌ Could not fetch vessel details for IMO ${visit.vesselImo}. API returned null/undefined.`);
                            continue;
                        }
                        
                        console.log(`  ✓ Vessel details fetched:`, vesselDetails);
                        console.log(`    - Name: ${vesselDetails.name}`);
                        console.log(`    - VesselTypeId: ${vesselDetails.vesselTypeId}`);
                        
                        // Fetch vessel types via getAllVesselTypes() and map size
                        const vesselType = vesselTypesMap.get(vesselDetails.vesselTypeId ?? '');
                        
                        if (vesselDetails.vesselTypeId && !vesselType) {
                            console.warn(`  ⚠️ Vessel type ${vesselDetails.vesselTypeId} not found in vesselTypesMap`);
                        }
                        
                        console.log(`  Vessel type:`, vesselType || 'Using defaults');

                        // VESSEL SIZE MULTIPLIER: Increase this to make vessels bigger
                        const VESSEL_SIZE_MULTIPLIER = 20.0; // Default was 0.9, now 3x bigger!

                        // Compute vessel size from vesselType.maxBays and maxRows
                        // Estimar o tamanho do navio a partir do seu tipo (simplificado)
                        const vesselSize: [number, number, number] = [
                            vesselType ? vesselType.maxBays * VESSEL_SIZE_MULTIPLIER : 30, // Comprimento (Length) - increased from 10
                            18, // Altura (Height) - increased from 6
                            vesselType ? vesselType.maxRows * VESSEL_SIZE_MULTIPLIER : 9  // Largura (Width) - increased from 3
                        ];
                        
                        console.log(`  Calculated vessel size (with ${VESSEL_SIZE_MULTIPLIER}x multiplier):`, vesselSize);
                        console.log(`  MaxBays: ${vesselType?.maxBays || 1}, MaxRows: ${vesselType?.maxRows || 1}`);

                        // Position vessels relative to dock geometry
                        // Determine if dock is on left or right side (negative X = left, positive X = right)
                        const isLeftSide = dock.position[0] < 0;
                        
                        // Calculate Z-axis offset based on vessel length (maxBays)
                        // Longer vessels need to be positioned further from the dock center to avoid land overlap
                        const maxBays = vesselType?.maxBays || 1;
                        const zOffsetPerBay = 20; // Adjust this value to control how much to offset per bay
                        const zOffset = (maxBays - 1) * zOffsetPerBay; // No offset for maxBays=1, increase for larger vessels
                        
                        // Calculate X-axis offset based on vessel width (maxRows)
                        // Wider vessels need to be brought closer to the dock
                        const maxRows = vesselType?.maxRows || 1;
                        const xOffsetPerRow = 7; // Adjust this value to control how much to offset per row
                        const xOffset = (maxRows - 1) * xOffsetPerRow; // No offset for maxRows=1, increase for wider vessels
                        
                        console.log(`  Z-axis offset calculation: maxBays=${maxBays}, zOffsetPerBay=${zOffsetPerBay}, totalZOffset=${zOffset}`);
                        console.log(`  X-axis offset calculation: maxRows=${maxRows}, xOffsetPerRow=${xOffsetPerRow}, totalXOffset=${xOffset}`);
                        
                        // For left side: vessel goes further left
                        // For right side: vessel goes further right
                        const vesselPositionComputed: [number, number, number] = [
                            isLeftSide 
                                ? dock.position[0] - (dock.size[0] / 2) - (vesselSize[2] / 2) + 5.2 + xOffset // Left: add offset to bring closer
                                : dock.position[0] + (dock.size[0] / 2) + (vesselSize[2] / 2) - 5.2 - xOffset, // Right: subtract offset to bring closer
                            vesselSize[1] / 2, // Y: para o navio "flutuar" no plano
                            dock.position[2] + zOffset // Z: alinhado com o centro da doca + offset based on vessel length
                        ];
                        
                        console.log(`  Computed vessel position:`, vesselPositionComputed);

                        // Determine if the visit provides an absolute position override (array or separate coords)
                        let visitPosition: [number, number, number] | undefined = undefined;
                        if ((visit as any).position && Array.isArray((visit as any).position) && (visit as any).position.length === 3) {
                            visitPosition = (visit as any).position as [number, number, number];
                        } else if ((visit as any).position_x != null && (visit as any).position_y != null && (visit as any).position_z != null) {
                            visitPosition = [(visit as any).position_x, (visit as any).position_y, (visit as any).position_z];
                        }

                        // Base position: either the visit-provided absolute position, or the computed one
                        const basePosition: [number, number, number] = visitPosition ?? vesselPositionComputed;

                        // Apply optional offsets (visit.offset_x/offset_y/offset_z or visit.offset.{x,y,z})
                        const offsetX = (visit as any).offset_x ?? (visit as any).offset?.x ?? 0;
                        const offsetY = (visit as any).offset_y ?? (visit as any).offset?.y ?? 0;
                        const offsetZ = (visit as any).offset_z ?? (visit as any).offset?.z ?? 0;

                        const finalPosition: [number, number, number] = [
                            basePosition[0] + offsetX,
                            basePosition[1] + offsetY,
                            basePosition[2] + offsetZ,
                        ];
                        
                        console.log(`  Final vessel position (with offsets):`, finalPosition);

                        // Use procedural geometry for vessels (position now honors overrides/offsets)
                        // Force rotation: 90° to the left (negative Y rotation)
                        const left90 = -Math.PI / 2; // -1.57079632679
                        const rotation: [number, number, number] = [0, left90, 0];

                        const renderableVessel = {
                            id: visit.id || visit.vesselImo, // Use IMO as fallback if visit.id is undefined
                            imo: visit.vesselImo,
                            name: vesselDetails.name,
                            position: finalPosition,
                            size: vesselSize,
                            modelUrl: vesselType?.modelPath ?? undefined, // Optional model path
                            rotation,
                        };
                        
                        console.log(`  ✅ VESSEL ADDED TO RENDERABLE LIST:`);
                        console.log(`    - ID: ${renderableVessel.id}`);
                        console.log(`    - Name: ${renderableVessel.name}`);
                        console.log(`    - IMO: ${renderableVessel.imo}`);
                        console.log(`    - Position:`, renderableVessel.position);
                        console.log(`    - Size:`, renderableVessel.size);
                        console.log(`    - Rotation:`, renderableVessel.rotation);
                        console.log(`    - ModelUrl:`, renderableVessel.modelUrl || 'None (procedural)');
                        
                        renderableVessels.push(renderableVessel);
                    }
                    
                    console.log('\n🚢 ========== VESSEL PROCESSING COMPLETE ==========');
                    console.log(`🚢 Total vessels added: ${renderableVessels.length} out of ${approvedVisits.length} visits`);
                    console.log('🚢 Final renderable vessels array:', renderableVessels);
                    
                    // Check for duplicate IDs
                    const vesselIds = renderableVessels.map(v => v.id);
                    const uniqueIds = new Set(vesselIds);
                    if (vesselIds.length !== uniqueIds.size) {
                        console.error('⚠️ WARNING: Duplicate vessel IDs detected!');
                        console.error('All IDs:', vesselIds);
                        const duplicates = vesselIds.filter((id, index) => vesselIds.indexOf(id) !== index);
                        console.error('Duplicate IDs:', [...new Set(duplicates)]);
                    } else {
                        console.log('✅ All vessel IDs are unique');
                    }
                    
                    // Log each vessel's details
                    renderableVessels.forEach((v, index) => {
                        console.log(`  Vessel ${index + 1}: ID=${v.id}, Name=${v.name}, Position=[${v.position.join(', ')}]`);
                    });
                    
                    setVessels(renderableVessels);
                    console.log('🚢 Vessels state updated via setVessels()');
                    console.log('🚢 Vessels array length passed to setVessels:', renderableVessels.length);
    
                    // Fetch and render cranes (procedural geometry)
                    // Fetch resources via getResources() and filter by crane type
                    // 3. Processar Recursos (Gruas)
                    console.log('=== CRANE PROCESSING DEBUG ===');
                    console.log('Total resources fetched:', allResources.length);
                    console.log('All resources:', allResources);
                    
                    const renderableResources: RenderableResource[] = [];
                    for (const r of (allResources as Resource[])) {
                        console.log(`Processing resource: ${r.code}, kind: ${r.kind}, assignedArea: ${r.assignedArea}`);
                        
                        if (!r.assignedArea) {
                            console.warn(`Resource ${r.code} has no assignedArea - SKIPPING`);
                            continue;
                        }
                        
                        if (!r.kind.toLowerCase().includes('crane')) {
                            console.log(`Resource ${r.code} is not a crane (kind: ${r.kind}) - SKIPPING`);
                            continue;
                        }
                        
                        console.log(`✓ Resource ${r.code} is a crane with assigned area ${r.assignedArea}`);
    
                        // Try to match assignedArea to layout element by id first
                        // For yards, the assignedArea might be the base code (e.g., "YARD-01") 
                        // but the layout now has subdivisions (e.g., "YARD-01-1", "YARD-01-2", etc.)
                        let area = layoutElementsMap.get(r.assignedArea!);
                        console.log(`  Trying to match assignedArea "${r.assignedArea}" in layoutElementsMap...`);
                        console.log(`  Direct match result:`, area);
                        
                        // If no direct match, try finding a subdivision with this base code
                        if (!area) {
                            // Try to find any yard subdivision that starts with this assignedArea
                            const possibleSubdivision = finalLayoutElements.find((el: LayoutElement) => 
                                el.type === 'yard' && 
                                (el.id === r.assignedArea || el.id.startsWith(r.assignedArea + '-'))
                            );
                            
                            if (possibleSubdivision) {
                                console.log(`  Found yard subdivision match: ${possibleSubdivision.id}`);
                                area = possibleSubdivision;
                            }
                        }

                        // Fallback: some resources store assignedArea as a GUID while layout elements use the dock name.
                        // Try resolving with getDockById and match by name if initial lookup failed.
                        if (!area) {
                            console.log(`  No direct match. Attempting getDockById fallback...`);
                            try {
                                const dockDto = await getDockById(r.assignedArea!);
                                console.log(`  getDockById returned:`, dockDto);
                                if (dockDto?.name) {
                                    area = layoutElementsMap.get(dockDto.name) || finalLayoutElements.find((el: LayoutElement) => el.name === dockDto.name);
                                    console.log(`  Matched by dock name "${dockDto.name}":`, area);
                                }
                            } catch (err) {
                                console.warn('Could not resolve resource.assignedArea to layout element:', r.assignedArea, err);
                            }
                        }

                        if (!area) {
                            console.error(`✗ Could not resolve area for crane ${r.code} - SKIPPING. Available layout element IDs:`, Array.from(layoutElementsMap.keys()));
                            continue;
                        }
                        
                        console.log(`  ✓ Successfully resolved area:`, area);
    
                        // Check if this is a yard - if so, we need to find all subdivisions and create a crane for each
                        const isYard = area.type === 'yard';
                        let areasToProcess: LayoutElement[] = [area];
                        
                        if (isYard) {
                            // Extract the base yard code by removing any subdivision suffix (-1, -2, -3, -4)
                            // Examples: "YARD-01-1" -> "YARD-01", "YARD-01" -> "YARD-01", "YARD-03" -> "YARD-03"
                            const baseYardCode = r.assignedArea!.replace(/-[1-4]$/, '');
                            
                            console.log(`  This is a YARD crane. Base yard code extracted: "${baseYardCode}" from assignedArea "${r.assignedArea}"`);
                            console.log(`  Original crane resource code: ${r.code}`);
                            console.log(`  Looking for subdivisions: ${baseYardCode}-1, ${baseYardCode}-2, ${baseYardCode}-3, ${baseYardCode}-4`);
                            
                            // Find all 4 subdivisions of this yard (baseCode-1, baseCode-2, baseCode-3, baseCode-4)
                            // NOTE: We only look for subdivisions (-1, -2, -3, -4), NOT the base code itself
                            // because yards are always subdivided into 4 sections by yardLayoutService
                            const subdivisions = finalLayoutElements.filter((el: LayoutElement) => 
                                el.type === 'yard' && 
                                (el.id === `${baseYardCode}-1` || 
                                 el.id === `${baseYardCode}-2` || 
                                 el.id === `${baseYardCode}-3` || 
                                 el.id === `${baseYardCode}-4`)
                            );
                            
                            console.log(`  Available yard IDs in layout:`, finalLayoutElements.filter(e => e.type === 'yard').map(e => e.id));
                            
                            if (subdivisions.length === 4) {
                                console.log(`  ✓ Found all 4 yard subdivisions for base yard "${baseYardCode}":`, subdivisions.map(s => s.id));
                                console.log(`  Will create 4 crane instances (one per subdivision)`);
                                areasToProcess = subdivisions;
                            } else if (subdivisions.length > 0) {
                                console.warn(`  ⚠ Found only ${subdivisions.length}/4 subdivisions for "${baseYardCode}":`, subdivisions.map(s => s.id));
                                areasToProcess = subdivisions;
                            } else {
                                console.error(`  ✗ No subdivisions found for base yard "${baseYardCode}"!`);
                                console.error(`  Expected to find: ${baseYardCode}-1, ${baseYardCode}-2, ${baseYardCode}-3, ${baseYardCode}-4`);
                                console.error(`  This shouldn't happen - check yardLayoutService.ts`);
                                // Fallback to original area
                            }
                        } else {
                            console.log(`  This is a DOCK crane (not subdivided)`);
                        }
                        
                        // Process each area (for yards, this will be all 4 subdivisions)
                        for (const processArea of areasToProcess) {
                            let resourceSize: [number, number, number];
                            let resourcePosition: [number, number, number];

                            if (processArea.type === 'dock') {
                                // Ship-to-Shore (STS) Crane
                                console.log(`  Area type is 'dock' - creating STS crane`);
                                // Use a small base height: models scale internally (e.g. towerHeight = size[1] * 8)
                                resourceSize = [1, 1.2, processArea.size[2] * 0.8]; // thin, moderate height, span-wise length
                                resourcePosition = [processArea.position[0], resourceSize[1] / 2, processArea.position[2]];
                            } else if (processArea.type === 'yard') {
                                // Yard Crane (RTG/RMG)
                                console.log(`  Area type is 'yard' - creating yard crane for ${processArea.id}`);
                                resourceSize = [processArea.size[0] * 0.95, 2.5, 3]; // wide, moderate height, thin
                                resourcePosition = [processArea.position[0], resourceSize[1] / 2, processArea.position[2]];
                            } else {
                                // Don't render cranes for unknown area types; skip this resource but continue processing others
                                console.warn(`  Area type is '${processArea.type}' - not supported for cranes, SKIPPING`);
                                continue;
                            }
                            
                            console.log(`  Calculated position for ${processArea.id}:`, resourcePosition);
                            console.log(`  Calculated size:`, resourceSize);

                            const renderableResource = {
                                id: processArea.id,
                                code: `${r.code}@${processArea.id}`, // Unique code for each subdivision
                                kind: r.kind,
                                position: resourcePosition,
                                size: resourceSize,
                                modelUrl: r.kind.toLowerCase().includes('sts') ? '/models/sts-crane.glb' : undefined
                            } as RenderableResource;
                            
                            console.log(`  ✓✓ ADDED renderable resource:`, renderableResource);
                            renderableResources.push(renderableResource);
                        }
                    }

                    // DEBUG: log constructed renderable resources to help diagnose missing cranes
                    console.log('=== FINAL RENDERABLE RESOURCES ===');
                    console.debug('VisualizationPage: constructed renderableResources =', renderableResources);
                    console.log('Total renderable cranes:', renderableResources.length);
                    
                    // Group by original resource code to show duplication
                    const cranesByOriginalCode = new Map<string, RenderableResource[]>();
                    renderableResources.forEach(r => {
                        const originalCode = r.code.split('@')[0]; // Extract base code before @
                        if (!cranesByOriginalCode.has(originalCode)) {
                            cranesByOriginalCode.set(originalCode, []);
                        }
                        cranesByOriginalCode.get(originalCode)!.push(r);
                    });
                    
                    console.log('=== CRANE DUPLICATION SUMMARY ===');
                    cranesByOriginalCode.forEach((cranes, originalCode) => {
                        if (cranes.length > 1) {
                            console.log(`📦 Crane "${originalCode}" was duplicated into ${cranes.length} instances:`);
                            cranes.forEach(c => console.log(`   - ${c.code} at area ${c.id}`));
                        } else {
                            console.log(`📦 Crane "${originalCode}" has 1 instance at area ${cranes[0].id}`);
                        }
                    });
    
                    setResources(renderableResources);
    
                } catch (e) {
                    // Handle error state gracefully
                  
                    console.error(e);
                } finally {
                    // Handle loading state gracefully
                    setLoading(false);
                }
            };
    
            fetchData();
        }, [selectedLayout]); // Reacts to layout switching via selectedLayout dropdown
        
        const containerStyle: React.CSSProperties = {
            height: '100%',
            width: '100%',
            backgroundColor: '#f0f0f0',
            overflowX: 'hidden'
        };
    
        return (
            // Make this card full-bleed inside <main> by cancelling its padding (p-4 ~ 1rem)
            <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-md -m-4">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Port 3D Visualization</h2>
                    <div className="flex items-center gap-4">
                        <label htmlFor="layout-select" className="text-sm font-medium">Select Layout:</label>
                        <select
                            id="layout-select"
                            value={selectedLayout}
                            onChange={(e) => setSelectedLayout(e.target.value)}
                            className="p-2 border rounded-md text-sm"
                        >
                            <option value="layout1">Layout 1 (Simple)</option>
                            <option value="layout2">Layout 2 (Complex)</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 relative" style={containerStyle}>
                    {/* Handle loading and error states gracefully */}
                    {loading && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 text-lg">Loading 3D Scene...</div>}
                    {error && <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 z-10 p-4">{error}</div>}
    
                    {/*  Render layout.elements in <PortScene /> as base structures */}
                    {!loading && !error && layout && (
                        // Put the PortScene inside an absolute inset container so the Canvas (which is positioned absolutely by r3f)
                        // will size itself to this element and be clipped by the parent's overflow:hidden
                        <div className="absolute inset-0">
                            <PortScene 
                                layoutElements={layout.elements} 
                                vessels={vessels} 
                                resources={resources} 
                                vesselStatuses={vesselStatuses}
                                onElementSelect={selectElement}
                            />
                        </div>
                    )}
                    
                    {/* Render the InfoOverlay component */}
                    <InfoOverlay 
                        isVisible={isVisible} 
                        elementType={selectedElement?.type || null}
                        elementData={elementData} 
                        userRole={internalRole}
                    />
                </div>
            </div>
        );
    };
    
    export default VisualizationPage;
