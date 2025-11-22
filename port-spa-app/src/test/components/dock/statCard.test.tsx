import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../../../components/dock/StatCard'; // Ajusta o caminho conforme necessário

describe('StatCard Component', () => {
    it('renders title, value, and description correctly', () => {
        // Arrange
        const props = {
            title: 'Total Capacity',
            value: '5000',
            description: 'TEU units available'
        };

        // Act
        render(
            <StatCard
                title={props.title}
        value={props.value}
        description={props.description}
        />
    );

        // Assert
        expect(screen.getByText(props.title)).toBeInTheDocument();
        expect(screen.getByText(props.value)).toBeInTheDocument();
        expect(screen.getByText(props.description)).toBeInTheDocument();
    });

    it('renders numeric values correctly', () => {
        render(
            <StatCard
                title="Active Cranes"
        value={42}
        description="Operational"
            />
    );

        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('applies correct styling classes to the value', () => {
        render(
            <StatCard
                title="Style Test"
        value="99"
        description="Testing colors"
            />
    );

        const valueElement = screen.getByText('99');

        // Verifica se as classes do Tailwind estão aplicadas
        expect(valueElement).toHaveClass('text-3xl');
        expect(valueElement).toHaveClass('font-bold');
        expect(valueElement).toHaveClass('text-blue-600');
    });

    it('renders zero values correctly', () => {
        render(
            <StatCard
                title="Zero Test"
        value={0}
        description="Zero items"
            />
    );

        expect(screen.getByText('0')).toBeInTheDocument();
    });
});