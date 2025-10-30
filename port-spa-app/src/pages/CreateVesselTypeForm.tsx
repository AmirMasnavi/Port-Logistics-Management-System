import React, { useState } from 'react';
import { createVesselType } from '../services/apiService';
import type { VesselType, VesselTypeCreateDto } from '../types';

// Define props for the form
interface CreateVesselTypeFormProps {
    onClose: () => void; // Function to close the modal
    onSuccess: (newType: VesselType) => void; // Function to pass the new data back to the page
}

const CreateVesselTypeForm: React.FC<CreateVesselTypeFormProps> = ({ onClose, onSuccess }) => {
    // 1. State for all form fields
    const [formData, setFormData] = useState<VesselTypeCreateDto>({
        id: '',
        name: '',
        description: '',
        capacity: 0,
        maxRows: 0,
        maxBays: 0,
        maxTiers: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 2. A single handler to update the form state
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            // treat id, name and description as strings; other fields as numbers
            [name]: name === 'name' || name === 'description' || name === 'id' ? value : Number(value),
        }));
    };

    // 3. Handle the form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default browser form submission
        setIsSubmitting(true);
        setError(null);

        try {
            // Call the API function
            const newVesselType = await createVesselType(formData);

            // On success:
            setIsSubmitting(false);
            onSuccess(newVesselType); // Pass the new item back to the page
            onClose(); // Close the modal

        } catch (err) {
            setError('Failed to create vessel type. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600">{error}</div>}

            {/* ID input */}
            <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                    required
                />
            </div>

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

            {/* Grid for number inputs */}
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

            {/* 4. Form Actions */}
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

export default CreateVesselTypeForm;