// src/presentation/vesselType/components/VesselTypeForm.tsx
import React, { useState } from 'react';
import { vesselTypeService } from '../../../app/vesselType/vesselType.service.instance';
import type { VesselType } from '../../../domain/vesselType/vesselType.model';
import type { CreateVesselTypeDto } from '../../../infrastructure/repositories/vesselType/vesselType.dto';

interface VesselTypeFormProps {
    onClose: () => void;
    onSuccess: (newType: VesselType) => void;
    initialData?: VesselType | null;
}

const VesselTypeForm: React.FC<VesselTypeFormProps> = ({ onClose, onSuccess, initialData }) => {
    const [formData, setFormData] = useState<CreateVesselTypeDto>(
        initialData ? {
            id: initialData.id,
            name: initialData.name,
            description: initialData.description,
            capacity: initialData.capacity,
            maxRows: initialData.maxRows,
            maxBays: initialData.maxBays,
            maxTiers: initialData.maxTiers,
        } : {
            id: '123', 
            name: 'typeA',
            description: 'newDescription',
            capacity: 1,
            maxRows: 1,
            maxBays: 1,
            maxTiers: 1,
        }
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'name' || name === 'description' || name === 'id' ? value : Number(value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            let newVesselType: VesselType;
            if (initialData) {
                newVesselType = await vesselTypeService.updateVesselType(formData.id, formData);
            } else {
                newVesselType = await vesselTypeService.createVesselType(formData);
            }

            setIsSubmitting(false);
            onSuccess(newVesselType);
            onClose();

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save vessel type. Please try again.';
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}

            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity (TEU)</label>
                    <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Rows</label>
                    <input
                        type="number"
                        name="maxRows"
                        value={formData.maxRows}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Bays</label>
                    <input
                        type="number"
                        name="maxBays"
                        value={formData.maxBays}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Tiers</label>
                    <input
                        type="number"
                        name="maxTiers"
                        value={formData.maxTiers}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
                </button>
            </div>
        </form>
    );
};

export default VesselTypeForm;