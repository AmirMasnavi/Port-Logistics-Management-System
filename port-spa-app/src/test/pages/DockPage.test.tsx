import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DockPage from '../../pages/DockPage';
import * as useDockListControllerModule from '../../controllers/dock/useDockListController';

// --- Mocks ---

// 1. Mock dos ícones (lucide-react)
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    SlidersHorizontal: () => <div data-testid="icon-sliders" />,
}));

// 2. Mock dos componentes filhos para simplificar a árvore de renderização
// Isto isola o teste da página de problemas nos componentes individuais
vi.mock('../../components/common/StatCard', () => ({
    default: ({ title, value }: any) => <div data-testid="stat-card">{title}: {value}</div>
}));

vi.mock('../../components/dock/DockCard', () => ({
    default: ({ dock, onEdit, onDelete }: any) => (
        <div data-testid="dock-card">
            <span>{dock.name}</span>
            <button onClick={onEdit}>Edit</button>
            <button onClick={onDelete}>Delete</button>
        </div>
    )
}));

vi.mock('../../components/dock/DockForm', () => ({
    default: () => <div data-testid="dock-form">Mock Form</div>
}));

vi.mock('../../components/common/Modal', () => ({
    default: ({ isOpen, title, children }: any) => isOpen ? (
        <div data-testid="modal">
            <h1>{title}</h1>
            {children}
        </div>
    ) : null
}));

vi.mock('../../components/common/ConfirmationModal', () => ({
    default: ({ isOpen, onConfirm }: any) => isOpen ? (
        <div data-testid="confirmation-modal">
            <button onClick={onConfirm}>Confirm Delete</button>
        </div>
    ) : null
}));

// 3. Mock do Controller (O motor da página)
const mockController = vi.spyOn(useDockListControllerModule, 'useDockListController');

describe('DockPage', () => {
    // Valores padrão para o mock do controller
    const defaultControllerValues = {
        loading: false,
        error: null,
        successMessage: null,
        filteredDocks: [],
        stats: { total: 0, avgLength: 0, avgDepth: 0, totalCranes: 0 },
        isModalOpen: false,
        editingDock: null,
        deletingDockId: null,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        filterSize: 'all',
        setFilterSize: vi.fn(),
        handleOpenCreateModal: vi.fn(),
        handleOpenEditModal: vi.fn(),
        handleCloseModal: vi.fn(),
        handleSuccess: vi.fn(),
        setDeletingDockId: vi.fn(),
        handleDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state correctly', () => {
        mockController.mockReturnValue({ ...defaultControllerValues, loading: true });

        render(<DockPage />);

        expect(screen.getByText('Loading docks...')).toBeInTheDocument();
    });

    it('renders empty state correctly', () => {
        mockController.mockReturnValue({ ...defaultControllerValues, loading: false, filteredDocks: [] });

        render(<DockPage />);

        expect(screen.getByText('No docks found matching your criteria.')).toBeInTheDocument();
    });

    it('renders error message if present', () => {
        mockController.mockReturnValue({ ...defaultControllerValues, error: 'Failed to fetch' });

        render(<DockPage />);

        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('renders success message if present', () => {
        mockController.mockReturnValue({ ...defaultControllerValues, successMessage: 'Dock created!' });

        render(<DockPage />);

        expect(screen.getByText('Dock created!')).toBeInTheDocument();
    });

    it('renders statistics and list of docks', () => {
        const mockDocks = [
            { id: '1', name: 'Dock A' },
            { id: '2', name: 'Dock B' }
        ];
        mockController.mockReturnValue({
            ...defaultControllerValues,
            // @ts-ignore - parcial mock
            filteredDocks: mockDocks,
            stats: { total: 2, avgLength: 200, avgDepth: 15, totalCranes: 5 }
        });

        render(<DockPage />);

        // Verificar Título
        expect(screen.getByText('Docks')).toBeInTheDocument();

        // Verificar Stats
        expect(screen.getByText('Total Docks: 2')).toBeInTheDocument();
        expect(screen.getByText('Avg Length: 200 m')).toBeInTheDocument();
        expect(screen.getByText('Avg Depth: 15 m')).toBeInTheDocument();
        expect(screen.getByText('Total STS Cranes: 5')).toBeInTheDocument();

        // Verificar Lista
        expect(screen.getAllByTestId('dock-card')).toHaveLength(2);
        expect(screen.getByText('Dock A')).toBeInTheDocument();
        expect(screen.getByText('Dock B')).toBeInTheDocument();
    });

    it('handles search input interaction', () => {
        mockController.mockReturnValue(defaultControllerValues);
        render(<DockPage />);

        const searchInput = screen.getByPlaceholderText('Search by name, zone or section...');
        fireEvent.change(searchInput, { target: { value: 'Zone A' } });

        expect(defaultControllerValues.setSearchQuery).toHaveBeenCalledWith('Zone A');
    });

    it('handles filter select interaction', () => {
        mockController.mockReturnValue(defaultControllerValues);
        render(<DockPage />);

        const filterSelect = screen.getByRole('combobox'); // O <select>
        fireEvent.change(filterSelect, { target: { value: 'large' } });

        expect(defaultControllerValues.setFilterSize).toHaveBeenCalledWith('large');
    });

    it('opens create modal when Create button is clicked', () => {
        mockController.mockReturnValue(defaultControllerValues);
        render(<DockPage />);

        fireEvent.click(screen.getByText('+ Create Dock'));

        expect(defaultControllerValues.handleOpenCreateModal).toHaveBeenCalled();
    });

    it('opens edit modal when Edit button on card is clicked', () => {
        const mockDocks = [{ id: '1', name: 'Dock A' }];
        mockController.mockReturnValue({
            ...defaultControllerValues,
            // @ts-ignore
            filteredDocks: mockDocks
        });

        render(<DockPage />);

        fireEvent.click(screen.getByText('Edit'));

        expect(defaultControllerValues.handleOpenEditModal).toHaveBeenCalledWith(mockDocks[0]);
    });

    it('triggers delete confirmation when Delete button on card is clicked', () => {
        const mockDocks = [{ id: '1', name: 'Dock A' }];
        mockController.mockReturnValue({
            ...defaultControllerValues,
            // @ts-ignore
            filteredDocks: mockDocks
        });

        render(<DockPage />);

        fireEvent.click(screen.getByText('Delete'));

        expect(defaultControllerValues.setDeletingDockId).toHaveBeenCalledWith('1');
    });

    it('renders Modal with Form when isModalOpen is true', () => {
        mockController.mockReturnValue({
            ...defaultControllerValues,
            isModalOpen: true,
            editingDock: null
        });

        render(<DockPage />);

        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByText('Create New Dock')).toBeInTheDocument();
        expect(screen.getByTestId('dock-form')).toBeInTheDocument();
    });

    it('renders ConfirmationModal when deletingDockId is set', () => {
        mockController.mockReturnValue({
            ...defaultControllerValues,
            deletingDockId: '123'
        });

        render(<DockPage />);

        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

        // Testar clique na confirmação
        fireEvent.click(screen.getByText('Confirm Delete'));
        expect(defaultControllerValues.handleDelete).toHaveBeenCalled();
    });
});