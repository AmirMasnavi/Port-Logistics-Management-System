// src/presentation/vesselType/VesselTypesPage.tsx
import React from 'react';
import { useVesselTypeListController } from '../controllers/vesseltype/useVesselTypeListController';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import VesselTypeCard from '../components/vesseltype/VesselTypeCard';
import VesselTypeForm from '../components/vesseltype/VesselTypeForm';
import { Search, SlidersHorizontal } from 'lucide-react';

const VesselTypesPage: React.FC = () => {
    const {
        loading,
        error,
        successMessage,
        filteredVesselTypes,
        stats,
        isModalOpen,
        editingType,
        deletingTypeId,
        searchQuery,
        setSearchQuery,
        filterCapacity,
        setFilterCapacity,
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseModal,
        handleSuccess,
        setDeletingTypeId,
        handleDelete,
    } = useVesselTypeListController();

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Vessel Types</h1>
                <p className="text-gray-600 mt-1">Manage and configure vessel types for your port operations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Types" value={stats.total} description="Vessel types configured" />
                <StatCard title="Avg Capacity" value={`${stats.avgCapacity} TEU`} description="Average capacity across types" />
                <StatCard title="Max Capacity" value={`${stats.maxCapacity} TEU`} description="Highest capacity type" />
                <StatCard title="Avg Dimensions" value={`${stats.avgDimensions.rows}r/${stats.avgDimensions.bays}b/${stats.avgDimensions.tiers}t`} description="Average dimensions (R/B/T)" />
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                    </div>
                    <select
                        value={filterCapacity}
                        onChange={(e) => setFilterCapacity(e.target.value)}
                        className="w-full md:w-auto pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg appearance-none"
                    >
                        <option value="all">All Capacities</option>
                        <option value="small">Small (≤5,000 TEU)</option>
                        <option value="medium">Medium (5,000-10,000 TEU)</option>
                        <option value="large">Large (&gt;10,000 TEU)</option>
                    </select>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Create Type
                </button>
            </div>

            {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading vessel types...</div>}
                {!loading && filteredVesselTypes.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No vessel types found matching your criteria.
                    </div>
                )}
                {!loading &&
                    filteredVesselTypes.map((type) => (
                        <VesselTypeCard
                            key={type.id}
                            vesselType={type}
                            onEdit={() => handleOpenEditModal(type)}
                            onDelete={() => setDeletingTypeId(type.id)}
                        />
                    ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingType ? "Edit Vessel Type" : "Create New Vessel Type"}
            >
                <VesselTypeForm
                    initialData={editingType}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!deletingTypeId}
                onClose={() => setDeletingTypeId(null)}
                onConfirm={handleDelete}
                title="Delete Vessel Type"
                message="Are you sure you want to delete this vessel type? This action cannot be undone."
                isDestructive
            />
        </div>
    );
};

export default VesselTypesPage;