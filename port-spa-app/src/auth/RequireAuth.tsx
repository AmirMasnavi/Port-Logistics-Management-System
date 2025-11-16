import React from 'react';
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from './AuthProvider';

const RequireAuth: React.FC = () => {
    const { isAuthenticated, internalRole, isLoading, isInternalLoading, roleStatus, accessDeniedReason } = useAuth();

    const location = useLocation();

    
    if (isLoading || isInternalLoading) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isAuthenticated && internalRole) {
        // If authorized, render the child route that the user was trying to access.
        return <Outlet />;
    }

    if (roleStatus !== 'active') {
        return (
            <div style={{ padding: 20 }}>
                <h2>Acesso negado</h2>
                <p>{accessDeniedReason ?? 'Acesso não autorizado.'}</p>
            </div>
        );
    }

    return <Navigate to="/" state={{ from: location }} replace />;
};

export default RequireAuth;
