// port-spa-app/src/components/layout/Layout.tsx
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, isInternalLoading, internalRole } = useAuth();
    const location = useLocation();

    // This is the state we added in the last step
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const isExpanded = isSidebarPinned || isSidebarHovered;

    // --- THIS IS NEW ---
    // We need a simple boolean to tell the header if the sidebar is visible at all.
    const isSidebarVisible = !!(isAuthenticated && internalRole);
    // -------------------

    if (isLoading || isInternalLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    const renderContent = () => {
        // (This function is unchanged)
        if (location.pathname === '/activate') {
            return children;
        }
        if (isAuthenticated) {
            if (internalRole) {
                return children;
            }
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
        return <div className="text-center text-xl">Please log in to continue.</div>;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {isSidebarVisible && (
                <Sidebar
                    isExpanded={isExpanded}
                    isPinned={isSidebarPinned}
                    setIsHovered={setIsSidebarHovered}
                    setIsPinned={setIsSidebarPinned}
                />
            )}

            <div className="flex-1 flex flex-col">
                {/* --- THIS IS THE MAIN CHANGE ---
                  We now pass the sidebar's state to the Header.
                */}
                <Header
                    isSidebarVisible={isSidebarVisible}
                    isExpanded={isExpanded}
                />

                {/* This main tag is already correct from our last step */}
                <main className={`flex-1 overflow-y-auto overflow-x-hidden p-6 transition-all duration-300 ${
                    isSidebarVisible ? (isExpanded ? 'md:ml-64' : 'md:ml-20') : ''
                }`}>
                    {renderContent()}
                </main>
                {isSidebarVisible && <div className="h-14 flex-shrink-0" />}
                {isSidebarVisible && 
                    <Footer
                        isSidebarVisible={isSidebarVisible}
                        isExpanded={isExpanded}
                    />}
            </div>
        </div>
    );
};

export default Layout;