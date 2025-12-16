// VVE Service - Vessel Visit Execution API
import axios from 'axios';
import { getAuthToken } from '../firebaseConfig';

// OEM API base URL
const OEM_API_BASE_URL = import.meta.env.VITE_OEM_API_URL || 'http://localhost:5274/api';

const vveApiClient = axios.create({
    baseURL: `${OEM_API_BASE_URL}/vve`,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor to add Firebase token
vveApiClient.interceptors.request.use(async (config) => {
    try {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.warn('Could not attach auth token to VVE request', error);
    }
    return config;
});

export interface VveFilters {
    status?: 'In Progress' | 'Completed' | 'Cancelled';
    vvnId?: string;
    vesselIdentifier?: string;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string; // YYYY-MM-DD
    includeMetrics?: boolean;
}

export interface ExecutionMetrics {
    arrivalDelay: number; // hours
    waitingTimeForBerthing: number; // hours
    totalTurnaroundTime: number | null; // hours
    berthOccupancyTime: number | null; // hours
    departureDelay: number | null; // hours
    estimatedTurnaroundTime: number; // hours
    operationDelay: number | null; // hours
}

export interface VvnData {
    estimatedArrival: string;
    estimatedDeparture: string;
    assignedDockName?: string;
    assignedDockId?: string;
}

export interface VveListItem {
    vveId: string;
    vvnId: string;
    vesselIdentifier: string;
    status: 'In Progress' | 'Completed' | 'Cancelled';
    actualArrivalTime: string;
    createdAt: string;
}

export interface VveWithMetrics extends VveListItem {
    actualDepartureTime?: string;
    actualBerthTime?: string;
    berthDockId?: string;
    notes: string;
    creatorUserId: string;
    updatedAt: string;
    metrics: ExecutionMetrics | null;
    vvnData: VvnData | null;
}

export interface CreateVveRequest {
    vvnId: string;
    vesselIdentifier: string;
    actualArrivalTime: string;
    notes?: string;
}

export interface UpdateVveRequest {
    status?: 'In Progress' | 'Completed' | 'Cancelled';
    actualDepartureTime?: string;
    notes?: string;
    actualBerthTime?: string;
    berthDockId?: string;
}

export class VveService {
    /**
     * Get all VVEs with optional filtering
     */
    async getAllVves(filters: VveFilters = {}): Promise<VveWithMetrics[]> {
        try {
            const params = new URLSearchParams();
            
            if (filters.status) params.append('status', filters.status);
            if (filters.vvnId) params.append('vvnId', filters.vvnId);
            if (filters.vesselIdentifier) params.append('vesselIdentifier', filters.vesselIdentifier);
            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);
            if (filters.includeMetrics) params.append('includeMetrics', 'true');

            const response = await vveApiClient.get<{ success: boolean; data: VveWithMetrics[] }>(
                `?${params.toString()}`
            );
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch VVEs:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch vessel visit executions.');
        }
    }

    /**
     * Get VVE by ID
     */
    async getVveById(vveId: string): Promise<VveWithMetrics> {
        try {
            const response = await vveApiClient.get<{ success: boolean; data: VveWithMetrics }>(
                `/${vveId}`
            );
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch VVE:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch vessel visit execution.');
        }
    }

    /**
     * Create a new VVE
     */
    async createVve(data: CreateVveRequest): Promise<VveWithMetrics> {
        try {
            const response = await vveApiClient.post<{ success: boolean; data: VveWithMetrics }>(
                '/',
                data
            );
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to create VVE:', error);
            throw new Error(error.response?.data?.message || 'Failed to create vessel visit execution.');
        }
    }

    /**
     * Update VVE
     */
    async updateVve(vveId: string, data: UpdateVveRequest): Promise<VveWithMetrics> {
        try {
            const response = await vveApiClient.put<{ success: boolean; data: VveWithMetrics }>(
                `/${vveId}`,
                data
            );
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to update VVE:', error);
            throw new Error(error.response?.data?.message || 'Failed to update vessel visit execution.');
        }
    }

    /**
     * Delete VVE
     */
    async deleteVve(vveId: string): Promise<void> {
        try {
            await vveApiClient.delete(`/${vveId}`);
        } catch (error: any) {
            console.error('Failed to delete VVE:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete vessel visit execution.');
        }
    }

    /**
     * Get VVE statistics
     */
    async getStatistics(): Promise<{
        total: number;
        inProgress: number;
        completed: number;
        cancelled: number;
    }> {
        try {
            const response = await vveApiClient.get<{
                success: boolean;
                data: {
                    total: number;
                    inProgress: number;
                    completed: number;
                    cancelled: number;
                };
            }>('/statistics');
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch statistics:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch statistics.');
        }
    }
}

export const vveService = new VveService();

