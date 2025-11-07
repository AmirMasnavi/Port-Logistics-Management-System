// port-spa-app/src/components/layout/Layout.tsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../auth/AuthProvider'; // <-- IMPORT OUR NEW HOOK

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get state from our new hook
    const { isAuthenticated, isLoading, isInternalLoading, internalRole } = useAuth();

    if (isLoading || isInternalLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    // This function decides what to show in the main content area
    const renderContent = () => {
        if (isAuthenticated) {
            if (internalRole) {
                return children; // Logged in AND authorized
            }
            // Logged in but NOT authorized
            return (
                <div className="text-center text-xl panel max-w-lg mx-auto">
                    <h2 className="font-bold text-red-600 text-2xl">Access Denied</h2>
                    <p className="mt-2">
                        You have successfully logged in, but your account is not activated
                        or does not have a role assigned in this system.
                    </p>
                    <p className="mt-2">Please contact your administrator.</p>
                </div>
            );
        }
        // Not logged in
        return <div className="text-center text-xl">Please log in to continue.</div>;
    };

    // This logic remains almost identical
    return (
        <div className="flex h-screen bg-gray-100">
            {isAuthenticated && internalRole && <Sidebar />}
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </main>
                {isAuthenticated && internalRole && <Footer />}
            </div>
        </div>
    );
};

export default Layout;