import React, { useState } from 'react';
import { StorageAreaService } from '../app/storageArea/storageArea.service';
import { storageAreaApiRepository } from '../infrastructure/repositories/storageArea/storageAreaApi.repository';
import type { StorageArea } from '../domain/storageArea/storageArea.model';
import type { StorageAreaCreateDto } from '../infrastructure/repositories/storageArea/storageArea.dto';

// Initialize StorageAreaService
const storageAreaService = new StorageAreaService(storageAreaApiRepository);

interface CreateStorageAreaFormProps {
    onClose: () => void;
    onSuccess: (newArea: StorageArea) => void;
}

const STORAGE_TYPES = ['Yard', 'Warehouse'];

const CreateStorageAreaForm: React.FC<CreateStorageAreaFormProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState<StorageAreaCreateDto>({
        type: 'Yard',
        location: '',
        capacity: 0,
        currentOccupancy: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const numberFields = new Set(['capacity', 'currentOccupancy']);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (numberFields.has(name)) {
            const num = value === '' ? 0 : Number(value);
            setFormData(prev => ({ ...prev, [name]: num } as StorageAreaCreateDto));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value } as StorageAreaCreateDto));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const created = await storageAreaService.createStorageArea(formData);
            onSuccess(created);
            onClose();
        } catch (err) {
            console.error('Failed to create storage area', err);
            setError('Failed to create storage area. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600">{error}</div>}

            <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                >
                    {STORAGE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Location (x, y)</label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. 10, 10"
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <input
                        type="number"
                        name="capacity"
                        min={0}
                        value={formData.capacity}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Occupancy</label>
                    <input
                        type="number"
                        name="currentOccupancy"
                        min={0}
                        value={formData.currentOccupancy}
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
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
};

export default CreateStorageAreaForm;
