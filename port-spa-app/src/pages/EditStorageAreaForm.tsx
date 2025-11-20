import React, { useState } from 'react';
import { apiClient } from '../services/apiService';
import type { StorageArea } from '../domain/storageArea/storageArea.model';

interface EditStorageAreaFormProps {
    area: StorageArea;
    onClose: () => void;
    onSuccess: (updatedArea: StorageArea) => void;
}

const EditStorageAreaForm: React.FC<EditStorageAreaFormProps> = ({ area, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        type: area.type,
        location: area.location,
        capacity: area.capacity,
        currentOccupancy: area.currentOccupancy,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' || name === 'currentOccupancy' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (formData.currentOccupancy > formData.capacity) {
            setError('Current occupancy cannot exceed capacity.');
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.put<StorageArea>(`/StorageArea/${area.code}`, formData);
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            console.error('Failed to update storage area', err);
            const msg = err?.response?.data?.message || err?.response?.data || 'Failed to update storage area.';
            setError(typeof msg === 'string' ? msg : 'Failed to update storage area.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                </label>
                <input
                    type="text"
                    value={area.code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Code cannot be changed</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                </label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maritime-500 focus:border-maritime-500"
                >
                    <option value="">Select type</option>
                    <option value="Yard">Yard</option>
                    <option value="Warehouse">Warehouse</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., 10, 10 or (10, 10)"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maritime-500 focus:border-maritime-500"
                />
                <p className="mt-1 text-xs text-gray-500">Format: X, Y coordinates</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maritime-500 focus:border-maritime-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Occupancy <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    name="currentOccupancy"
                    value={formData.currentOccupancy}
                    onChange={handleChange}
                    min="0"
                    max={formData.capacity}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maritime-500 focus:border-maritime-500"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maritime-600 hover:bg-maritime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

export default EditStorageAreaForm;

