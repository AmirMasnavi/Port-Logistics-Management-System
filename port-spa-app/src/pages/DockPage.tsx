import React from 'react';
import { useDockListController } from '../controllers/dock/useDockListController';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import DockCard from '../components/dock/DockCard';
import DockForm from '../components/dock/DockForm';
import { Search, SlidersHorizontal } from 'lucide-react';

const DockPage: React.FC = () => {
    const {
        loading,
        error,
        successMessage,
        filteredDocks,     
        stats,
        isModalOpen,
        editingDock,        
        deletingDockId,    
        searchQuery,
        setSearchQuery,
        filterSize,        
        setFilterSize,     
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseModal,
        handleSuccess,
        setDeletingDockId, 
        handleDelete,
    } = useDockListController();

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Docks</h1>
                <p className="text-gray-600 mt-1">Manage and configure docks and berthing locations.</p>
            </div>

            {/* Stats atualizados para refletir propriedades de Docas (calculadas no controller) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Docks"
                    value={stats.total}
                    description="Active docks configured"
                />
                <StatCard
                    title="Avg Length"
                    value={`${stats.avgLength} m`}
                    description="Average dock length"
                />
                <StatCard
                    title="Avg Depth"
                    value={`${stats.avgDepth} m`}
                    description="Average water depth"
                />
                <StatCard
                    title="Total STS Cranes"
                    value={stats.totalCranes}
                    description="Total cranes available"
                />
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, zone or section..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                    </div>
                    {/* Filtro corrigido para usar filterSize e Metros */}
                    <select
                        value={filterSize}
                        onChange={(e) => setFilterSize(e.target.value)}
                        className="w-full md:w-auto pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg appearance-none"
                    >
                        <option value="all">All Sizes</option>
                        <option value="small">Small (≤100m)</option>
                        <option value="medium">Medium (100-300m)</option>
                        <option value="large">Large (&gt;300m)</option>
                    </select>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Create Dock
                </button>
            </div>

            {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading docks...</div>}

                {!loading && filteredDocks.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No docks found matching your criteria.
                    </div>
                )}

                {!loading &&
                    filteredDocks.map((dock) => (
                        <DockCard
                            key={dock.id}
                            dock={dock}
                            onEdit={() => handleOpenEditModal(dock)}
                            onDelete={() => setDeletingDockId(dock.id)}
                        />
                    ))}
            </div>

            {/* Modal de Criação/Edição */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingDock ? "Edit Dock" : "Create New Dock"}
            >
                <DockForm
                    initialData={editingDock}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            </Modal>

            {/* Modal de Confirmação de Apagar */}
            <ConfirmationModal
                isOpen={!!deletingDockId}
                onClose={() => setDeletingDockId(null)}
                onConfirm={handleDelete}
                title="Delete Dock"
                message="Are you sure you want to delete this dock? This action cannot be undone."
                isDestructive
            />
        </div>
    );
};

export default DockPage;