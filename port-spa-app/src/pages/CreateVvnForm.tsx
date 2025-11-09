import React, { useState } from 'react';
import { createVvn } from '../services/apiService';
import type { VesselVisitNotification, CreateVvnDto } from '../types';

interface CreateVvnFormProps {
    onClose: () => void;
    onSuccess: (newVvn: VesselVisitNotification) => void;
    // This is a placeholder. In a real app, you'd fetch this from the user's auth token.
    dummyRepresentativeId: string;
}

// Initial state for the form
const initialState: CreateVvnDto = {
    estimatedArrival: '',
    estimatedDeparture: '',
    vesselImo: '',
    representativeId: '', // Will be set from prop
    cargo: {
        description: '',
        weight: 0,
        containers: [],
    },
    crewMembers: [],
};

const CreateVvnForm: React.FC<CreateVvnFormProps> = ({ onClose, onSuccess, dummyRepresentativeId }) => {
    const [formData, setFormData] = useState<CreateVvnDto>({
        ...initialState,
        representativeId: dummyRepresentativeId, // Set the representative ID
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Handlers for simple root fields ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Handlers for nested CARGO fields ---
    const handleCargoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            cargo: {
                ...prev.cargo,
                [name]: name === 'weight' ? Number(value) : value,
            },
        }));
    };

    const handleCrewChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const updatedCrew = formData.crewMembers.map((member, i) =>
            i === index
                ? { ...member, [name || (e.target.placeholder === 'Name' ? 'name' : 'nationality')]: type === 'checkbox' ? checked : value }
                : member
        );
        setFormData(prev => ({
            ...prev,
            crewMembers: updatedCrew,
        }));
    };

    // --- Handlers for CONTAINER list ---
    const addContainer = () => {
        setFormData(prev => ({
            ...prev,
            cargo: {
                ...prev.cargo,
                containers: [...prev.cargo.containers, { containerCode: '', position: '' }],
            },
        }));
    };

    const handleContainerChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedContainers = formData.cargo.containers.map((item, i) =>
            i === index ? { ...item, [name]: value } : item
        );
        setFormData(prev => ({
            ...prev,
            cargo: { ...prev.cargo, containers: updatedContainers },
        }));
    };

    // --- Handlers for CREW list (similar to container) ---
    const addCrewMember = () => {
        setFormData(prev => ({
            ...prev,
            crewMembers: [...prev.crewMembers, { name: '', nationality: '', isSafetyOfficer: false }],
        }));
    };

    // --- Handle Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simple validation [cite: 2014]
        if (!formData.vesselImo || !formData.estimatedArrival || !formData.estimatedDeparture) {
            setError("Vessel IMO, ETA, and ETD are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Call the API function
            const newVvn = await createVvn(formData);

            // Notify parent page of success 
            onSuccess(newVvn);
            onClose(); // Close modal

        } catch (err: any) {
            // Show error message 
            setError(err.response?.data?.message || 'Failed to create notification. Check all fields.');
            setIsSubmitting(false);
        }
    };

    // --- Render JSX ---
    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            {error && <div className="text-red-600 p-2 bg-red-100 rounded">{error}</div>}

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Visit Details</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Vessel IMO</label>
                    <input type="text" name="vesselImo" value={formData.vesselImo} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Arrival (ETA)</label>
                    <input type="datetime-local" name="estimatedArrival" value={formData.estimatedArrival} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Departure (ETD)</label>
                    <input type="datetime-local" name="estimatedDeparture" value={formData.estimatedDeparture} onChange={handleChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" required />
                </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-2">Cargo Manifest</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Description</label>
                <textarea name="description" value={formData.cargo.description} onChange={handleCargoChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Weight (kg)</label>
                <input type="number" name="weight" value={formData.cargo.weight} onChange={handleCargoChange} className="mt-1 p-2 w-full border border-gray-300 rounded-lg" />
            </div>

            {/* Containers Dynamic List */}
            <div>
                <h4 className="text-md font-medium text-gray-800">Containers</h4>
                {formData.cargo.containers.map((container, index) => (
                    <div key={index} className="flex gap-2 mb-2 p-2 border rounded">
                        <input type="text" name="containerCode" placeholder="Container Code (e.g., CSQU3054383)" value={container.containerCode} onChange={(e) => handleContainerChange(index, e)} className="mt-1 p-2 w-1/2 border border-gray-300 rounded-lg" required />
                        <input type="text" name="position" placeholder="Position (e.g., B1-R1-T1)" value={container.position} onChange={(e) => handleContainerChange(index, e)} className="mt-1 p-2 w-1/2 border border-gray-300 rounded-lg" />
                    </div>
                ))}
                <button type="button" onClick={addContainer} className="text-sm text-blue-600 hover:text-blue-800">
                    + Add Container
                </button>
            </div>

            {/* Crew Members Dynamic List */}
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-2">Crew Members</h3>
            {formData.crewMembers.map((crew, index) => (
                <div key={index} className="flex gap-2 mb-2 p-2 border rounded">
                    {/* You can add more fields here based on your CreateCrewMemberDto */}
                    <input type="text" name="name" placeholder="Name" value={crew.name} onChange={(e) => handleCrewChange(index, e)} className="mt-1 p-2 w-1/2 border border-gray-300 rounded-lg" />
                    <input type="text" name="nationality" placeholder="Nationality" value={crew.nationality} onChange={(e) => handleCrewChange(index, e)} className="mt-1 p-2 w-1/2 border border-gray-300 rounded-lg" />
                </div>
            ))}
            <button type="button" onClick={addCrewMember} className="text-sm text-blue-600 hover:text-blue-800">
                + Add Crew Member
            </button>


            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                    {isSubmitting ? 'Creating...' : 'Create Notification'}
                </button>
            </div>
        </form>
    );
};

export default CreateVvnForm;