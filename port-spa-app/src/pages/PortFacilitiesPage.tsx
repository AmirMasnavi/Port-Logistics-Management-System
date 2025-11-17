import React, { useEffect, useState } from 'react';
import { getAllStorageAreas } from '../services/apiService';
import type { StorageArea } from '../types';
import Modal from '../components/common/Modal';
import CreateStorageAreaForm from './CreateStorageAreaForm';

const PortFacilitiesPage: React.FC = () => {
    const [areas, setAreas] = useState<StorageArea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            const data = await getAllStorageAreas();
            setAreas(data);
        } catch (err) {
            console.error('Failed to fetch storage areas', err);
            setError('Failed to fetch storage areas. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const handleSuccess = (newArea: StorageArea) => {
        setAreas(prev => [newArea, ...prev]);
    };

    return (
        <div className="container mt-6">
            <div className="panel">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Port Facilities</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary"
                    >
                        + Create Storage Area
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-maritime-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Current Occupancy</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading && (
                            <tr>
                                <td colSpan={4} className="text-center py-4">Loading...</td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-red-600">{error}</td>
                            </tr>
                        )}
                        {!loading && !error && areas.map((area, index) => (
                            <tr key={index} className="hover:bg-maritime-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.capacity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.currentOccupancy}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Storage Area">
                    <CreateStorageAreaForm onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
                </Modal>
            </div>
        </div>
    );
};

export default PortFacilitiesPage;
