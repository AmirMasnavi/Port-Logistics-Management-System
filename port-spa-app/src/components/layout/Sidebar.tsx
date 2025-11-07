import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../auth/AuthProvider';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { internalRole } = useAuth();

    const Item: React.FC<{ to: string; label: string }> = ({ to, label }) => {
        const active = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${active ? 'bg-maritime-100 text-maritime-800 font-semibold' : 'text-gray-700 hover:bg-maritime-50'}`}
            >
                <span className="w-6 h-6 rounded flex items-center justify-center bg-maritime-200 text-maritime-800">⛵</span>
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <aside className="w-64 bg-white border-r hidden md:flex flex-col">
            <div className="p-4 border-b">
                <div className="brand">
                    <div className="brand-logo"><BrandLogo /></div>
                    <div className="ml-3">
                        <div className="text-sm font-semibold">Port Authority</div>
                        <div className="text-xs text-gray-500">Harbour dashboard</div>
                    </div>
                </div>
            </div>

            <nav className="p-4 flex-1 space-y-1">
                <Item to="/" label="Dashboard" />
                <Item to="/vessel-types" label="Vessel Types" />
                <Item to="/vessel-visits" label="Vessel Visits" />
                <Item to="/visualization" label="Visualization" />

                {/* 3. ADD CONDITIONAL RENDERING FOR THE ADMIN LINK */}
                {internalRole === 'Administrator' && (
                    <>
                        {/* Add a divider */}
                        <hr className="my-2" />
                        <Item to="/admin/users" label="User Admin" />
                    </>
                )}
            </nav>

            <div className="p-4 border-t">
                <div className="text-xs text-gray-500">© Port Authority</div>
            </div>
        </aside>
    );
};

export default Sidebar;
