// Controller Hook - Presentation Layer
// React hook that manages VVE state and interactions

import { useState, useRef, useEffect } from 'react';
import { VveService } from '../../app/vve/vve.service';
import { vveApiRepository } from '../../infrastructure/repositories/vve/vveApi.repository';
import type { VesselVisitExecution } from '../../domain/vve/vve.model';
import type { CreateVveDto, UpdateVveDto } from '../../infrastructure/repositories/vve/vve.dto';
import type { VveFilters } from '../../app/vve/vve.repository';

const vveService = new VveService(vveApiRepository);

export const useVveController = () => {
    const [vves, setVves] = useState<VesselVisitExecution[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
        };
    }, []);


    const setTimedSuccess = (msg: string, ms = 5000) => {
        setSuccessMessage(msg);
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = setTimeout(() => setSuccessMessage(null), ms);
    };

   
    
    const fetchVves = async (filters?: VveFilters) => {
        try {
            setLoading(true);
            setError(null);
            const data = await vveService.fetchAllVves(filters);
            setVves(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch VVEs');
        } finally {
            setLoading(false);
        }
    };


    const createVve = async (dto: CreateVveDto): Promise<VesselVisitExecution | null> => {
        try {
            setLoading(true);
            setError(null);
            const created = await vveService.createVve(dto);
            setSuccessMessage(`VVE created: ${created.vveId}`);
            return created;
        } catch (err: any) {
            // Handle specific error cases
            const errorMessage = err?.response?.data?.message || err.message || 'Failed to create VVE';
            
            // Check for conflict error (409) - VVE already exists
            if (err?.response?.status === 409 || errorMessage.includes('already exists')) {
                setError(`⚠️ A Vessel Visit Execution already exists for this VVN. Please check existing VVE records or select a different vessel visit.`);
            } 
            // Check for VVN not found error (404)
            else if (err?.response?.status === 404 || errorMessage.includes('not found')) {
                setError(`❌ The selected Vessel Visit Notification was not found. Please refresh the page and try again.`);
            }
            // Generic error
            else {
                setError(errorMessage);
            }
            
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateVve = async (vveId: string, dto: UpdateVveDto): Promise<VesselVisitExecution | null> => {
        try {
            setLoading(true);
            setError(null);
            const updated = await vveService.updateVve(vveId, dto);
            setVves(prev => prev.map(v => (v.vveId === updated.vveId ? updated : v)));
            setTimedSuccess(`VVE updated: ${updated.vveId}`);
            return updated;
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err.message || 'Failed to update VVE';

            // Mirror create error handling with specific cases
            if (err?.response?.status === 404 || errorMessage.includes('not found')) {
                setError(`❌ VVE not found. Update failed because the record does not exist.`);
            } else if (err?.response?.status === 409 || errorMessage.includes('conflict') || errorMessage.includes('already exists')) {
                setError(`⚠️ Conflict updating VVE: ${errorMessage}`);
            } else if (errorMessage.includes('Validation failed') || err?.response?.status === 400) {
                setError(`❌ Invalid data: ${errorMessage}`);
            } else {
                setError(errorMessage);
            }
            return null;
        } finally {
            setLoading(false);
        }
    };        

    const deleteVve = async (vveId: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            const deleted = await vveService.deleteVve(vveId);
            if (deleted) {
                setSuccessMessage(`VVE deleted: ${vveId}`);
            }
            return deleted;
        } catch (err: any) {
            setError(err.message || 'Failed to delete VVE');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    return {
        vves,
        loading,
        error,
        successMessage,
        fetchVves,
        createVve,
        updateVve,
        deleteVve,
        clearMessages,
    };
};
