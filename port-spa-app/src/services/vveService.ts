import axios from 'axios';
import { getAuthToken } from '../firebaseConfig';
import type { VveOperationsDetailedResponse, UpdateOperationStatusDto } from '../domain/vve/operation-execution.types';

// OEM API base URL
const OEM_API_BASE_URL = import.meta.env.VITE_OEM_API_URL || 'http://localhost:3001/api';

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
    creatorEmail?: string;
}

export interface ExecutedOperation {
    operationId: string;
    name: string;
    type: 'WAITING' | 'LOADING' | 'UNLOADING' | 'Other' | 'Loading' | 'Unloading' | 'Preparation' | 'Completion' | 'Inspection';
    status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'SUSPENDED';
    startTime?: string;
    startedBy?: string;
    endTime?: string;
    completedBy?: string;
    actualResource?: string;
    notes?: string;
}

export interface VveWithMetrics extends VveListItem {
    actualDepartureTime?: string;
    actualBerthTime?: string;
    berthDockId?: string;
    actualUnberthTime?: string;
    actualPortDepartureTime?: string;
    completedBy?: string;
    completedAt?: string;
    notes: string;
    creatorUserId: string;
    updatedAt: string;
    metrics: ExecutionMetrics | null;
    vvnData: VvnData | null;
    executedOperations?: ExecutedOperation[];
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

    /**
     * Get VVE with operation plan comparison (US 4.1.9)
     */
    async getVveOperationsDetailed(vveId: string): Promise<VveOperationsDetailedResponse> {
        try {
            const response = await vveApiClient.get<{ success: boolean; data: VveOperationsDetailedResponse }>(
                `/${vveId}/operations-detailed`
            );
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch operation details:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch operation details.');
        }
    }

    /**
     * Update operation status (US 4.1.9)
     */
    async updateOperationStatus(vveId: string, operationId: string, dto: UpdateOperationStatusDto): Promise<void> {
        try {
            console.log('[VveService] Updating operation status:', {
                url: `/${vveId}/operations/${operationId}/status`,
                dto
            });
            
            await vveApiClient.put(
                `/${vveId}/operations/${operationId}/status`,
                dto
            );
            
            console.log('[VveService] Operation status updated successfully');
        } catch (error: any) {
            console.error('[VveService] Failed to update operation status:', error);
            console.error('[VveService] Error response:', error.response?.data);
            console.error('[VveService] Error status:', error.response?.status);
            
            // Throw with detailed error message
            const errorMsg = error.response?.data?.message 
                || error.response?.data?.error
                || error.message 
                || 'Failed to update operation status.';
                
            throw new Error(errorMsg);
        }
    }

    /**
     * Complete VVE (US 4.1.11)
     * Mark a VVE as completed with unberth and port departure times
     */
    async completeVve(vveId: string, data: {
        actualUnberthTime: string;
        actualPortDepartureTime: string;
    }): Promise<VveWithMetrics> {
        try {
            const response = await vveApiClient.post<{ success: boolean; data: VveWithMetrics }>(
                `/${vveId}/complete`,
                data
            );
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to complete VVE:', error);
            
            // Return more specific error messages
            if (error.response?.status === 409) {
                throw new Error(error.response?.data?.message || 'Cannot complete VVE: there are unfinished operations.');
            }
            
            throw new Error(error.response?.data?.message || 'Failed to complete vessel visit execution.');
        }
    }
}

export const vveService = new VveService();
