// src/presentation/vessel/controllers/useVesselListController.ts
import { useState, useEffect, useMemo } from 'react';
import { vesselService } from '../../app/vessel/vessel.service.instance';
import { vesselTypeService } from '../../app/vesselType/vesselType.service.instance';
import type { Vessel } from '../../domain/vessel/vessel.model';
import type { VesselType } from '../../domain/vesselType/vesselType.model';

export const useVesselListController = () => {
    // State
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [vesselTypes, setVesselTypes] = useState<Map<string, VesselType>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
    const [deletingVesselId, setDeletingVesselId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');

    // Data Fetching
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Loading vessels and vessel types...');
            const [vesselsData, typesData] = await Promise.all([
                vesselService.getAllVessels(),
                vesselTypeService.getAllVesselTypes()
            ]);
            console.log('Loaded vessels:', vesselsData);
            console.log('Loaded vessel types:', typesData);
            setVessels(vesselsData);
            const typesMap = new Map(typesData.map(t => [t.id, t]));
            setVesselTypes(typesMap);
        } catch (error: any) {
            console.error('Failed to load data:', error);
            
            // Check if it's an authentication error
            if (error.response?.status === 401) {
                setError('Authentication failed. Please make sure you are logged in with Administrator or PortAuthorityOfficer role.');
            } else if (error.response?.status === 403) {
                setError('Access denied. You do not have permission to view vessels. Required role: Administrator or PortAuthorityOfficer.');
            } else {
                setError('Failed to load initial data. Please refresh the page. Error: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Derived State (Filtering and Stats)
    const filteredVessels = useMemo(() => {
        return vessels.filter(vessel => {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch =
                vessel.name.toLowerCase().includes(lowerSearch) ||
                vessel.imoNumber.toLowerCase().includes(lowerSearch) ||
                vessel.operator.toLowerCase().includes(lowerSearch);

            return matchesSearch;
        });
    }, [vessels, searchTerm]);

    const stats = useMemo(() => ({
        total: vessels.length,
    }), [vessels]);

    // Handlers
    const handleSuccess = () => {
        setIsModalOpen(false);
        setEditingVessel(null);
        setSuccessMessage(`Vessel ${editingVessel ? 'updated' : 'created'} successfully!`);
        loadData(); // Refetch data to show the new/updated vessel
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleOpenCreateModal = () => {
        setEditingVessel(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (vessel: Vessel) => {
        setEditingVessel(vessel);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVessel(null);
    };

    const handleDelete = async () => {
        if (!deletingVesselId) return;
        try {
            await vesselService.deleteVessel(deletingVesselId);
            // Filter by imoNumber since that's the actual identifier being used
            setVessels(vessels.filter(v => v.imoNumber !== deletingVesselId));
            setSuccessMessage('Vessel deleted successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Failed to delete vessel:', error);
            setError('Failed to delete vessel.');
        } finally {
            setDeletingVesselId(null);
        }
    };

    // Return everything the view needs
    return {
        // State
        loading,
        error,
        successMessage,
        filteredVessels,
        vesselTypes,
        stats,
        isModalOpen,
        editingVessel,
        deletingVesselId,

        // Filters
        searchTerm,
        setSearchTerm,

        // Actions
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseModal,
        handleSuccess,
        setDeletingVesselId,
        handleDelete,
    };
};