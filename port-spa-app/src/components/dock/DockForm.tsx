import React, { useState, useEffect } from 'react';
import { dockService } from '../../app/dock/dock.service.instance';
import { getAllVesselTypes } from '../../services/apiService';
import type { Dock } from '../../domain/dock/dock.model';
import type { DockCreateDto } from '../../infrastructure/repositories/dock/dock.dto';
import type { VesselType } from '../../domain/types';
// 1. Importar ícones para as setas do dropdown
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DockFormProps {
    onClose: () => void;
    onSuccess: (newDock: Dock) => void;
    initialData?: Dock | null;
}

const DockForm: React.FC<DockFormProps> = ({ onClose, onSuccess, initialData }) => {
    const [availableVesselTypes, setAvailableVesselTypes] = useState<VesselType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);

    // 2. Estado para controlar se a lista de tipos está aberta ou fechada
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [formData, setFormData] = useState<DockCreateDto>(
        initialData ? {
            id: initialData.id,
            name: initialData.name,
            locationZone: initialData.locationZone,
            locationSection: initialData.locationSection,
            lengthInMeters: initialData.lengthInMeters,
            depthInMeters: initialData.depthInMeters,
            maxDraftInMeters: initialData.maxDraftInMeters,
            numberOfSTSCranes: initialData.numberOfSTSCranes,
            allowedVesselTypeIds: initialData.allowedVesselTypeIds || [],
        } : {
            id: '',
            name: '',
            locationZone: '',
            locationSection: '',
            lengthInMeters: 0,
            depthInMeters: 0,
            maxDraftInMeters: 0,
            numberOfSTSCranes: 0,
            allowedVesselTypeIds: [],
        }
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const numberFields = new Set([
        'lengthInMeters', 'depthInMeters', 'maxDraftInMeters', 'numberOfSTSCranes'
    ]);

    useEffect(() => {
        const fetchTypes = async () => {
            setLoadingTypes(true);
            try {
                const types = await getAllVesselTypes();
                setAvailableVesselTypes(types);
            } catch (err) {
                console.error("Erro ao carregar tipos de navio", err);
            } finally {
                setLoadingTypes(false);
            }
        };
        fetchTypes();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: numberFields.has(name) ? (value === '' ? 0 : Number(value)) : value,
        }));
    };

    const handleVesselTypeToggle = (vesselTypeId: string) => {
        setFormData(prev => {
            const currentIds = prev.allowedVesselTypeIds || [];
            const exists = currentIds.includes(vesselTypeId);

            let newIds;
            if (exists) {
                newIds = currentIds.filter(id => id !== vesselTypeId);
            } else {
                newIds = [...currentIds, vesselTypeId];
            }

            return { ...prev, allowedVesselTypeIds: newIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            let resultDock: Dock;
            if (initialData) {
                resultDock = await dockService.updateDock(initialData.id, formData);
            } else {
                resultDock = await dockService.createDock(formData);
            }
            setIsSubmitting(false);
            onSuccess(resultDock);
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save dock.';
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    // Helper para mostrar quantos estão selecionados no cabeçalho
    const selectedCount = (formData.allowedVesselTypeIds || []).length;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</div>}

            {!initialData && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">ID (Optional)</label>
                    <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        placeholder="Leave empty if auto-generated"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <input type="text" name="locationZone" value={formData.locationZone} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <input type="text" name="locationSection" value={formData.locationSection} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                    <input type="number" name="lengthInMeters" value={formData.lengthInMeters} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Depth (m)</label>
                    <input type="number" name="depthInMeters" value={formData.depthInMeters} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Draft (m)</label>
                    <input type="number" name="maxDraftInMeters" value={formData.maxDraftInMeters} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">STS Cranes</label>
                    <input type="number" name="numberOfSTSCranes" value={formData.numberOfSTSCranes} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required min="0" />
                </div>
            </div>

            {/* 4. SECÇÃO ATUALIZADA: Dropdown de Checkboxes */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Cabeçalho clicável */}
                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                    <div>
                        <span className="block text-sm font-medium text-gray-700">Allowed Vessel Types</span>
                        <span className="text-xs text-gray-500">
                            {selectedCount === 0
                                ? 'None selected'
                                : `${selectedCount} type${selectedCount > 1 ? 's' : ''} selected`}
                        </span>
                    </div>
                    {/* Ícone muda conforme estado */}
                    {isDropdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {/* Conteúdo Condicional (só aparece se isDropdownOpen === true) */}
                {isDropdownOpen && (
                    <div className="p-3 bg-white border-t border-gray-200 max-h-60 overflow-y-auto">
                        {loadingTypes ? (
                            <div className="text-sm text-gray-500 py-2 text-center">Loading types...</div>
                        ) : availableVesselTypes.length === 0 ? (
                            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                No vessel types available in the system.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableVesselTypes.map((vt) => (
                                    <label key={vt.id} className="flex items-center space-x-3 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            value={vt.id}
                                            checked={(formData.allowedVesselTypeIds || []).includes(vt.id)}
                                            onChange={() => handleVesselTypeToggle(vt.id)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{vt.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
                </button>
            </div>
        </form>
    );
};

export default DockForm;