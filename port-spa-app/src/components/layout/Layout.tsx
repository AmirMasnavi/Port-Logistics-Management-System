import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

// This component is designed to wrap any page component.
// "children" will be the page (e.g., VesselTypesPage)
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar (Always visible) */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header (Always visible) */}
                <Header />

                {/* Page Content (Scrollable) */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;