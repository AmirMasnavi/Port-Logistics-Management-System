/**
 * US 4.1.6 - Resource Metrics Service
 * Client for fetching resource allocation metrics from OEM API
 */
import axios from 'axios';
import { getAuthToken } from '../firebaseConfig';

// OEM API base URL - port 5274 is the OEM API default
const OEM_API_BASE_URL = import.meta.env.VITE_OEM_API_URL || 'http://localhost:5274/api';

const oemApiClient = axios.create({
    baseURL: OEM_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor to add Firebase auth token
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

export type ResourceType = 'crane' | 'dock' | 'staff';

export interface ResourceAllocationSummary {
    resourceType: string;
    resourceId: string;
    period: {
        from: string;
        to: string;
    };
    totalAllocatedMinutes: number;
    totalAllocatedHours: number;
    numberOfOperations: number;
}

export interface DailyBreakdown {
    date: string;
    allocatedMinutes: number;
    allocatedHours: number;
    operationCount: number;
}

export interface ResourceAllocationBreakdown extends ResourceAllocationSummary {
    breakdownByDay: DailyBreakdown[];
}

export interface ResourceMetricsRequest {
    resourceType: ResourceType;
    resourceId: string;
    from: string; // ISO date string
    to: string;   // ISO date string
}

/**
 * Get resource allocation summary for a period
 */
export async function getResourceAllocationSummary(
    request: ResourceMetricsRequest
): Promise<ResourceAllocationSummary> {
    const { resourceType, resourceId, from, to } = request;
    
    // URL: /api/oem/metrics/resources/{type}/{id} - base already has /api
    const url = `oem/metrics/resources/${resourceType}/${encodeURIComponent(resourceId)}`;
    const params = { from, to };
    
    console.log('[ResourceMetrics] Calling:', OEM_API_BASE_URL + '/' + url, params);
    
    const response = await oemApiClient.get<{ success: boolean; data: ResourceAllocationSummary }>(url, { params });
    
    if (!response.data.success) {
        throw new Error('Failed to fetch resource allocation summary');
    }
    
    return response.data.data;
}

/**
 * Get daily breakdown of resource allocation
 */
export async function getResourceAllocationBreakdown(
    request: ResourceMetricsRequest
): Promise<ResourceAllocationBreakdown> {
    const { resourceType, resourceId, from, to } = request;
    
    const url = `oem/metrics/resources/${resourceType}/${encodeURIComponent(resourceId)}/breakdown`;
    const params = { from, to };
    
    console.log('[ResourceMetrics] Calling breakdown:', OEM_API_BASE_URL + '/' + url, params);
    
    const response = await oemApiClient.get<{ success: boolean; data: ResourceAllocationBreakdown }>(url, { params });
    
    if (!response.data.success) {
        throw new Error('Failed to fetch resource allocation breakdown');
    }
    
    return response.data.data;
}

/**
 * Get resource allocation summary using POST (for complex queries)
 */
export async function postResourceAllocationSummary(
    request: ResourceMetricsRequest
): Promise<ResourceAllocationSummary> {
    const response = await oemApiClient.post<{ success: boolean; data: ResourceAllocationSummary }>(
        'oem/metrics/resources/summary',
        request
    );
    
    if (!response.data.success) {
        throw new Error('Failed to fetch resource allocation summary');
    }
    
    return response.data.data;
}

export const resourceMetricsService = {
    getResourceAllocationSummary,
    getResourceAllocationBreakdown,
    postResourceAllocationSummary,
};

export default resourceMetricsService;

