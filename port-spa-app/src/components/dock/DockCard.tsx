import React from 'react';
import type { Dock } from '../../domain/dock/dock.model';
import { Ruler, Anchor, Ship, PenTool, Edit, Trash2 } from 'lucide-react'; // Sugeri ícones mais apropriados

interface DockCardProps {
    dock: Dock;
    onEdit: () => void;
    onDelete: () => void;
}

const DockCard: React.FC<DockCardProps> = ({
                                               dock,
                                               onEdit,
                                               onDelete,
                                           }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{dock.name}</h2>
                    <div className="text-gray-600 text-sm mt-1 flex gap-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">Zone: {dock.locationZone}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">Sec: {dock.locationSection}</span>
                    </div>
                </div>
            </div>

            {/* Grid corrigida para mostrar as unidades certas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-100">
                <SpecItem
                    icon={Ruler}
                    label="Length"
                    value={`${dock.lengthInMeters}`}
                    unit="m"
                />
                <SpecItem
                    icon={Anchor}
                    label="Depth"
                    value={`${dock.depthInMeters}`}
                    unit="m"
                />
                <SpecItem
                    icon={Ship}
                    label="Max Draft"
                    value={`${dock.maxDraftInMeters}`}
                    unit="m"
                />
                <SpecItem
                    icon={PenTool}
                    label="STS Cranes"
                    value={`${dock.numberOfSTSCranes}`}
                    unit="units"
                />
            </div>

            {/* Secção para tipos de navio permitidos (ocupando largura total se necessário) */}
            <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Allowed Vessel Types:</p>
                <p className="text-sm text-gray-800 truncate">
                    {dock.allowedVesselTypeIds && dock.allowedVesselTypeIds.length > 0
                        ? (
                            <span className="font-medium text-blue-600">
                                {dock.allowedVesselTypeIds.length} Types Selected
                            </span>
                        )
                        : <span className="text-gray-400 italic">All types allowed / None specified</span>
                    }
                </p>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                    <Edit className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        </div>
    );
};

const SpecItem: React.FC<{
    icon: React.ElementType<{ className?: string }>,
    label: string,
    value: string,
    unit: string
}> = ({ icon: Icon, label, value, unit }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {label}
        </div>
        <div className="text-lg font-semibold text-gray-900 mt-1">
            {value}
        </div>
        <div className="text-xs text-gray-400">{unit}</div>
    </div>
);

export default DockCard;