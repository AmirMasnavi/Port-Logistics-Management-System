import { useState, useRef, useEffect } from 'react';
import { IncidentTypeService } from '../../app/incidentType/incidentType.service';
import { incidentTypeApiRepository } from '../../infrastructure/repositories/incidentType/incidentTypeApi.repository';
import type { IncidentType } from '../../domain/incidentType/incidentType.model';
import type {
    CreateIncidentTypeDto,
    UpdateIncidentTypeDto,
} from '../../infrastructure/repositories/incidentType/incidentType.dto';
import type { IncidentTypeFilters } from '../../app/incidentType/incidentType.repository';

const incidentTypeService = new IncidentTypeService(incidentTypeApiRepository);

export const useIncidentTypeController = () => {
    const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
                messageTimeoutRef.current = null;
            }
        };
    }, []);

    const setTimedSuccess = (msg: string, ms = 5000) => {
        setSuccessMessage(msg);
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = setTimeout(() => setSuccessMessage(null), ms);
    };

    const fetchIncidentTypes = async (filters?: IncidentTypeFilters) => {
        try {
            setLoading(true);
            setError(null);
            const items = await incidentTypeService.fetchAllIncidentTypes(filters);
            setIncidentTypes(items);
            return items;
        } catch (err: any) {
            setError(err?.message ?? 'Erro ao obter tipos de incidente');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getIncidentTypeById = async (id: string): Promise<IncidentType | null> => {
        try {
            setLoading(true);
            setError(null);
            const item = await incidentTypeService.getIncidentTypeById(id);
            return item;
        } catch (err: any) {
            setError(err?.message ?? `Erro ao obter Incident Type '${id}'`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const createIncidentType = async (
        dto: CreateIncidentTypeDto
    ): Promise<IncidentType | null> => {
        try {
            setLoading(true);
            setError(null);
            const created = await incidentTypeService.createIncidentType(dto);
            setIncidentTypes(prev => [created, ...prev]);
            setTimedSuccess(`Incident Type created: ${created.code}`);
            return created;
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create Incident Type';

            if (err?.response?.status === 409 || errorMessage.includes('already exists')) {
                setError('⚠️ Incident Type already exists. Please use a different code.');
            } else if (err?.response?.status === 404) {
                setError('❌ Parent Incident Type not found.');
            } else if (err?.response?.status === 400) {
                setError(`❌ Invalid data: ${errorMessage}`);
            } else {
                setError(errorMessage);
            }

            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateIncidentType = async (
        id: string,
        dto: UpdateIncidentTypeDto
    ): Promise<IncidentType | null> => {
        try {
            setLoading(true);
            setError(null);
            const updated = await incidentTypeService.updateIncidentType(id, dto);
            setIncidentTypes(prev =>
                prev.map(it => (it.id === updated.id ? updated : it))
            );
            setTimedSuccess(`Incident Type updated: ${updated.code}`);
            return updated;
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to update Incident Type';

            if (err?.response?.status === 404) {
                setError('❌ Incident Type not found.');
            } else if (err?.response?.status === 409) {
                setError(`⚠️ Conflict updating Incident Type: ${errorMessage}`);
            } else if (err?.response?.status === 400) {
                setError(`❌ Invalid data: ${errorMessage}`);
            } else {
                setError(errorMessage);
            }

            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteIncidentType = async (id: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            const result = await incidentTypeService.deleteIncidentType(id);
            if (result) {
                setIncidentTypes(prev => prev.filter(it => it.id !== id));
                setTimedSuccess('Incident Type deleted');
            }
            return result;
        } catch (err: any) {
            setError(err?.message ?? `Failed to delete Incident Type '${id}'`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        incidentTypes,
        loading,
        error,
        successMessage,
        fetchIncidentTypes,
        getIncidentTypeById,
        createIncidentType,
        updateIncidentType,
        deleteIncidentType,
        setTimedSuccess,
    };
};
