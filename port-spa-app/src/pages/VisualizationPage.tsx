import React, { useState, useEffect } from 'react';
import PortScene from '../components/visualization/PortScene';
import {
    getPortLayout,
    getApprovedVesselVisits,
    getResources,
    getAllVesselTypes,
    getVesselByImo,
    getDockById
} from '../services/apiService';
import type {
    PortLayout,
    RenderableVessel,
    RenderableResource,
    VesselType,
    LayoutElement,
    VesselVisit,
    Resource
} from '../types';

const VisualizationPage: React.FC = () => {
    const [layout, setLayout] = useState<PortLayout | null>(null);
    const [vessels, setVessels] = useState<RenderableVessel[]>([]);
    const [resources, setResources] = useState<RenderableResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLayout, setSelectedLayout] = useState('layout1');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Buscar todos os dados em paralelo
                const [layoutData, approvedVisits, allResources, vesselTypes] = await Promise.all([
                    getPortLayout(selectedLayout),
                    getApprovedVesselVisits(),
                    getResources(),
                    getAllVesselTypes(),
                ]);

                setLayout(layoutData);

                console.debug('Port layout elements:', layoutData.elements);
                console.debug('Approved vessel visits from API:', approvedVisits);

                const layoutElementsMap = new Map<string, LayoutElement>(layoutData.elements.map((el: LayoutElement) => [el.id, el]));
                const vesselTypesMap = new Map<string, VesselType>(vesselTypes.map((vt: VesselType) => [vt.id, vt]));

                // 2. Processar Navios (Vessels)
                const renderableVessels: RenderableVessel[] = [];
                for (const visit of approvedVisits as VesselVisit[]) {
                    // Apenas visualizar navios que têm uma doca atribuída
                    if (visit.assignedDockId) {
                        // Primeiro tentamos encontrar a doca diretamente pelo ID retornado na layout
                        let dock = layoutElementsMap.get(visit.assignedDockId);

                        // Se não houver correspondência direta (por exemplo o backend devolve um GUID de Dock),
                        // tentamos consultar o endpoint /api/Dock/{id} para obter o nome da doca e procurar pelo elemento do layout
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
                            const vesselDetails = await getVesselByImo(visit.vesselImo);
                            const vesselType = vesselTypesMap.get(vesselDetails.vesselTypeId ?? '');

                            // Estimar o tamanho do navio a partir do seu tipo (simplificado)
                            const vesselSize: [number, number, number] = [
                                vesselType ? vesselType.maxBays * 0.9 : 10, // Comprimento (Length)
                                6, // Altura (Height) - valor fixo
                                vesselType ? vesselType.maxRows * 0.9 : 3  // Largura (Width)
                            ];

                            // Calcular a posição do navio para atracar ao lado da doca
                            const vesselPosition: [number, number, number] = [
                                dock.position[0] - (dock.size[0] / 2) - (vesselSize[2] / 2) - 0.2, // X: ao lado da doca
                                vesselSize[1] / 2, // Y: para o navio "flutuar" no plano
                                dock.position[2] // Z: alinhado com o centro da doca
                            ];

                            renderableVessels.push({
                                id: visit.id,
                                imo: visit.vesselImo,
                                name: vesselDetails.name,
                                position: vesselPosition,
                                size: vesselSize,
                            });
                        }
                    }
                }
                setVessels(renderableVessels);

                // 3. Processar Recursos (Gruas)
                const renderableResources = (allResources as Resource[])
                    .filter((r: Resource) => r.assignedArea && r.kind.toLowerCase().includes('crane'))
                    .map((r: Resource) => {
                        const area = layoutElementsMap.get(r.assignedArea!); // A área (doca ou pátio) onde a grua está
                        if (!area) return null;

                        let resourceSize: [number, number, number];
                        let resourcePosition: [number, number, number];

                        if (area.type === 'dock') { // Ship-to-Shore (STS) Crane
                            resourceSize = [1, 10, area.size[2] * 0.8]; // Fina, alta, e larga (ao longo da doca)
                            resourcePosition = [
                                area.position[0],
                                resourceSize[1] / 2,
                                area.position[2]
                            ];
                        } else if (area.type === 'yard') { // Yard Crane (RTG/RMG)
                            resourceSize = [area.size[0] * 0.8, 6, 1]; // Larga (atravessa o pátio), altura média, fina
                            resourcePosition = [
                                area.position[0],
                                resourceSize[1] / 2,
                                area.position[2]
                            ];
                        } else {
                            return null; // Não renderizar gruas em áreas desconhecidas
                        }

                        return {
                            id: r.assignedArea!,
                            code: r.code,
                            kind: r.kind,
                            position: resourcePosition,
                            size: resourceSize,
                        } as RenderableResource;
                    }).filter((rr): rr is RenderableResource => rr !== null);

                setResources(renderableResources);

            } catch (e) {
                setError('Failed to load visualization data. Is the backend running?');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedLayout]);

    const containerStyle: React.CSSProperties = {
        height: 'calc(100vh - 180px)', // Ajuste a altura conforme necessário
        width: '100%',
        backgroundColor: '#f0f0f0'
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
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
                {loading && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 text-lg">Loading 3D Scene...</div>}
                {error && <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 z-10 p-4">{error}</div>}
                {!loading && !error && layout && (
                    <PortScene layoutElements={layout.elements} vessels={vessels} resources={resources} />
                )}
            </div>
        </div>
    );
};

export default VisualizationPage;

