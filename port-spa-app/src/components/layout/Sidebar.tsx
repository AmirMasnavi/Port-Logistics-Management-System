import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
    return (
        <nav className="w-64 h-screen bg-gray-800 text-gray-200 p-4">
            <div className="text-2xl font-bold text-white mb-6">
                Port Project
            </div>
            <ul>
                {/* Placeholder for US 3.1.5 */}
                <li className="mb-2">
                    <Link to="/" className="hover:text-white">Dashboard</Link>
                </li>
                <li className="mb-2">
                    <Link to="/vessel-visits" className="hover:text-white">Vessel Visits</Link>
                </li>
                <li className="mb-2">
                    <Link to="/vessel-types" className="hover:text-white">Vessel Types</Link>
                </li>
                {/* We can add more links here as we build other pages */}
            </ul>
        </nav>
    );
};

export default Sidebar;