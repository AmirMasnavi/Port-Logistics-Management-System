import React, { useEffect, useState, useMemo } from 'react';
import { getAllStorageAreas } from '../services/apiService';
import type { StorageArea } from '../domain/storageArea/storageArea.model';
import Modal from '../components/common/Modal';
import CreateStorageAreaForm from './CreateStorageAreaForm';
import EditStorageAreaForm from './EditStorageAreaForm';
import StatCard from '../components/common/StatCard';
import { Pencil, Search, SlidersHorizontal } from 'lucide-react';

const PortFacilitiesPage: React.FC = () => {
    const [areas, setAreas] = useState<StorageArea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<StorageArea | null>(null);

    // Filter state
    const [filterType, setFilterType] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCapacity, setFilterCapacity] = useState('');
    const [filterOccupancy, setFilterOccupancy] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            const data = await getAllStorageAreas();
            setAreas(data);
            setError(null);
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
        setSuccessMessage('Storage area created successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleEditSuccess = (updatedArea: StorageArea) => {
        setAreas(prev => prev.map(a => a.code === updatedArea.code ? updatedArea : a));
        setSuccessMessage('Storage area updated successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const openEditModal = (area: StorageArea) => {
        setEditingArea(area);
        setIsEditModalOpen(true);
    };

    // Filter areas based on search criteria
    const filteredAreas = useMemo(() => {
        return areas.filter(area => {
            const matchesType = !filterType || area.type.toLowerCase().includes(filterType.toLowerCase());
            const matchesLocation = !filterLocation || area.location.toLowerCase().includes(filterLocation.toLowerCase());
            const matchesCapacity = !filterCapacity || area.capacity.toString().includes(filterCapacity);
            const matchesOccupancy = !filterOccupancy || area.currentOccupancy.toString().includes(filterOccupancy);
            
            return matchesType && matchesLocation && matchesCapacity && matchesOccupancy;
        });
    }, [areas, filterType, filterLocation, filterCapacity, filterOccupancy]);

    // Calculate statistics for cards
    const stats = useMemo(() => {
        const totalAreas = areas.length;
        const totalCapacity = areas.reduce((sum, area) => sum + area.capacity, 0);
        const totalOccupancy = areas.reduce((sum, area) => sum + area.currentOccupancy, 0);
        const averageUtilization = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;
        
        const yardCount = areas.filter(a => a.type === 'Yard').length;
        const warehouseCount = areas.filter(a => a.type === 'Warehouse').length;

        return {
            totalAreas,
            totalCapacity,
            totalOccupancy,
            averageUtilization,
            yardCount,
            warehouseCount
        };
    }, [areas]);

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

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                        {successMessage}
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Areas"
                        value={stats.totalAreas}
                        description="Total storage areas in the port"
                    />
                    <StatCard
                        title="Total Capacity"
                        value={stats.totalCapacity}
                        description="Combined capacity of all areas"
                    />
                    <StatCard
                        title="Total Occupancy"
                        value={stats.totalOccupancy}
                        description="Current occupancy across all areas"
                    />
                    <StatCard
                        title="Avg Utilization"
                        value={`${stats.averageUtilization}%`}
                        description="Average utilization rate"
                    />
                </div>

                {/* Type Distribution Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <StatCard
                        title="Yards"
                        value={stats.yardCount}
                        description="Open yard storage areas"
                    />
                    <StatCard
                        title="Warehouses"
                        value={stats.warehouseCount}
                        description="Covered warehouse areas"
                    />
                </div>

                {/* Filters Section */}
                <div className="mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    {showFilters && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-md">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-maritime-500 focus:border-maritime-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="Yard">Yard</option>
                                    <option value="Warehouse">Warehouse</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by location..."
                                        value={filterLocation}
                                        onChange={(e) => setFilterLocation(e.target.value)}
                                        className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-maritime-500 focus:border-maritime-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by capacity..."
                                        value={filterCapacity}
                                        onChange={(e) => setFilterCapacity(e.target.value)}
                                        className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-maritime-500 focus:border-maritime-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Occupancy</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by occupancy..."
                                        value={filterOccupancy}
                                        onChange={(e) => setFilterOccupancy(e.target.value)}
                                        className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-maritime-500 focus:border-maritime-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-maritime-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Current Occupancy</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading && (
                            <tr>
                                <td colSpan={6} className="text-center py-4">Loading...</td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-red-600">{error}</td>
                            </tr>
                        )}
                        {!loading && !error && filteredAreas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-gray-500">No storage areas found matching your filters.</td>
                            </tr>
                        )}
                        {!loading && !error && filteredAreas.map((area) => (
                            <tr key={area.code} className="hover:bg-maritime-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.capacity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.currentOccupancy}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => openEditModal(area)}
                                        className="inline-flex items-center px-3 py-1.5 border border-blue-500 shadow-sm text-xs font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Storage Area">
                    <CreateStorageAreaForm onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
                </Modal>

                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Storage Area">
                    {editingArea && (
                        <EditStorageAreaForm 
                            area={editingArea}
                            onClose={() => setIsEditModalOpen(false)} 
                            onSuccess={handleEditSuccess} 
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default PortFacilitiesPage;
