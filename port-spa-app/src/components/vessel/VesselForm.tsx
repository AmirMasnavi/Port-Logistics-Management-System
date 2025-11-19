// src/presentation/vessel/components/VesselForm.tsx
import React, { useState, useEffect } from 'react';
import { X, Ship, AlertCircle, CheckCircle2 } from 'lucide-react';
import { vesselService } from '../../app/vessel/vessel.service.instance';
import { vesselTypeService } from '../../app/vesselType/vesselType.service.instance';
import type { Vessel } from '../../domain/vessel/vessel.model';
import type { VesselType } from '../../domain/vesselType/vesselType.model';
import type { CreateVesselDto } from '../../infrastructure/repositories/vessel/vessel.dto';

interface VesselFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Vessel | null;
}

const VesselForm: React.FC<VesselFormProps> = ({ onClose, onSuccess, initialData }) => {
    const [formData, setFormData] = useState<CreateVesselDto>({
        imoNumber: '',
        name: '',
        operator: '',
        vesselTypeId: ''
    });

    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const isEditMode = !!initialData;

    useEffect(() => {
        const loadVesselTypes = async () => {
            try {
                const types = await vesselTypeService.getAllVesselTypes();
                setVesselTypes(types);
            } catch (err) {
                setError('Failed to load vessel types');
            }
        };
        loadVesselTypes();

        if (initialData) {
            setFormData({
                imoNumber: initialData.imoNumber,
                name: initialData.name,
                operator: initialData.operator,
                vesselTypeId: initialData.vesselTypeId
            });
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditMode && initialData) {
                // Use imoNumber as the identifier since it's the business key
                await vesselService.updateVessel(initialData.imoNumber, formData);
            } else {
                await vesselService.createVessel(formData);
            }
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} vessel`);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-green-200 bg-green-50 p-8">
                <div className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                    <p className="text-green-800 font-semibold">Vessel {isEditMode ? 'updated' : 'created'} successfully!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <Ship className="h-6 w-6 text-blue-600" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Vessel' : 'Create New Vessel'}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Register a new vessel in the port system</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">IMO Number</label>
                            <input
                                type="text"
                                name="imoNumber"
                                placeholder="e.g., 9632584"
                                value={formData.imoNumber}
                                onChange={handleInputChange}
                                disabled={loading || isEditMode}
                                maxLength={7}
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">7 digits format{isEditMode ? ', cannot be changed' : ''}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Vessel Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g., MSC Gülsün"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Owner/Operator</label>
                            <input
                                type="text"
                                name="operator"
                                placeholder="e.g., Mediterranean Shipping"
                                value={formData.operator}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Vessel Type</label>
                            <select
                                name="vesselTypeId"
                                value={formData.vesselTypeId}
                                onChange={handleSelectChange}
                                disabled={loading || vesselTypes.length === 0}
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                            >
                                <option value="">{vesselTypes.length === 0 ? "No types available" : "Select a vessel type"}</option>
                                {vesselTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Vessel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VesselForm;
