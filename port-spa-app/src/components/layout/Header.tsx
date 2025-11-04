// src/components/layout/Header.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth0 } from '@auth0/auth0-react';

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link
            to={to}
            className={`px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-maritime-100 text-maritime-800' : 'text-gray-700 hover:bg-maritime-50'}`}
        >
            {label}
        </Link>
    );
};

const Header: React.FC = () => {
    // 2. Extrair as funções e o estado de autenticação do hook
    const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();

    return (
        <header className="w-full bg-white border-b">
            <div className="container flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    <div className="brand">
                        <div className="brand-logo"><BrandLogo /></div>
                        <div className="hidden sm:block">
                            <div className="text-lg font-semibold">Port Authority</div>
                            <div className="text-xs text-gray-500">Harbour operations dashboard</div>
                        </div>
                    </div>
                </div>

                {/* 3. Mostrar a navegação apenas se o utilizador estiver autenticado */}
                {isAuthenticated && (
                    <nav className="hidden md:flex items-center gap-2">
                        <NavLink to="/" label="Dashboard" />
                        <NavLink to="/vessel-types" label="Vessel Types" />
                        <NavLink to="/vessel-visits" label="Vessel Visits" />
                    </nav>
                )}

                <div className="flex items-center gap-3">
                    {/* 4. Gerir os diferentes estados: a carregar, autenticado, ou não autenticado */}
                    {isLoading ? (
                        // Mostra um placeholder enquanto o estado de login está a ser verificado
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : isAuthenticated ? (
                        // Se estiver autenticado, mostra as ações do utilizador e o botão de logout
                        <>
                            <div className="relative hidden sm:block">
                                <input
                                    placeholder="Search..."
                                    className="px-3 py-2 rounded-lg border text-sm w-48 focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                />
                            </div>
                            <button className="btn btn-primary">New</button>
                            <span className="text-sm text-gray-700 hidden sm:block">
                                Olá, {user?.name ?? user?.email}
                            </span>
                            <button
                                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        // Se não estiver autenticado, mostra apenas o botão de login
                        <button onClick={() => loginWithRedirect()} className="btn btn-primary">
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;