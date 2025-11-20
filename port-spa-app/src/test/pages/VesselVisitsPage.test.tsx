import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VesselVisitNotificationPage from '../../pages/VesselVisitsPage';
import * as useVvnListControllerModule from '../../controllers/vvn/useVvnListController';
import { BrowserRouter } from 'react-router-dom';

// Mock the controller hook
vi.mock('../../controllers/vvn/useVvnListController');

// Mock child components to simplify testing
vi.mock('../../components/vvn/VvnCard', () => ({
    default: ({ vvn, onApprove, onReject, onReopen, onSubmit, onEdit, onViewDetails }: any) => (
        <div data-testid={`vvn-card-${vvn.businessId}`}>
            <span>{vvn.vesselName}</span>
            <button onClick={onApprove}>Approve</button>
            <button onClick={onReject}>Reject</button>
            <button onClick={onReopen}>Reopen</button>
            <button onClick={onSubmit}>Submit</button>
            <button onClick={onEdit}>Edit</button>
            <button onClick={onViewDetails}>View Details</button>
        </div>
    )
}));

vi.mock('../../components/vvn/VvnDetailsModal', () => ({
    default: ({ isOpen }: any) => isOpen ? <div data-testid="vvn-details-modal">Details Modal</div> : null
}));

vi.mock('../../components/vvn/VvnDecisionModal', () => ({
    default: ({ isOpen, action, onConfirmApprove, onConfirmReject }: any) => (
        isOpen ? (
            <div data-testid="vvn-decision-modal">
                Decision Modal: {action}
                <button onClick={onConfirmApprove}>Confirm Approve</button>
                <button onClick={onConfirmReject}>Confirm Reject</button>
            </div>
        ) : null
    )
}));

vi.mock('../../components/common/ConfirmationModal', () => ({
    default: ({ isOpen, title, onConfirm }: any) => (
        isOpen ? (
            <div data-testid="confirmation-modal">
                {title}
                <button onClick={onConfirm}>Confirm</button>
            </div>
        ) : null
    )
}));

vi.mock('../../components/common/StatCard', () => ({
    default: ({ title, value }: any) => <div data-testid="stat-card">{title}: {value}</div>
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    SlidersHorizontal: () => <div data-testid="icon-sliders" />,
    Twitch: () => <div data-testid="icon-twitch" />,
}));

