    import React, { useState, useEffect } from 'react';
    import PortScene from '../components/visualization/PortScene';
    
    import {
        getPortLayout,
        getApprovedVesselVisits,
        getResources,
        getAllVesselTypes,
        getVesselByImo,
        getDockById,
        getAllDocks
    } from '../services/apiService';
    import { generateDockLayout } from '../services/dockLayoutService';
    import type {
        PortLayout,
        RenderableVessel,
        RenderableResource,
        VesselType,
        LayoutElement,
        VesselVisit,
    } from '../domain/types';
    import type { Resource } from '../domain/resource/resource.model';
    
    const VisualizationPage: React.FC = () => {
        const [layout, setLayout] = useState<PortLayout | null>(null); // Store response in PortLayout type
        const [vessels, setVessels] = useState<RenderableVessel[]>([]);
        const [resources, setResources] = useState<RenderableResource[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [selectedLayout, setSelectedLayout] = useState('layout1'); // Handle layout switching via selectedLayout dropdown
        useEffect(() => {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Implement getPortLayout(layoutId) API call
                    // Fetch approved vessel visits via getApprovedVesselVisits()
                    // 1. Buscar todos os dados em paralelo
                    const [layoutData, approvedVisits, allResources, vesselTypes, backendDocks] = await Promise.all([
                        getPortLayout(selectedLayout),
                        getApprovedVesselVisits(),
                        getResources(),
                        getAllVesselTypes(),
                        getAllDocks(), // Fetch docks from backend
                    ]);
    
                    console.log('Backend docks fetched:', backendDocks);
    
                    // Generate dynamic dock layout elements from backend docks
                    const dynamicDockElements = generateDockLayout(backendDocks);
                    
                    console.log('Dynamic dock elements generated:', dynamicDockElements);
                    
                    // Remove static docks from layout and add dynamic ones
                    const layoutElementsWithoutDocks = layoutData.elements.filter(el => el.type !== 'dock');
                    const finalLayoutElements = [...layoutElementsWithoutDocks, ...dynamicDockElements];
                    
                    console.log('Final layout elements:', finalLayoutElements);
                    
                    // Update layout with dynamic docks
                    const updatedLayout: PortLayout = {
                        elements: finalLayoutElements
                    };
                    
                    setLayout(updatedLayout); // Store response in PortLayout type
    
                    // Log layout structure for debugging
                    console.debug('Port layout elements:', updatedLayout.elements);
                    console.debug('Dynamic docks created:', dynamicDockElements.length);
                    console.debug('Approved vessel visits from API:', approvedVisits);
    
                    // Extract layout.elements and map by ID
                    const layoutElementsMap = new Map<string, LayoutElement>(updatedLayout.elements.map((el: LayoutElement) => [el.id, el]));
                    const vesselTypesMap = new Map<string, VesselType>(vesselTypes.map((vt: VesselType) => [vt.id, vt]));
    
                    // 2. Processar Navios (Vessels)
                    const renderableVessels: RenderableVessel[] = [];
                    for (const visit of approvedVisits as VesselVisit[]) {
                        // Apenas visualizar navios que têm uma doca atribuída
                        if (visit.assignedDockId) {
                            // Match assignedDockId to layout element by ID
                            // Primeiro tentamos encontrar a doca diretamente pelo ID retornado na layout
                            let dock = layoutElementsMap.get(visit.assignedDockId);
    
                            // Se não houver correspondência direta (por exemplo o backend devolve um GUID de Dock),
                            // tentamos consultar o endpoint /api/Dock/{id} para obter o nome da doca e procurar pelo elemento do layout
                            
                            // If no match, resolve dock name via getDockById(visit.assignedDockId)
                            if (!dock) {
                                try {
                                    const dockDto = await getDockById(visit.assignedDockId);
                                    // O layout usa ids textuais como "Dock A" — o backend devolve Id (GUID) e Name (ex. "Dock A").
                                    // Procuramos pelo elemento com id igual ao name ou com name igual ao name.
                                    if (dockDto?.name) {
                                        dock = layoutElementsMap.get(dockDto.name) || layoutData.elements.find((el: LayoutElement) => el.name === dockDto.name);
                                    }
                                } catch (err) {
                                    // Se o backend não encontrar a doca ou ocorrer erro, apenas ignoramos e não renderizamos este navio
                                    console.warn('Could not resolve assignedDockId to layout element:', visit.assignedDockId, err);
                                }
                            }
    
                            if (dock && dock.type === 'dock') {
                                // Fetch vessel details via getVesselByImo(visit.vesselImo)
                                const vesselDetails = await getVesselByImo(visit.vesselImo);
                                
                                // Fetch vessel types via getAllVesselTypes() and map size
                                const vesselType = vesselTypesMap.get(vesselDetails.vesselTypeId ?? '');
    
                                // Compute vessel size from vesselType.maxBays and maxRows
                                // Estimar o tamanho do navio a partir do seu tipo (simplificado)
                                const vesselSize: [number, number, number] = [
                                    vesselType ? vesselType.maxBays * 0.9 : 10, // Comprimento (Length)
                                    6, // Altura (Height) - valor fixo
                                    vesselType ? vesselType.maxRows * 0.9 : 3  // Largura (Width)
                                ];
    
                                // Position vessels relative to dock geometry
                                // Calcular a posição do navio para atracar ao lado da doca
                                const vesselPositionComputed: [number, number, number] = [
                                    dock.position[0] - (dock.size[0] / 2) - (vesselSize[2] / 2) - 0.2, // X: ao lado da doca
                                    vesselSize[1] / 2, // Y: para o navio "flutuar" no plano
                                    dock.position[2] // Z: alinhado com o centro da doca
                                ];
    
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
                                    basePosition[1] + offsetX,
                                    basePosition[1] + offsetY,
                                    basePosition[2] + offsetZ,
                                ];
    
                                // Use procedural geometry for vessels (position now honors overrides/offsets)
                                // Force rotation: 90° to the left (negative Y rotation)
                                const left90 = -Math.PI / 2; // -1.57079632679
                                const rotation: [number, number, number] = [0, left90, 0];
    
                                renderableVessels.push({
                                    id: visit.id,
                                    imo: visit.vesselImo,
                                    name: vesselDetails.name,
                                    position: finalPosition,
                                    size: vesselSize,
                                    modelUrl: vesselType?.modelPath ?? undefined, // Optional model path
                                    rotation,
                                });
                            }
                        }
                    }
                    setVessels(renderableVessels);
    
                    // Fetch and render cranes (procedural geometry)
                    // Fetch resources via getResources() and filter by crane type
                    // 3. Processar Recursos (Gruas)
                    const renderableResources: RenderableResource[] = [];
                    for (const r of (allResources as Resource[])) {
                        if (!r.assignedArea || !r.kind.toLowerCase().includes('crane')) continue;
    
                        // Try to match assignedArea to layout element by id first
                        let area = layoutElementsMap.get(r.assignedArea!);
    
                        // Fallback: some resources store assignedArea as a GUID while layout elements use the dock name.
                        // Try resolving with getDockById and match by name if initial lookup failed.
                        if (!area) {
                            try {
                                const dockDto = await getDockById(r.assignedArea!);
                                if (dockDto?.name) {
                                    area = layoutElementsMap.get(dockDto.name) || layoutData.elements.find((el: LayoutElement) => el.name === dockDto.name);
                                }
                            } catch (err) {
                                console.warn('Could not resolve resource.assignedArea to layout element:', r.assignedArea, err);
                            }
                        }
    
                        if (!area) continue; // still couldn't resolve area
    
                        let resourceSize: [number, number, number];
                        let resourcePosition: [number, number, number];
    
                        if (area.type === 'dock') {
                            // Ship-to-Shore (STS) Crane
                            // Use a small base height: models scale internally (e.g. towerHeight = size[1] * 8)
                            resourceSize = [1, 1.2, area.size[2] * 0.8]; // thin, moderate height, span-wise length
                            resourcePosition = [area.position[0], resourceSize[1] / 2, area.position[2]];
                        } else if (area.type === 'yard') {
                            // Yard Crane (RTG/RMG)
                            resourceSize = [area.size[0] * 0.8, 1.2, 1]; // wide, moderate height, thin
                            resourcePosition = [area.position[0], resourceSize[1] / 2, area.position[2]];
                        } else {
                            // Don't render cranes for unknown area types; skip this resource but continue processing others
                            continue;
                        }
    
                        renderableResources.push({
                            id: area.id,
                            code: r.code,
                            kind: r.kind,
                            position: resourcePosition,
                            size: resourceSize,
                            modelUrl: r.kind.toLowerCase().includes('sts') ? '/models/sts-crane.glb' : undefined
                        } as RenderableResource);
                    }
    
                    // DEBUG: log constructed renderable resources to help diagnose missing cranes
                    console.debug('VisualizationPage: constructed renderableResources =', renderableResources);
    
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
                            <PortScene layoutElements={layout.elements} vessels={vessels} resources={resources} />
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    export default VisualizationPage;
