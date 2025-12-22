// typescript
// File: `port-spa-app/src/services/incidentTypeService.ts`
import axios from 'axios';
import type {
    CreateIncidentTypeDto,
    UpdateIncidentTypeDto,
    IncidentTypeResponseDto,
} from '../infrastructure/repositories/incidentType/incidentType.dto';
import {getAuthToken} from "../firebaseConfig.ts";

export type IncidentTypeFilters = {
    parentId?: string | null;
    severity?: 'Minor' | 'Major' | 'Critical';
    search?: string;
    tree?: boolean;
};

const OEM_API_BASE = import.meta.env.VITE_OEM_API_URL || 'http://localhost:3001/api';

const incidentTypeApiClient = axios.create({
    baseURL: `${OEM_API_BASE}/incident-type`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// Interceptor: adiciona Bearer token se encontrar em localStorage/sessionStorage
incidentTypeApiClient.interceptors.request.use(async (config) => {
    try {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.warn('Could not attach auth token to Incident Type request', error);
    }
    return config;
});


export class IncidentTypeService {
    async getAllIncidentTypes(filters?: IncidentTypeFilters): Promise<(IncidentTypeResponseDto | IncidentTypeListItemDto)[]> {
        try {
            // CORREÇÃO 1: Usar o 'incidentTypeApiClient' em vez de 'vveApiClient'
            // CORREÇÃO 2: Deixar o Axios gerir os 'params' para evitar barras duplas e erros de '?'
            const response = await incidentTypeApiClient.get('', {
                params: {
                    ...filters,
                    // Garante que o parentId null é enviado como o backend espera
                    parentId: filters?.parentId === null ? 'null' : filters?.parentId
                }
            });

            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch:', error);
            throw new Error(error.response?.data?.message || 'Erro de conexão com o servidor.');
        }
    }
    async getIncidentTypeById(id: string): Promise<IncidentTypeResponseDto | null> {
        try {
            const response = await incidentTypeApiClient.get<{ success: boolean; data: IncidentTypeResponseDto }>(`/${encodeURIComponent(id)}`);
            return response.data.data;
        } catch (error: any) {
            console.error(`Failed to fetch incident type ${id}:`, error);
            if (error?.response?.status === 404) return null;
            throw new Error(error?.response?.data?.message || error?.message || 'Falha ao buscar tipo de incidente.');
        }
    }

    async getByCode(code: string): Promise<IncidentTypeResponseDto | null> {
        try {
            const response = await incidentTypeApiClient.get<{ success: boolean; data: IncidentTypeResponseDto }>(`/code/${encodeURIComponent(code)}`);
            return response.data.data;
        } catch (error: any) {
            console.warn(`getByCode fallback for code=${code}:`, error?.message || error);
            if (error?.response?.status === 404) return null;
            // fallback: try search query
            const list = await this.getAllIncidentTypes({ search: code });
            return (list as IncidentTypeResponseDto[]).find(i => i.code?.toLowerCase() === code.toLowerCase()) || null;
        }
    }

    async createIncidentType(dto: CreateIncidentTypeDto): Promise<IncidentTypeResponseDto> {
        try {
            const response = await incidentTypeApiClient.post<{ success: boolean; data: IncidentTypeResponseDto }>(`/`, dto);
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to create incident type:', error);
            throw new Error(error?.response?.data?.message || error?.message || 'Falha ao criar tipo de incidente.');
        }
    }

    async updateIncidentType(id: string, dto: UpdateIncidentTypeDto): Promise<IncidentTypeResponseDto> {
        try {
            const response = await incidentTypeApiClient.put<{ success: boolean; data: IncidentTypeResponseDto }>(`/${encodeURIComponent(id)}`, dto);
            return response.data.data;
        } catch (error: any) {
            console.error(`Failed to update incident type ${id}:`, error);
            throw new Error(error?.response?.data?.message || error?.message || 'Falha ao atualizar tipo de incidente.');
        }
    }

    async deleteIncidentType(id: string): Promise<boolean> {
        try {
            await incidentTypeApiClient.delete(`/${encodeURIComponent(id)}`);
            return true;
        } catch (error: any) {
            console.error(`Failed to delete incident type ${id}:`, error);
            throw new Error(error?.response?.data?.message || error?.message || 'Falha ao excluir tipo de incidente.');
        }
    }
}

export const incidentTypeService = new IncidentTypeService();