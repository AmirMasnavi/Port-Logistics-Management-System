import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface RoleProtectedRouteProps {
    allowedRoles: Set<string>;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRoles }) => {
    const { internalRole, isInternalLoading } = useAuth();

    // While the role is being fetched from the API, show a loading message.
    // This prevents a brief flash of the page or a premature redirect.
    if (isInternalLoading) {
        return <div className="flex h-screen items-center justify-center">Checking permissions...</div>;
    }

    // If the user has a role and that role is included in the set of allowed roles,
    // render the requested child component via the <Outlet />.
    if (internalRole && allowedRoles.has(internalRole)) {
        return <Outlet />;
    }

    // If the user is not authorized, redirect them to the main dashboard.
    // The `replace` prop prevents the user from clicking the "back" button
    // to get back to the unauthorized page.
    return <Navigate to="/" replace />;
};

export default RoleProtectedRoute;