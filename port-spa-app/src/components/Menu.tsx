import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { InternalRole } from '../services/apiService';
import { t } from '../i18nClient';

const Menu: React.FC = () => {
    const { internalRole } = useAuth();

    if (!internalRole) return null;

    switch (internalRole) {
        case InternalRole.Administrator:
            return (
                <nav>
                    <ul>
                        <li>{t('menu.dashboard')}</li>
                        <li>{t('menu.userAdmin')}</li>
                        <li>{t('menu.reports')}</li>
                    </ul>
                </nav>
            );

        case InternalRole.LogisticsOperator:
            return (
                <nav>
                    <ul>
                        <li>{t('menu.dashboard')}</li>
                        <li>{t('menu.cargoManagement')}</li>
                        <li>{t('menu.movements')}</li>
                        <li>{t('menu.operationalReports')}</li>
                        {/* VVE Management Link */}
                        <li><Link to="/vessel-visits/new-vve">{t('menu.createVve') || 'Create VVE'}</Link></li>
                    </ul>
                </nav>
            );

        case InternalRole.PortAuthorityOfficer:
            return (
                <nav>
                    <ul>
                        <li>{t('menu.dashboard')}</li>
                        <li>{t('menu.monitoring')}</li>
                        <li>{t('menu.authorizations')}</li>
                        <li>{t('menu.portReports')}</li>
                    </ul>
                </nav>
            );

        case InternalRole.ShippingAgentRep:
            return (
                <nav>
                    <ul>
                        <li>{t('menu.dashboard')}</li>
                        <li>{t('menu.myOrders')}</li>
                        <li>{t('menu.documentation')}</li>
                        <li>{t('menu.communications')}</li>
                    </ul>
                </nav>
            );

        default:
            return (
                <nav>
                    <ul>
                        <li>{t('menu.dashboard')}</li>
                    </ul>
                </nav>
            );
    }
};

export default Menu;
