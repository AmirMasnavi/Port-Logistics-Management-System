import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { usePrivacyPolicyCheck } from '../../hooks/usePrivacyPolicyCheck';
import PrivacyPolicyModal from '../common/PrivacyPolicyModal';

interface PrivacyPolicyGuardProps {
    children: React.ReactNode;
}

/**
 * Component that wraps authenticated content and checks if user needs to accept privacy policy
 * Displays modal automatically when user needs to acknowledge the policy
 */
const PrivacyPolicyGuard = ({ children }: PrivacyPolicyGuardProps) => {
    const { user, logout } = useAuth();
    const { requiresAcknowledgment, currentPolicy, refresh, loading } = usePrivacyPolicyCheck();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Show modal if user is authenticated and needs to acknowledge
        if (user && !loading && requiresAcknowledgment && currentPolicy) {
            setShowModal(true);
        }
    }, [user, loading, requiresAcknowledgment, currentPolicy]);

    const handleAccept = async () => {
        setShowModal(false);
        // Refresh the status to confirm acceptance
        await refresh();
    };

    const handleDecline = () => {
        // If user declines, log them out
        logout();
    };

    // Show modal if needed
    if (showModal && currentPolicy) {
        return (
            <PrivacyPolicyModal
                policy={currentPolicy}
                onAccept={handleAccept}
                onDecline={handleDecline}
            />
        );
    }

    // Otherwise, render children normally
    return <>{children}</>;
};

export default PrivacyPolicyGuard;
