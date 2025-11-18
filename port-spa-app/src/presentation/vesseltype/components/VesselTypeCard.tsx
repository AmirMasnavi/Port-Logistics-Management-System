// src/presentation/vesselType/components/VesselTypeCard.tsx
import React from 'react';
import type { VesselType } from '../../../domain/vesselType/vesselType.model';
import { Package, Layers, Edit, Trash2 } from 'lucide-react';

interface VesselTypeCardProps {
    vesselType: VesselType;
    onEdit: () => void;
    onDelete: () => void;
}

const VesselTypeCard: React.FC<VesselTypeCardProps> = ({
                                                           vesselType,
                                                           onEdit,
                                                           onDelete,
                                                       }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{vesselType.name}</h2>
                    <p className="text-gray-600 text-sm mt-1">{vesselType.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-100">
                <SpecItem
                    icon={Package}
                    label="Capacity"
                    value={`${vesselType.capacity}`}
                    unit="TEU"
                />
                <SpecItem
                    icon={Layers}
                    label="Max Rows"
                    value={`${vesselType.maxRows}`}
                    unit="rows"
                />
                <SpecItem
                    icon={Layers}
                    label="Max Bays"
                    value={`${vesselType.maxBays}`}
                    unit="bays"
                />
                <SpecItem
                    icon={Layers}
                    label="Max Tiers"
                    value={`${vesselType.maxTiers}`}
                    unit="tiers"
                />
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

export default VesselTypeCard;