// port-spa-app/src/components/layout/Layout.tsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth0 } from '@auth0/auth0-react'; // Importe o hook

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    // Se não estiver autenticado, pode mostrar uma página de login ou simplesmente nada do layout principal
    if (!isAuthenticated) {
       
        // Por agora, o Header vai mostrar "Login".
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {isAuthenticated && <Sidebar />} {/* Mostra a sidebar só se estiver autenticado */}
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {isAuthenticated ? children : <div className="text-center text-xl">Por favor, faça login para continuar.</div>}
                </main>
                {isAuthenticated && <Footer />}
            </div>
        </div>
    );
};

export default Layout;