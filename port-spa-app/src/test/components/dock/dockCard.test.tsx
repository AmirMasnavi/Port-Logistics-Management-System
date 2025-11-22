import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DockCard from '../../../components/dock/DockCard';
import type { Dock } from '../../../domain/dock/dock.model';

// Mock lucide-react icons para evitar erros de renderização e testar se são chamados
vi.mock('lucide-react', () => ({
    Ruler: () => <div data-testid="icon-ruler" />,
    Anchor: () => <div data-testid="icon-anchor" />,
    Ship: () => <div data-testid="icon-ship" />,
    PenTool: () => <div data-testid="icon-pentool" />,
    Edit: () => <div data-testid="icon-edit" />,
    Trash2: () => <div data-testid="icon-trash" />,
}));

describe('DockCard', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    const defaultDock: Dock = {
        id: 'dock-123',
        name: 'Main Terminal Dock',
        locationZone: 'North Port',
        locationSection: 'Section A',
        lengthInMeters: 350,
        depthInMeters: 18,
        maxDraftInMeters: 16,
        numberOfSTSCranes: 4,
        allowedVesselTypeIds: ['vt-001', 'vt-002']
    };

    const renderCard = (dockProps: Partial<Dock> = {}) => {
        return render(
            <DockCard
                dock={{ ...defaultDock, ...dockProps }}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        );
    };

    it('renders basic information correctly', () => {
        renderCard();

        expect(screen.getByText('Main Terminal Dock')).toBeInTheDocument();
        // Verifica se a zona e secção estão presentes
        expect(screen.getByText(/Zone: North Port/i)).toBeInTheDocument();
        expect(screen.getByText(/Sec: Section A/i)).toBeInTheDocument();
    });

    it('renders technical specifications correctly', () => {
        renderCard();

        // Verifica os valores numéricos e etiquetas
        expect(screen.getByText('Length')).toBeInTheDocument();
        expect(screen.getByText('350')).toBeInTheDocument();

        expect(screen.getByText('Depth')).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();

        expect(screen.getByText('Max Draft')).toBeInTheDocument();
        expect(screen.getByText('16')).toBeInTheDocument();

        expect(screen.getByText('STS Cranes')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('renders allowed vessel types list when present', () => {
        renderCard();

        expect(screen.getByText('Allowed Vessel Types:')).toBeInTheDocument();
        expect(screen.getByText('vt-001, vt-002')).toBeInTheDocument();
    });

    it('renders fallback text when allowed vessel types are empty', () => {
        renderCard({ allowedVesselTypeIds: [] });

        expect(screen.getByText('Allowed Vessel Types:')).toBeInTheDocument();
        expect(screen.getByText(/All types allowed \/ None specified/i)).toBeInTheDocument();
    });

    it('renders fallback text when allowed vessel types are undefined', () => {
        renderCard({ allowedVesselTypeIds: undefined });

        expect(screen.getByText(/All types allowed \/ None specified/i)).toBeInTheDocument();
    });

    it('calls onEdit when Edit button is clicked', () => {
        renderCard();

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when Delete button is clicked', () => {
        renderCard();

        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('renders correct units for specifications', () => {
        renderCard();

        // O 'm' aparece 3 vezes (Length, Depth, Draft)
        const meterUnits = screen.getAllByText('m');
        expect(meterUnits).toHaveLength(3);

        // 'units' aparece 1 vez (Cranes)
        expect(screen.getByText('units')).toBeInTheDocument();
    });
});