// src/presentation/vessel/VesselsPage.tsx
import React, { useEffect } from 'react';
import { Ship, Plus, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

import { useVesselListController } from '../controllers/vessel/useVesselListController';
import VesselCard from '../components/vessel/VesselCard';
import VesselForm from '../components/vessel/VesselForm';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const VesselsPage: React.FC = () => {
    const { user, isLoading: authLoading, internalRole } = useAuth();
    const navigate = useNavigate();

    // Check authentication before loading data
    useEffect(() => {
        if (!authLoading && !user) {
            console.error('User not authenticated, cannot access vessels page');
        }
    }, [authLoading, user, navigate]);

    const {
        loading,
        error,
        successMessage,
        filteredVessels,
        vesselTypes,
        stats,
        isModalOpen,
        editingVessel,
        deletingVesselId,
        searchTerm,
        setSearchTerm,
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseModal,
        handleSuccess,
        setDeletingVesselId,
        handleDelete,
    } = useVesselListController();

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="container mx-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Checking authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if not authenticated
    if (!user) {
        return (
            <div className="container mx-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
                        <h2 className="text-xl font-bold text-red-800 mb-2">Authentication Required</h2>
                        <p className="text-red-600 mb-4">You must be logged in to access this page.</p>
                        <p className="text-sm text-gray-600">Current role: {internalRole || 'Not logged in'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Vessels</h1>
                <p className="text-gray-600 mt-1">Manage and monitor all vessels in the port</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StatCard title="Total Vessels" value={stats.total} description="Total vessels registered" />
                <StatCard title="Vessel Types" value={vesselTypes.size} description="Different vessel types" />
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, IMO, or operator..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                    />
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Register Vessel
                </button>
            </div>

            {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading vessels...</div>}
                {!loading && filteredVessels.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                        <div className="flex flex-col items-center justify-center">
                            <Ship className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 font-medium">No vessels found</p>
                            <p className="text-gray-500 text-sm mt-1">Create your first vessel to get started</p>
                        </div>
                    </div>
                )}
                {!loading && filteredVessels.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVessels.map(vessel => (
                            <VesselCard
                                key={vessel.id}
                                vessel={vessel}
                                vesselType={vesselTypes.get(vessel.vesselTypeId)}
                                onEdit={() => handleOpenEditModal(vessel)}
                                onDelete={() => setDeletingVesselId(vessel.imoNumber)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingVessel ? "Edit Vessel" : "Create New Vessel"}
            >
                <VesselForm
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                    initialData={editingVessel}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!deletingVesselId}
                onClose={() => setDeletingVesselId(null)}
                onConfirm={handleDelete}
                title="Delete Vessel"
                message="Are you sure you want to delete this vessel? This action cannot be undone."
                isDestructive
            />
        </div>
    );
};

export default VesselsPage;
