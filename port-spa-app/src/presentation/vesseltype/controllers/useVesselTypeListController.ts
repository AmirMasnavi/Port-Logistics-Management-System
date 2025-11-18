// src/presentation/vesselType/controllers/useVesselTypeListController.ts
import { useState, useEffect, useMemo } from 'react';
import { vesselTypeService } from '../../../app/vesselType/vesselType.service.instance';
import type { VesselType } from '../../../domain/vesselType/vesselType.model';

export const useVesselTypeListController = () => {
    // State
    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<VesselType | null>(null);
    const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCapacity, setFilterCapacity] = useState('all');

    // Data Fetching
    const fetchTypes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await vesselTypeService.getAllVesselTypes();
            setVesselTypes(data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    // Derived State (Filtering and Stats)
    const filteredVesselTypes = useMemo(() => {
        return vesselTypes.filter(type => {
            const matchesSearch = type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                type.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCapacity = filterCapacity === 'all' ||
                (filterCapacity === 'small' && type.capacity <= 5000) ||
                (filterCapacity === 'medium' && type.capacity > 5000 && type.capacity <= 10000) ||
                (filterCapacity === 'large' && type.capacity > 10000);

            return matchesSearch && matchesCapacity;
        });
    }, [vesselTypes, searchQuery, filterCapacity]);

    const stats = useMemo(() => {
        const total = vesselTypes.length;
        const avgCapacity = total > 0 ? Math.round(vesselTypes.reduce((sum, type) => sum + type.capacity, 0) / total) : 0;
        const maxCapacity = total > 0 ? Math.max(...vesselTypes.map(type => type.capacity)) : 0;
        const avgDimensions = total > 0 ? {
            rows: Math.round(vesselTypes.reduce((sum, type) => sum + type.maxRows, 0) / total),
            bays: Math.round(vesselTypes.reduce((sum, type) => sum + type.maxBays, 0) / total),
            tiers: Math.round(vesselTypes.reduce((sum, type) => sum + type.maxTiers, 0) / total),
        } : { rows: 0, bays: 0, tiers: 0 };

        return { total, avgCapacity, maxCapacity, avgDimensions };
    }, [vesselTypes]);

    // Handlers
    const handleSuccess = (newType: VesselType) => {
        if (editingType) {
            setVesselTypes(prev => prev.map(t => t.id === newType.id ? newType : t));
            setSuccessMessage('Vessel type updated successfully!');
        } else {
            setVesselTypes(prev => [newType, ...prev]);
            setSuccessMessage('Vessel type created successfully!');
        }
        setIsModalOpen(false);
        setEditingType(null);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleOpenCreateModal = () => {
        setEditingType(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (type: VesselType) => {
        setEditingType(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
    };

    const handleDelete = async () => {
        if (!deletingTypeId) return;
        try {
            await vesselTypeService.deleteVesselType(deletingTypeId);
            setVesselTypes(prev => prev.filter(type => type.id !== deletingTypeId));
            setSuccessMessage('Vessel type deleted successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to delete vessel type.';
            setError(errorMessage);
        } finally {
            setDeletingTypeId(null);
        }
    };

    // Return everything the view needs
    return {
        // State
        loading,
        error,
        successMessage,
        filteredVesselTypes,
        stats,
        isModalOpen,
        editingType,
        deletingTypeId,

        // Filters
        searchQuery,
        setSearchQuery,
        filterCapacity,
        setFilterCapacity,

        // Actions
        handleOpenCreateModal,
        handleOpenEditModal,
        handleCloseModal,
        handleSuccess,
        setDeletingTypeId, // To open confirmation modal
        handleDelete,      // To execute deletion
    };
};