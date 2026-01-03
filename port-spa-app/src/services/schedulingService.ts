
import axios from 'axios';
import type { DailyScheduleRequest, DailyScheduleResponse, SchedulingAlgorithm, GeneticAlgorithmParams, ScheduledTask, MissingPlansResponse } from '../types/scheduling.types';
import { getAuthToken } from '../firebaseConfig';


// Add US 4.3.3 types import (keeps existing imports intact)
import type { RebalancingAlgorithmParams, RebalancingProposal, RebalancingConfirmRequest } from '../types/scheduling.types';

// Planning API base URL - should be configured in environment
const PLANNING_API_BASE_URL = import.meta.env.VITE_PLANNING_API_URL || 'http://localhost:5000';

const planningApiClient = axios.create({
    baseURL: PLANNING_API_BASE_URL,
    timeout: 60000, // 60 seconds - scheduling computation might take time
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- CONFIGURAÇÃO OEM API (Node.js) ---
const OEM_API_BASE_URL = import.meta.env.VITE_OEM_API_URL || 'http://localhost:3001/api';

const oemApiClient = axios.create({
    baseURL: OEM_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para adicionar o Token Firebase em todas as chamadas ao OEM
oemApiClient.interceptors.request.use(async (config) => {
    try {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.warn('Could not attach auth token to OEM request', error);
    }
    return config;
});

// --- TIPOS PARA O OEM ---
export interface CreateOperationPlanRequest {
    date: string;
    algorithm: string;
    geneticParams?: GeneticAlgorithmParams;
    rebalancingParams?: RebalancingAlgorithmParams; // US 4.3.3 - Add rebalancing parameters
    totalDelay: number;
    executionTimeMs: number;
    scheduledTasks: ScheduledTask[];
}

/** Tipos de Filtros Aceitos */
export interface OperationPlanFilters {
    date?: string;
    sortBy?: string;
}

export interface OperationPlan {
    planId: string;
    date: string;
    algorithm: string;
    status: string;
    metrics: {
        totalDelay: number;
        executionTimeMs: number;
    };
    geneticParams?: GeneticAlgorithmParams;
    rebalancingParams?: RebalancingAlgorithmParams; // US 4.3.3 - Add rebalancing parameters
    scheduledTasksCount?: number;
    scheduledTasks: ScheduledTask[];
    createdBy: string;
    createdAt: string;
}

export class SchedulingService {
    /**
     * Generate a daily schedule for the specified date
     * @param date - Date in YYYY-MM-DD format
     * @param algorithm - Algorithm to use (optimal, heuristic, multicrane, genetic, rebalancing)
     * @param geneticParams - Parameters for genetic algorithm (optional, required if algorithm is 'genetic')
     * @param rebalancingParams - Parameters for rebalancing algorithm (optional, required if algorithm is 'rebalancing')
     * @returns DailyScheduleResponse with scheduled tasks and warnings
     */
    async generateDailySchedule(
        date: string,
        algorithm: SchedulingAlgorithm = 'optimal',
        geneticParams?: GeneticAlgorithmParams,
        rebalancingParams?: RebalancingAlgorithmParams
    ): Promise<DailyScheduleResponse> {
        const request: DailyScheduleRequest = { 
            date, 
            algorithm,
            geneticParams,
            rebalancingParams
        };
        
        // Log the request for debugging
        console.log('[Scheduling] Request payload:', JSON.stringify(request, null, 2));
        
        try {
            const response = await planningApiClient.post<DailyScheduleResponse>(
                '/api/Scheduling/daily',
                request
            );
            return response.data;
        } catch (error: any) {
            console.error('Failed to generate daily schedule:', error);
            console.error('Error response:', error.response);
            console.error('Error data:', error.response?.data);
            
            if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
                throw new Error(`Planning API unreachable at ${PLANNING_API_BASE_URL}. Please ensure the backend is running and CORS allows this origin.`);
            }
            
            if (axios.isAxiosError(error) && error.response) {
                // Try to extract the detail from ProblemDetails format
                const detail = error.response.data?.detail || error.response.data?.message || error.response.data?.title;
                if (detail) {
                    throw new Error(`Failed to generate schedule: ${detail}`);
                }
                
                // Show status code and status text
                throw new Error(
                    `Failed to generate schedule: ${error.response.status} ${error.response.statusText}`
                );
            }
            
            throw new Error('Failed to generate schedule. Please try again.');
        }
    }
    
    async saveOperationPlan(plan: CreateOperationPlanRequest): Promise<OperationPlan> {
        try {
            console.log('[OEM] Saving plan:', plan);
            const response = await oemApiClient.post<{ success: boolean, data: OperationPlan }>(
                '/plans',
                plan
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to save operation plan:', error);
            throw new Error(error.response?.data?.message || 'Failed to save plan to OEM database.');
        }
    }
   
    /**
     * Fetches operation plans, optionally filtered by date or vesselVisitId.
     * @param filters - An object containing optional filtering criteria.
     */
    async getOperationPlans(filters: OperationPlanFilters = {}): Promise<OperationPlan[]> {
        try {
            const params = new URLSearchParams();

            // SÓ adiciona o filtro se o valor não for vazio (importante para evitar '?date=')
            if (filters.date) {
                params.append('date', filters.date);
            }
            if (filters.sortBy) {
                params.append('sortBy', filters.sortBy);
            }
            // Constrói a URL: /plans ou /plans?date=...&sortBy=...
            const url = `/plans?${params.toString()}`;

            const response = await oemApiClient.get<{ success: boolean, data: OperationPlan[] }>(url);
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch operation plans:', error);
            return [];
        }
    }
    
    async deleteOperationPlan(planId: string): Promise<void> {
        try {
            console.log('[OEM] Deleting plan:', planId);
            await oemApiClient.delete(`/plans/${planId}`);
        } catch (error: any) {
            console.error('Failed to delete plan:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete plan.');
        }
    }

    /**
     * Get VVNs that don't have an operation plan for a specific date
     * @param date - Date in YYYY-MM-DD format
     */
    async getMissingPlans(date: string): Promise<MissingPlansResponse> {
        try {
            const response = await oemApiClient.get<{ 
                success: boolean, 
                date: string,
                missingCount: number,
                hasExistingPlans: boolean,
                data: MissingPlansResponse 
            }>(`/plans/missing?date=${date}`);
            
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch missing plans:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch missing plans.');
        }
    }
    
    /**
     * Delete all operation plans for a specific date
     * @param date - Date in YYYY-MM-DD format
     */
    async deletePlansByDate(date: string): Promise<number> {
        try {
            // Get all plans for the date
            const plans = await this.getOperationPlans({ date });
            
            // Delete each plan
            for (const plan of plans) {
                await oemApiClient.delete(`/plans/${plan.planId}`);
            }
            
            console.log(`[OEM] Deleted ${plans.length} plans for date ${date}`);
            return plans.length;
        } catch (error: any) {
            console.error('Failed to delete plans:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete plans.');
        }
    }

    /**
     * Update a specific task within an operation plan
     */
    async updateOperationPlanTask(planId: string, taskId: string, updateData: {
        resourceId?: string;
        staffId?: string;
        startTime?: string;
        endTime?: string;
        reason: string;
        confirmWarnings?: boolean;
    }): Promise<{ success: boolean; warnings: string[]; requiresConfirmation?: boolean; plan: OperationPlan | null }> {
        try {
            console.log(`[OEM] Updating task ${taskId} in plan ${planId}`, updateData);
            const response = await oemApiClient.patch<{
                success: boolean;
                message: string;
                warnings: string[];
                requiresConfirmation?: boolean;
                data: OperationPlan;
            }>(`/plans/${planId}/tasks/${taskId}`, updateData);

            return {
                success: response.data.success,
                warnings: response.data.warnings,
                requiresConfirmation: response.data.requiresConfirmation,
                plan: response.data.data
            };
        } catch (error: any) {
            console.error('Failed to update task:', error);
            throw new Error(error.response?.data?.message || 'Failed to update task.');
        }
    }

    // US 4.3.3 - Generate daily schedule using rebalancing algorithm (non-breaking helper)
    async generateRebalancingDaily(
        date: string,
        params: RebalancingAlgorithmParams
    ): Promise<DailyScheduleResponse> {
        const request: DailyScheduleRequest = { date, algorithm: 'rebalancing', rebalancingParams: params };
        console.log('[Scheduling] Rebalancing daily payload:', JSON.stringify(request, null, 2));
        const response = await planningApiClient.post<DailyScheduleResponse>('/api/Scheduling/daily', request);
        return response.data;
    }

    // US 4.3.3 - Generate a rebalancing proposal (baseline vs proposed)
    async generateRebalancingProposal(request: DailyScheduleRequest): Promise<RebalancingProposal> {
        const normalized: DailyScheduleRequest = { ...request, algorithm: 'rebalancing' };
        console.log('[Scheduling] Proposal payload:', JSON.stringify(normalized, null, 2));
        const response = await planningApiClient.post<RebalancingProposal>(
            '/api/Scheduling/rebalance/proposal',
            normalized
        );
        return response.data;
    }

    // US 4.3.3 - Confirm a rebalancing proposal
    async confirmRebalancing(req: RebalancingConfirmRequest): Promise<{ proposalId: string; officerId: string; timestamp: string; comments?: string }> {
        const response = await planningApiClient.post<{ proposalId: string; officerId: string; timestamp: string; comments?: string }>(
            '/api/Scheduling/rebalance/confirm',
            req
        );
        return response.data;
    }

    /**
     * Get available resources and staff for selection
     */
    async getResourcesAndStaff(): Promise<{ resources: any[], staff: any[] }> {
        try {
            const response = await oemApiClient.get<{ success: boolean, data: { resources: any[], staff: any[] } }>('/plans/resources-staff');
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to fetch resources and staff:', error);
            return { resources: [], staff: [] };
        }
    }
}

export const schedulingService = new SchedulingService();
