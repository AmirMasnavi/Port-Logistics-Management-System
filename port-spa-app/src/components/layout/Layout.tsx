// port-spa-app/src/components/layout/Layout.tsx
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading, isInternalLoading, internalRole } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    // Use a lightweight cast to avoid deep generic instantiation from react-i18next types
    const { t } = (useTranslation as unknown as () => { t: (key: string) => string })();

    // This is the state we added in the last step
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const isExpanded = isSidebarPinned || isSidebarHovered;

    // --- THIS IS NEW ---
    // We need a simple boolean to tell the header if the sidebar is visible at all.
    const isSidebarVisible = !!(isAuthenticated && internalRole);
    // -------------------

    if (isLoading || isInternalLoading) {
        return <div className="flex h-screen items-center justify-center">{t('loading')}</div>;
    }

    const renderContent = () => {
        // Allow public access to certain routes even when not authenticated
        const publicRoutes = ['/activate', '/privacy-policy', '/data-rights'];
        if (publicRoutes.includes(location.pathname)) {
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
                        {t('layout.accessDenied.description')}
                    </p>
                    <p className="mt-2">{t('layout.accessDenied.contact')}</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        {t('layout.loginPrompt')}
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Please log in to access the port management system
                    </p>
                </div>
                <button
                    onClick={() => navigate('/privacy-policy')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    How to Request Access
                </button>
            </div>
        );
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
                <main className={`flex-1 overflow-y-auto overflow-x-hidden p-4 transition-all duration-300 ${
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