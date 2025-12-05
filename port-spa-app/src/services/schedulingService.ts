// Scheduling API Service
import axios from 'axios';
import type { DailyScheduleRequest, DailyScheduleResponse, SchedulingAlgorithm, GeneticAlgorithmParams } from '../types/scheduling.types';

// Planning API base URL - should be configured in environment
const PLANNING_API_BASE_URL = import.meta.env.VITE_PLANNING_API_URL || 'http://localhost:5000';

const planningApiClient = axios.create({
    baseURL: PLANNING_API_BASE_URL,
    timeout: 60000, // 60 seconds - scheduling computation might take time
    headers: {
        'Content-Type': 'application/json',
    }
});

export class SchedulingService {
    /**
     * Generate a daily schedule for the specified date
     * @param date - Date in YYYY-MM-DD format
     * @param algorithm - Algorithm to use (optimal, heuristic, multicrane, genetic)
     * @param geneticParams - Parameters for genetic algorithm (optional, required if algorithm is 'genetic')
     * @returns DailyScheduleResponse with scheduled tasks and warnings
     */
    async generateDailySchedule(
        date: string,
        algorithm: SchedulingAlgorithm = 'optimal',
        geneticParams?: GeneticAlgorithmParams
    ): Promise<DailyScheduleResponse> {
        const request: DailyScheduleRequest = { 
            date, 
            algorithm,
            geneticParams 
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
}

export const schedulingService = new SchedulingService();
