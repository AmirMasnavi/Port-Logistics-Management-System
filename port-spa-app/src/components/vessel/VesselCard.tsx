// src/presentation/vessel/components/VesselCard.tsx
import React from 'react';
import type { Vessel } from '../../domain/vessel/vessel.model';
import type { VesselType } from '../../domain/vesselType/vesselType.model';
import { Ship, User, Package, Edit, Trash2 } from 'lucide-react';

interface VesselCardProps {
    vessel: Vessel;
    vesselType?: VesselType;
    onEdit: () => void;
    onDelete: () => void;
}

const VesselCard: React.FC<VesselCardProps> = ({ vessel, vesselType, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Ship className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">{vessel.name}</h2>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">IMO: {vessel.imoNumber}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-100">
                <InfoItem
                    icon={User}
                    label="Operator"
                    value={vessel.operator}
                />
                <InfoItem
                    icon={Package}
                    label="Vessel Type"
                    value={vesselType?.name || 'Unknown'}
                />
            </div>

            {vesselType && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-xs font-medium text-blue-600 mb-2">Type Specifications</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <SpecItem label="Capacity" value={`${vesselType.capacity}`} unit="TEU" />
                        <SpecItem label="Max Rows" value={`${vesselType.maxRows}`} unit="rows" />
                        <SpecItem label="Max Bays" value={`${vesselType.maxBays}`} unit="bays" />
                        <SpecItem label="Max Tiers" value={`${vesselType.maxTiers}`} unit="tiers" />
                    </div>
                </div>
            )}

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

const InfoItem: React.FC<{
    icon: React.ElementType<{ className?: string }>,
    label: string,
    value: string
}> = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {label}
        </div>
        <div className="text-sm font-semibold text-gray-900 mt-1 truncate">
            {value}
        </div>
    </div>
);

const SpecItem: React.FC<{
    label: string,
    value: string,
    unit: string
}> = ({ label, value, unit }) => (
    <div className="flex flex-col">
        <div className="text-xs text-gray-600">{label}</div>
        <div className="text-base font-semibold text-gray-900">
            {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
        </div>
    </div>
);

export default VesselCard;
