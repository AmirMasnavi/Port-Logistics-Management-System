import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, isInternalLoading, roleStatus, accessDeniedReason } = useAuth();

    if (isLoading || isInternalLoading) {
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roleStatus !== 'active') {
        return (
            <div style={{ padding: 20 }}>
                <h2>Acesso negado</h2>
                <p>{accessDeniedReason ?? 'Acesso não autorizado.'}</p>
            </div>
        );
    }

    return <>{children}</>;
};

export default RequireAuth;
