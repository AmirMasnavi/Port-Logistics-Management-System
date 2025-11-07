// port-spa-app/src/services/apiService.ts
import axios from 'axios';
import type { VesselType, VesselTypeCreateDto, PortLayout, VesselVisit, Resource } from '../types';

// 1. Crie uma instância central do Axios
const apiClient = axios.create({
    baseURL: 'http://localhost:5273/api',
});

// 2. Crie uma função para configurar o interceptor.
//    Esta função será chamada do seu App ou Layout, onde tem acesso ao hook do Auth0.
export const setupApiInterceptor = (getAccessToken: () => Promise<string>) => {
    apiClient.interceptors.request.use(async (config) => {
        try {
            const token = await getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
        } catch (e) {
            console.error("Could not get access token", e);
        }
        return config;
    });
};


// 3. Atualize as suas funções para usarem a instância `apiClient`
export const getAllVesselTypes = async (): Promise<VesselType[]> => {
    try {
        const response = await apiClient.get<VesselType[]>(`/VesselType`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vessel types:', error);
        throw error;
    }
};

export const createVesselType = async (vesselTypeData: VesselTypeCreateDto): Promise<VesselType> => {
    try {
        const response = await apiClient.post<VesselType>(`/VesselType`, vesselTypeData);
        return response.data;
    } catch (error) {
        console.error('Error creating vessel type:', error);
        throw error;
    }
};

// --- New functions used by the visualization ---

export const getPortLayout = async (layoutId: string): Promise<PortLayout> => {
    try {
        const response = await apiClient.get<PortLayout>(`/PortLayout/${layoutId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching port layout:', error);
        throw error;
    }
};

// Changed to call the notifications search endpoint with a status filter
export const getApprovedVesselVisits = async (): Promise<VesselVisit[]> => {
    try {
        const response = await apiClient.get<VesselVisit[]>(`/notifications/search?status=Approved`);
        return response.data;
    } catch (error) {
        console.error('Error fetching approved vessel visits:', error);
        throw error;
    }
};

export const getResources = async (): Promise<Resource[]> => {
    try {
        const response = await apiClient.get<Resource[]>(`/Resource`);
        return response.data;
    } catch (error) {
        console.error('Error fetching resources:', error);
        throw error;
    }
};

// Use the vessel controller route that returns vessel by IMO at GET /api/Vessel/{imo}
export const getVesselByImo = async (imo: string): Promise<{ imo: string; name: string; vesselTypeId?: string }> => {
    try {
        const response = await apiClient.get(`/Vessel/${imo}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vessel by IMO:', error);
        throw error;
    }
};
