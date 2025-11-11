import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { InternalRole } from '../services/apiService';

const Menu: React.FC = () => {
    const { internalRole } = useAuth();

    if (!internalRole) return null;

    switch (internalRole) {
        case InternalRole.Administrator:
            return (
                <nav>
                    <ul>
                        <li>Dashboard</li>
                        <li>Gestão de Utilizadores</li>
                        <li>Relatórios</li>
                    </ul>
                </nav>
            );

        case InternalRole.LogisticsOperator:
            return (
                <nav>
                    <ul>
                        <li>Dashboard</li>
                        <li>Gestão de Cargas</li>
                        <li>Movimentação</li>
                        <li>Relatórios Operacionais</li>
                    </ul>
                </nav>
            );

        case InternalRole.PortAuthorityOfficer:
            return (
                <nav>
                    <ul>
                        <li>Dashboard</li>
                        <li>Monitorização do Porto</li>
                        <li>Autorizações</li>
                        <li>Relatórios do Porto</li>
                    </ul>
                </nav>
            );

        case InternalRole.ShippingAgentRep:
            return (
                <nav>
                    <ul>
                        <li>Dashboard</li>
                        <li>Minhas Encomendas</li>
                        <li>Documentação</li>
                        <li>Comunicações</li>
                    </ul>
                </nav>
            );

        default:
            return (
                <nav>
                    <ul>
                        <li>Dashboard</li>
                    </ul>
                </nav>
            );
    }
};

export default Menu;