describe('VesselVisitNotificationPage', () => {
    const mockSetQuery = vi.fn();
    const mockSetFilterStatus = vi.fn();
    const mockOpenSubmitModal = vi.fn();
    const mockOpenViewDetailsModal = vi.fn();
    const mockOpenDecisionModal = vi.fn();
    const mockOpenReopenModal = vi.fn();
    const mockCloseAllModals = vi.fn();
    const mockHandleSubmit = vi.fn();
    const mockExecuteApprove = vi.fn();
    const mockExecuteReject = vi.fn();
    const mockExecuteReopen = vi.fn();
    const mockHandleEdit = vi.fn();
    const mockHandleViewToggle = vi.fn();

    const defaultControllerValues = {
        loading: false,
        error: null,
        successMessage: null,
        filteredVvns: [],
        viewAsRole: 'ShippingAgentRepresentative',
        internalRole: 'ShippingAgentRepresentative',
        agentStats: { inProgress: 1, pending: 2, approved: 3, rejected: 4 },
        officerStats: null,
        query: '',
        setQuery: mockSetQuery,
        filterStatus: '',
        setFilterStatus: mockSetFilterStatus,
        submitModalState: { isOpen: false },
        viewModalState: { isOpen: false, vvn: null },
        decisionModalState: { isOpen: false, vvn: null, action: null },
        reopenModalState: { isOpen: false },
        openSubmitModal: mockOpenSubmitModal,
        openViewDetailsModal: mockOpenViewDetailsModal,
        openDecisionModal: mockOpenDecisionModal,
        openReopenModal: mockOpenReopenModal,
        closeAllModals: mockCloseAllModals,
        handleSubmit: mockHandleSubmit,
        executeApprove: mockExecuteApprove,
        executeReject: mockExecuteReject,
        executeReopen: mockExecuteReopen,
        handleEdit: mockHandleEdit,
        handleViewToggle: mockHandleViewToggle,
        myRepresentativeCitizenId: 'rep-123',
    };

    const setupControllerMock = (overrides = {}) => {
        // @ts-ignore
        useVvnListControllerModule.useVvnListController.mockReturnValue({
            ...defaultControllerValues,
            ...overrides,
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        setupControllerMock({ loading: true });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        setupControllerMock({ loading: false, filteredVvns: [] });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        expect(screen.getByText('No notifications found matching your criteria.')).toBeInTheDocument();
    });

    it('renders list of VVNs', () => {
        const vvns = [
            { businessId: '1', vesselName: 'Vessel A' },
            { businessId: '2', vesselName: 'Vessel B' }
        ];
        setupControllerMock({ filteredVvns: vvns });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        expect(screen.getByText('Vessel A')).toBeInTheDocument();
        expect(screen.getByText('Vessel B')).toBeInTheDocument();
    });

    it('renders agent view correctly', () => {
        setupControllerMock({ 
            internalRole: 'ShippingAgentRepresentative',
            viewAsRole: 'ShippingAgentRepresentative'
        });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        expect(screen.getByText('My Vessel Visit Notifications')).toBeInTheDocument();
        expect(screen.getByText('+ Create Visit')).toBeInTheDocument();
        expect(screen.getByText('In Progress: 1')).toBeInTheDocument();
    });

    it('renders officer view correctly', () => {
        setupControllerMock({ 
            internalRole: 'PortAuthorityOfficer',
            viewAsRole: 'PortAuthorityOfficer',
            officerStats: { pending: 5, approved: 6, rejected: 7, inProgress: 8 }
        });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        expect(screen.getByText('Vessel Visit Notifications')).toBeInTheDocument();
        expect(screen.queryByText('+ Create Visit')).not.toBeInTheDocument();
        expect(screen.getByText('Pending Review: 5')).toBeInTheDocument();
    });

    it('renders admin view with toggle button', () => {
        setupControllerMock({ 
            internalRole: 'Administrator',
            viewAsRole: 'ShippingAgentRepresentative'
        });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        expect(screen.getByTitle('Switch View')).toBeInTheDocument();
    });

    it('calls handleViewToggle when switch view button is clicked', () => {
        setupControllerMock({ 
            internalRole: 'Administrator',
            viewAsRole: 'ShippingAgentRepresentative'
        });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        fireEvent.click(screen.getByTitle('Switch View'));
        expect(mockHandleViewToggle).toHaveBeenCalled();
    });

    it('handles search input change', () => {
        setupControllerMock();
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        const searchInput = screen.getByPlaceholderText('Search by vessel name or IMO...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
        expect(mockSetQuery).toHaveBeenCalledWith('test');
    });

    it('handles filter status change', () => {
        setupControllerMock();
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'Approved' } });
        expect(mockSetFilterStatus).toHaveBeenCalledWith('Approved');
    });

    it('opens modals correctly from card actions', () => {
        const vvn = { businessId: '1', vesselName: 'Vessel A' };
        setupControllerMock({ filteredVvns: [vvn] });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        fireEvent.click(screen.getByText('Approve'));
        expect(mockOpenDecisionModal).toHaveBeenCalledWith(vvn, 'approve');

        fireEvent.click(screen.getByText('Reject'));
        expect(mockOpenDecisionModal).toHaveBeenCalledWith(vvn, 'reject');

        fireEvent.click(screen.getByText('Submit'));
        expect(mockOpenSubmitModal).toHaveBeenCalledWith('1');

        fireEvent.click(screen.getByText('Reopen'));
        expect(mockOpenReopenModal).toHaveBeenCalledWith('1');

        fireEvent.click(screen.getByText('Edit'));
        expect(mockHandleEdit).toHaveBeenCalledWith(vvn);

        fireEvent.click(screen.getByText('View Details'));
        expect(mockOpenViewDetailsModal).toHaveBeenCalledWith(vvn);
    });

    it('renders confirmation modal when open', () => {
        setupControllerMock({ submitModalState: { isOpen: true } });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        expect(screen.getByText('Submit Notification')).toBeInTheDocument();
    });

    it('calls handleSubmit when confirmation modal is confirmed', () => {
        setupControllerMock({ submitModalState: { isOpen: true } });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        fireEvent.click(screen.getByText('Confirm'));
        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('renders decision modal when open', () => {
        setupControllerMock({ decisionModalState: { isOpen: true, action: 'approve' } });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        expect(screen.getByText('Decision Modal: approve')).toBeInTheDocument();
    });

    it('calls executeApprove when decision modal approves', () => {
        setupControllerMock({ decisionModalState: { isOpen: true, action: 'approve' } });
        render(
            <BrowserRouter>
                <VesselVisitNotificationPage />
            </BrowserRouter>
        );
        
        fireEvent.click(screen.getByText('Confirm Approve'));
        expect(mockExecuteApprove).toHaveBeenCalled();
    });
});
