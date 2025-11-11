// typescript
import React, { useState } from 'react';
import { createDock } from '../services/apiService';
import type { Dock, DockCreateDto } from '../types';

interface CreateDockFormProps {
    onClose: () => void;
    onSuccess: (newDock: Dock) => void;
}

const CreateDockForm: React.FC<CreateDockFormProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState<DockCreateDto>({
        id: '',
        name: '',
        locationZone: '',
        locationSection: '',
        lengthInMeters: 0,
        depthInMeters: 0,
        maxDraftInMeters: 0,
        numberOfSTSCranes: 0,
        allowedVesselTypeIds: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const numberFields = new Set([
        'lengthInMeters',
        'depthInMeters',
        'maxDraftInMeters',
        'numberOfSTSCranes',
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'allowedVesselTypeIds') {
            const arr = value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            setFormData(prev => ({ ...prev, allowedVesselTypeIds: arr }));
            return;
        }

        if (numberFields.has(name)) {
            const num = value === '' ? 0 : Number(value);
            setFormData(prev => ({ ...prev, [name]: num } as Pick<DockCreateDto, keyof DockCreateDto>));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value } as Pick<DockCreateDto, keyof DockCreateDto>));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const newDock = await createDock(formData);
            setIsSubmitting(false);
            onSuccess(newDock);
            onClose();
        } catch (err) {
            setError('Falha ao criar o dock. Tente novamente.');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600">{error}</div>}

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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location Zone</label>
                    <input
                        type="text"
                        name="locationZone"
                        value={formData.locationZone}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location Section</label>
                    <input
                        type="text"
                        name="locationSection"
                        value={formData.locationSection}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                    <input
                        type="number"
                        name="lengthInMeters"
                        value={formData.lengthInMeters}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Depth (m)</label>
                    <input
                        type="number"
                        name="depthInMeters"
                        value={formData.depthInMeters}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Draft (m)</label>
                    <input
                        type="number"
                        name="maxDraftInMeters"
                        value={formData.maxDraftInMeters}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Number of STS Cranes</label>
                    <input
                        type="number"
                        name="numberOfSTSCranes"
                        value={formData.numberOfSTSCranes}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Allowed Vessel Type IDs (comma separated)</label>
                <input
                    type="text"
                    name="allowedVesselTypeIds"
                    value={(formData.allowedVesselTypeIds ?? []).join(', ')}
                    onChange={handleChange}
                    placeholder="e.g. vt-1, vt-2"
                    className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                />
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

export default CreateDockForm;