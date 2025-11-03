import React, { useState, useEffect } from 'react';
import { getAllVesselTypes } from '../services/apiService';
import type { VesselType } from '../types';
// --- 1. Import our new components ---
import Modal from '../components/common/Modal';
import CreateVesselTypeForm from './CreateVesselTypeForm';

// A simple icon component for the actions menu
const DotsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const VesselTypesPage: React.FC = () => {
    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- 2. Add state to control the modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const data = await getAllVesselTypes();
            setVesselTypes(data);
        } catch (err) {
            setError('Failed to fetch data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    // --- 3. Handle successful creation ---
    const handleSuccess = (newType: VesselType) => {
        // Add the new type to our list to refresh the UI
        setVesselTypes(prevTypes => [newType, ...prevTypes]);
    };

    // Tailwind classes for styling inspired by your mock-up
    return (
        <div className="container mt-6">
            <div className="panel">

                {/* 1. Page Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Vessel Types</h1>
                    {/* --- 4. Wire up the button --- */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary"
                    >
                        + Create Type
                    </button>
                </div>

                {/* 2. Search & Filter Bar */}
                <div className="flex mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or description..."
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                    />
                </div>

                {/* 3. Data Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-maritime-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Capacity (TEU)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Dimensions (R/B/T)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-maritime-700 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading && (
                            <tr>
                                <td colSpan={5} className="text-center py-4">Loading...</td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-red-600">{error}</td>
                            </tr>
                        )}
                        {!loading && !error && vesselTypes.map(type => (
                            <tr key={type.id} className="hover:bg-maritime-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{type.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{type.capacity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {type.maxRows}r / {type.maxBays}b / {type.maxTiers}t
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <DotsIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* --- 5. Render the Modal --- */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New Vessel Type"
                >
                    <CreateVesselTypeForm
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                </Modal>
            </div>
        </div>
    );
};

export default VesselTypesPage;

