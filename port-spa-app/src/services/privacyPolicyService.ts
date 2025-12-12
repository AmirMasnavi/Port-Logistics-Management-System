// Service for Privacy Policy API calls
import { apiClient } from './apiService';

export interface PrivacyPolicyDto {
    id: string;
    version: number;
    title: string;
    content: string;
    isCurrent: boolean;
    effectiveDate: string;
    createdAt: string;
    createdBy: string;
    changeReason?: string;
}

export interface UserPolicyStatusDto {
    requiresAcknowledgment: boolean;
    currentPolicy: PrivacyPolicyDto | null;
    lastAcknowledgedVersion?: number;
}

export interface AcknowledgePrivacyPolicyDto {
    policyId: string;
    policyVersion: number;
}

class PrivacyPolicyService {
    private readonly baseUrl = '/PrivacyPolicy';

    /**
     * Get the current active privacy policy (public endpoint - no auth required)
     */
    async getCurrentPolicy(): Promise<PrivacyPolicyDto | null> {
        try {
            const response = await apiClient.get<PrivacyPolicyDto>(`${this.baseUrl}/current`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null; // No policy published yet
            }
            throw error;
        }
    }

    /**
     * Get user's policy acknowledgment status (requires authentication)
     */
    async getUserPolicyStatus(): Promise<UserPolicyStatusDto> {
        const response = await apiClient.get<UserPolicyStatusDto>(`${this.baseUrl}/user/status`);
        return response.data;
    }

    /**
     * Acknowledge the current privacy policy (requires authentication)
     */
    async acknowledgePolicy(dto: AcknowledgePrivacyPolicyDto): Promise<void> {
        await apiClient.post(`${this.baseUrl}/acknowledge`, dto);
    }

    /**
     * Get all privacy policy versions (Admin only)
     */
    async getPolicyHistory(): Promise<PrivacyPolicyDto[]> {
        const response = await apiClient.get<PrivacyPolicyDto[]>(`${this.baseUrl}/history`);
        return response.data;
    }

    /**
     * Get specific policy by ID (Admin only)
     */
    async getPolicyById(id: string): Promise<PrivacyPolicyDto> {
        const response = await apiClient.get<PrivacyPolicyDto>(`${this.baseUrl}/${id}`);
        return response.data;
    }

    /**
     * Create new privacy policy (Admin only)
     */
    async createPolicy(title: string, content: string, changeReason?: string): Promise<PrivacyPolicyDto> {
        const response = await apiClient.post<PrivacyPolicyDto>(this.baseUrl, {
            title,
            content,
            changeReason
        });
        return response.data;
    }
}

export const privacyPolicyService = new PrivacyPolicyService();
