import { useState, useEffect, useMemo } from 'react';
import { dockService } from '../../app/dock/dock.service.instance';
import type { Dock } from '../../domain/dock/dock.model';

export const useDockListController = () => {
    // State
    const [docks, setDocks] = useState<Dock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDock, setEditingDock] = useState<Dock | null>(null);
    const [deletingDockId, setDeletingDockId] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSize, setFilterSize] = useState('all');

    // Data Fetching
    const fetchDocks = async () => {
        setLoading(true);
        setError(null);
        console.debug('[Dock] fetchDocks: starting GET /Dock');
        try {
            const data = await dockService.getAllDocks();
            console.debug('[Dock] fetchDocks: response', data);
            // Garantir array seguro e compatível
            setDocks(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('[Dock] fetchDocks error', err, err?.response?.status, err?.response?.data);
            const status = err?.response?.status;
            if (status === 401) {
                setError('Não autorizado — faz login novamente.');
                // opcional: forçar redirect para login
                // window.location.href = '/login';
            } else if (status === 403) {
                setError('Sem permissões para ver docas.');
            } else {
                setError(err.response?.data?.message || err.message || 'Erro ao carregar docas.');
            }
            setDocks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchDocks();
    }, []);

    // Derived State (Filtering and Stats)
    const filteredDocks = useMemo(() => {
        return docks.filter(dock => {
            const matchesSearch =
                dock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dock.locationZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dock.locationSection.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesSize = filterSize === 'all' ||
                (filterSize === 'small' && dock.lengthInMeters <= 100) ||
                (filterSize === 'medium' && dock.lengthInMeters > 100 && dock.lengthInMeters <= 300) ||
                (filterSize === 'large' && dock.lengthInMeters > 300);

            return matchesSearch && matchesSize;
        });
    },  [docks, searchQuery, filterSize]);

    const stats = useMemo(() => {
        const total = docks.length;
        if (total === 0) {
            return { total, avgLength: 0, avgDepth: 0, totalCranes: 0 };
        }

        const avgLength = Math.round(docks.reduce((sum, dock) => sum + dock.lengthInMeters, 0) / total);
        const avgDepth = Math.round(docks.reduce((sum, dock) => sum + dock.depthInMeters, 0) / total);
        const totalCranes = docks.reduce((sum, dock) => sum + dock.numberOfSTSCranes, 0);

        return { total, avgLength, avgDepth, totalCranes };
    }, [docks]);
    
    // Handlers
    const handleSuccess = (newDock: Dock) => {
        if (editingDock) {
            setDocks(prev => prev.map(d => d.id === newDock.id ? newDock : d));
            setSuccessMessage('Dock updated successfully!');
        } else {
            setDocks(prev => [newDock, ...prev]);
            setSuccessMessage('Dock created successfully!');
        }
        setIsModalOpen(false);
        setEditingDock(null);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleOpenCreateModal = () => {
        setEditingDock(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (dock: Dock) => {
        setEditingDock(dock);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDock(null);
    };

    const handleDelete = async () => {
        if (!deletingDockId) return;
        try {
            await dockService.deleteDock(deletingDockId);
            setDocks(prev => prev.filter(dock => dock.id !== deletingDockId));
            setSuccessMessage('Dock deleted successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to delete dock.';
            setError(errorMessage);
        } finally {
            setDeletingDockId(null);
        }
    };

    // Return everything the view needs
    return {
        // State
        loading,
        error,
        successMessage,
        filteredDocks,
        stats,
        isModalOpen,
        editingDock,
        deletingDockId,

        // Filters
        searchQuery,
        setSearchQuery,
        filterSize,
        setFilterSize,

        // Actions
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseModal,
        handleSuccess,
        setDeletingDockId, // To open confirmation modal
        handleDelete,      // To execute deletion
    };
};