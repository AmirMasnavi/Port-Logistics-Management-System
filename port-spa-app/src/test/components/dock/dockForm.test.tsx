import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DockForm from '../../../components/dock/DockForm';
import { dockService } from '../../../app/dock/dock.service.instance';
import * as apiService from '../../../services/apiService';
import type { Dock } from '../../../domain/dock/dock.model';

// --- Mocks ---

// Mock do serviço de Dock
vi.mock('../../../app/dock/dock.service.instance', () => ({
    dockService: {
        createDock: vi.fn(),
        updateDock: vi.fn(),
    }
}));

// Mock dos ícones do lucide-react
vi.mock('lucide-react', () => ({
    ChevronDown: () => <div data-testid="icon-chevron-down" />,
    ChevronUp: () => <div data-testid="icon-chevron-up" />,
}));

describe('DockForm Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    // Dados de exemplo
    const mockVesselTypes = [
        { id: 'vt-1', name: 'Container Ship', description: '', capacity: 1000, maxRows: 10, maxBays: 10, maxTiers: 10 },
        { id: 'vt-2', name: 'Tanker', description: '', capacity: 2000, maxRows: 5, maxBays: 5, maxTiers: 5 }
    ];

    const existingDock: Dock = {
        id: 'dock-123',
        name: 'Existing Dock',
        locationZone: 'Zone A',
        locationSection: 'Sec 1',
        lengthInMeters: 200,
        depthInMeters: 15,
        maxDraftInMeters: 14,
        numberOfSTSCranes: 2,
        allowedVesselTypeIds: ['vt-1']
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock da chamada à API para obter tipos de navio
        vi.spyOn(apiService, 'getAllVesselTypes').mockResolvedValue(mockVesselTypes);
    });

    it('renders correctly in Create mode (empty fields)', async () => {
        render(
            <DockForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        );

        // Espera pelo carregamento dos vessel types (useEffect)
        await waitFor(() => expect(apiService.getAllVesselTypes).toHaveBeenCalled());

        expect(screen.getByLabelText('ID (Optional)')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toHaveValue('');
        expect(screen.getByLabelText('Zone')).toHaveValue('');
        expect(screen.getByText('Create')).toBeInTheDocument();

        // Dropdown deve estar fechado e mostrar "None selected"
        expect(screen.getByText('Allowed Vessel Types')).toBeInTheDocument();
        expect(screen.getByText('None selected')).toBeInTheDocument();
    });

    it('renders correctly in Edit mode (pre-filled fields)', async () => {
        render(
            <DockForm
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                initialData={existingDock}
            />
        );

        await waitFor(() => expect(apiService.getAllVesselTypes).toHaveBeenCalled());

        // ID não deve aparecer em edit mode (conforme lógica do componente)
        expect(screen.queryByLabelText('ID (Optional)')).not.toBeInTheDocument();

        expect(screen.getByLabelText('Name')).toHaveValue('Existing Dock');
        expect(screen.getByLabelText('Length (m)')).toHaveValue(200);
        expect(screen.getByText('Update')).toBeInTheDocument();

        // Dropdown deve indicar seleção inicial
        expect(screen.getByText('1 type selected')).toBeInTheDocument();
    });

    it('handles vessel type dropdown interaction', async () => {
        render(
            <DockForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
        );

        await waitFor(() => expect(apiService.getAllVesselTypes).toHaveBeenCalled());

        // 1. Abrir o dropdown
        const dropdownHeader = screen.getByText('Allowed Vessel Types').closest('button');
        fireEvent.click(dropdownHeader!);

        // 2. Verificar se as opções aparecem
        expect(screen.getByText('Container Ship')).toBeInTheDocument();
        expect(screen.getByText('Tanker')).toBeInTheDocument();

        // 3. Selecionar uma opção
        const checkbox = screen.getAllByRole('checkbox')[0]; // Container Ship
        fireEvent.click(checkbox);

        // 4. Verificar se o contador no cabeçalho atualizou
        expect(screen.getByText('1 type selected')).toBeInTheDocument();
    });

    it('submits new dock successfully', async () => {
        // Setup do sucesso da criação
        const createdDock = { ...existingDock, id: 'new-id' };
        vi.mocked(dockService.createDock).mockResolvedValue(createdDock);

        render(<DockForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        await waitFor(() => expect(apiService.getAllVesselTypes).toHaveBeenCalled());

        // Preencher formulário
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Dock' } });
        fireEvent.change(screen.getByLabelText('Zone'), { target: { value: 'Z1' } });
        fireEvent.change(screen.getByLabelText('Section'), { target: { value: 'S1' } });
        fireEvent.change(screen.getByLabelText('Length (m)'), { target: { value: '100' } });
        fireEvent.change(screen.getByLabelText('Depth (m)'), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText('Max Draft (m)'), { target: { value: '9' } });
        fireEvent.change(screen.getByLabelText('STS Cranes'), { target: { value: '2' } });

        // Submeter
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(dockService.createDock).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Dock',
                lengthInMeters: 100,
                numberOfSTSCranes: 2
            }));
            expect(mockOnSuccess).toHaveBeenCalledWith(createdDock);
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('updates existing dock successfully', async () => {
        const updatedDock = { ...existingDock, name: 'Updated Name' };
        vi.mocked(dockService.updateDock).mockResolvedValue(updatedDock);

        render(
            <DockForm
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                initialData={existingDock}
            />
        );
        await waitFor(() => expect(apiService.getAllVesselTypes).toHaveBeenCalled());

        // Alterar nome
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });

        // Submeter
        fireEvent.click(screen.getByText('Update'));

        await waitFor(() => {
            expect(dockService.updateDock).toHaveBeenCalledWith('dock-123', expect.objectContaining({
                name: 'Updated Name',
                lengthInMeters: 200 // Mantém o valor original
            }));
            expect(mockOnSuccess).toHaveBeenCalledWith(updatedDock);
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('displays error message on submission failure', async () => {
        const errorMessage = 'Failed to create dock due to invalid data';
        vi.mocked(dockService.createDock).mockRejectedValue(new Error(errorMessage));

        render(<DockForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        await waitFor(() => expect(apiService.getAllVesselTypes).toHaveBeenCalled());

        // Preencher o mínimo necessário para o HTML validation passar
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Fail Dock' } });
        fireEvent.change(screen.getByLabelText('Zone'), { target: { value: 'Z' } });
        fireEvent.change(screen.getByLabelText('Section'), { target: { value: 'S' } });
        fireEvent.change(screen.getByLabelText('Length (m)'), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText('Depth (m)'), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText('Max Draft (m)'), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText('STS Cranes'), { target: { value: '1' } });

        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    it('handles cancel button click', async () => {
        render(<DockForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        fireEvent.click(screen.getByText('Cancel'));

        expect(mockOnClose).toHaveBeenCalled();
    });
});