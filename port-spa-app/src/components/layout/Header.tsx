import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';

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

                <nav className="hidden md:flex items-center gap-2">
                    <NavLink to="/" label="Dashboard" />
                    <NavLink to="/vessel-types" label="Vessel Types" />
                    <NavLink to="/vessel-visits" label="Vessel Visits" />
                </nav>

                <div className="flex items-center gap-3">
                    <div className="relative hidden sm:block">
                        <input
                            placeholder="Search..."
                            className="px-3 py-2 rounded-lg border text-sm w-48 focus:outline-none focus:ring-2 focus:ring-maritime-500"
                        />
                    </div>

                    <button className="btn btn-primary">New</button>
                </div>
            </div>
        </header>
    );
};

export default Header;
