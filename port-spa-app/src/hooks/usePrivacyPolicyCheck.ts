import { useState, useEffect } from 'react';
import { privacyPolicyService, type UserPolicyStatusDto } from '../services/privacyPolicyService';
import { useAuth } from '../auth/AuthProvider';

/**
 * Hook to check if the user needs to acknowledge the privacy policy
 * Returns the status and a function to refresh it
 */
export const usePrivacyPolicyCheck = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<UserPolicyStatusDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const policyStatus = await privacyPolicyService.getUserPolicyStatus();
            setStatus(policyStatus);
        } catch (err: any) {
            console.error('Error checking privacy policy status:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, [user]);

    return {
        status,
        loading,
        error,
        requiresAcknowledgment: status?.requiresAcknowledgment || false,
        currentPolicy: status?.currentPolicy || null,
        refresh: checkStatus
    };
};
