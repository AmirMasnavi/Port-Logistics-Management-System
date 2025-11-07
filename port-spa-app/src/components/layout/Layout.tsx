// port-spa-app/src/components/layout/Layout.tsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../auth/AuthProvider'; // <-- IMPORT OUR NEW HOOK

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get state from our new hook
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    // This logic remains almost identical
    return (
        <div className="flex h-screen bg-gray-100">
            {isAuthenticated && <Sidebar />}
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* The Header now handles the login prompt via its modal */}
                    {isAuthenticated ? children : <div className="text-center text-xl">Por favor, faça login para continuar.</div>}
                </main>
                {isAuthenticated && <Footer />}
            </div>
        </div>
    );
};

export default Layout;