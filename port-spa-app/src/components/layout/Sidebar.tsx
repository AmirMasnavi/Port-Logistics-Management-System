// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider'; // [cite: 192]
import { canManagePort, canViewPlanning, isAdmin, canViewVisualization } from '../../auth/permissions';

import { t } from '../../i18nClient';
// 1. Import the icons we need from lucide-react
import {
    LayoutDashboard,
    Ship,
    Anchor,
    Settings,
    LogOut,
    Building, // For Port Facilities (from image)
    ClipboardList, // For Shipping Agents
    PanelLeftClose, // Icon for "unpinned"
    PanelRightClose, // Icon for "pinned"
    Shield,
    Box, // For 3D Visualization
    SquareSquare, // For Docks
} from 'lucide-react';

// 2. Create a new, reusable component for our icon-links
// We can define it right inside this file for simplicity.
interface NavItemProps {
    to: string;
    label: string; // We use this for accessibility (tooltips later)
    icon: React.ComponentType<{ className?: string }>;
    isExpanded: boolean;// This lets us pass in the icon component
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon: Icon, isExpanded }) => {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link
            to={to}
            aria-label={label}
            title={label}
            // 3. We update the styles
            className={`flex items-center p-3 rounded-lg ${
                active
                    ? 'bg-maritime-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
            } ${
                isExpanded ? 'w-full justify-start gap-3' : 'justify-center'
            }`}
        >
            <Icon className="w-6 h-6 flex-shrink-0" />

            {/* 4. We conditionally render the label text */}
            {isExpanded && (
                <span className="overflow-hidden whitespace-nowrap font-medium">
                    {label}
                </span>
            )}
        </Link>
    );
};

// 5. Define the props our Sidebar now receives from Layout.tsx
interface SidebarProps {
    isExpanded: boolean;
    isPinned: boolean;
    setIsHovered: (isHovered: boolean) => void;
    setIsPinned: (isPinned: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
                                             isExpanded,
                                             isPinned,
                                             setIsHovered,
                                             setIsPinned
                                         }) => {
    const { internalRole, logout } = useAuth();
    // use t from i18nClient to avoid react-i18next typing issues

    
    return (
        // 6. This <aside> is now a "fixed" panel
        // It uses onMouseEnter/onMouseLeave to set the hover state in the parent
        // It has a dynamic width and transition
        <aside
            className={`fixed inset-y-0 left-0 bg-maritime-50 border-r hidden md:flex flex-col p-3 z-50
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'w-64' : 'w-20'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 7. The Pin button */}
            {/* It shows up when hovered, and lets you toggle the 'isPinned' state */}
            <button
                onClick={() => setIsPinned(!isPinned)}
                className={`absolute -right-3 top-14 z-50
                    flex items-center justify-center w-6 h-6 bg-white border rounded-full shadow
                    text-gray-500 hover:bg-gray-100
                    transition-opacity
                    ${isExpanded ? 'opacity-100' : 'opacity-0'}
                `}
                title={isPinned ? t('sidebar.unpin') : t('sidebar.pin')}
            >
                {isPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
            </button>

            {/* 8. Our updated BrandLogo, which now shows text when expanded */}
            <div
                className={`flex items-center p-3 rounded-lg mb-4
                    ${isExpanded ? 'w-full justify-start gap-3' : 'justify-center'}
                `}
                title={`${t('sidebar.role')}: ${internalRole}`} // Show role on hover
            >
                {/* The new icon */}
                <Shield className="w-6 h-6 flex-shrink-0 text-maritime-700" />

                {/* When expanded, show the role text */}
                {isExpanded && (
                    <div className="overflow-hidden whitespace-nowrap">
                        <div className="text-xs text-gray-500">{t('sidebar.role')}</div>
                        <div className="font-medium text-sm text-gray-800">
                            {internalRole}
                        </div>
                    </div>
                )}
            </div>
            {/* 9. Pass 'isExpanded' down to all NavItems */}
            
            <nav className="flex-1 flex flex-col items-center space-y-3">
                {/* Dashboard: Everyone */}
                <NavItem to="/" label={t('nav.dashboard')} icon={LayoutDashboard} isExpanded={isExpanded} />
                {/* Vessel Visits: Everyone */}
                <NavItem to="/vessel-visits" label={t('nav.vesselVisits')} icon={Ship} isExpanded={isExpanded} />
                
                {/* Vessel Types: Admin & Officer */}
                {canManagePort.has(internalRole || '') && (
                    <NavItem to="/vessel-types" label={t('nav.vesselTypes')} icon={Anchor} isExpanded={isExpanded} />
                )}
                {/* Port Facilities & Docks: Admin, Officer, Logistics */}
                {canViewPlanning.has(internalRole || '') && (
                    <>
                        <NavItem to="/port-facilities" label={t('nav.portFacilities')} icon={Building} isExpanded={isExpanded} />
                        <NavItem to="/docks" label={t('nav.docks')} icon={SquareSquare} isExpanded={isExpanded} />
                    </>
                )}
                {/* Shipping Agents: Admin & Officer */}
                {canManagePort.has(internalRole || '') && (
                    <NavItem to="/shippingagentorganization" label={t('nav.shippingAgents')} icon={ClipboardList} isExpanded={isExpanded} />
                )}
                {/* 3D Visualization: Admin, Officer, Logistics */}
                {canViewVisualization.has(internalRole || '') && (
                    <NavItem to="/visualization" label={t('nav.visualization')} icon={Box} isExpanded={isExpanded} />
                )}
                {/* Admin Page: Admin only */}
                {isAdmin.has(internalRole || '') && (
                    <>
                        <hr className="w-full my-2" />
                        <NavItem to="/admin/users" label={t('nav.userAdmin')} icon={Settings} isExpanded={isExpanded} />
                    </>
                )}
            </nav>

            {/* Logout button */}
            {/* 10. The Logout button, now also expanding */}
            <div className="mt-auto w-full">
                <button
                    onClick={logout}
                    title={t('button.logout')}
                    className={`flex items-center p-3 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600
                        ${isExpanded ? 'w-full justify-start gap-3' : 'justify-center'}
                    `}
                >
                    <LogOut className="w-6 h-6 flex-shrink-0" />
                    {isExpanded && (
                        <span className="overflow-hidden whitespace-nowrap font-medium">
                            {t('button.logout')}
                        </span>
                    )}
                </button>
            </div>
        </aside>
     );
 };

 export default Sidebar;
