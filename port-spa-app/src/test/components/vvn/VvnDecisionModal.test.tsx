import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VvnDecisionModal from '../../../components/vvn/VvnDecisionModal';
import type { VesselVisitNotification } from '../../../domain/vvn/vvn.model';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Ship: () => <div data-testid="icon-ship" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    User: () => <div data-testid="icon-user" />,
    Weight: () => <div data-testid="icon-weight" />,
    List: () => <div data-testid="icon-list" />,
    CheckCircle: () => <div data-testid="icon-check-circle" />,
    XCircle: () => <div data-testid="icon-x-circle" />,
}));

// Mock Modal and Badge
vi.mock('../../../components/common/Modal', () => ({
    default: ({ isOpen, title, children }: any) => (
        isOpen ? (
            <div data-testid="modal">
                <h1>{title}</h1>
                {children}
            </div>
        ) : null
    )
}));

vi.mock('../../../components/common/Badge', () => ({
    default: ({ status }: { status: string }) => <div data-testid="badge">{status}</div>
}));

describe('VvnDecisionModal', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirmApprove = vi.fn();
    const mockOnConfirmReject = vi.fn();

    const defaultVvn: VesselVisitNotification = {
        id: 'vvn1',
        businessId: '1',
        vesselImo: '1234567',
        estimatedArrival: '2025-11-20T10:00:00',
        estimatedDeparture: '2025-11-21T10:00:00',
        status: 'Submitted' as const,
        cargo: { id: 1, description: 'Test Cargo', weight: 100, containers: [] },
        crewMembers: [],
        decisionLog: [],
        submittedBy: 'Agent Smith',
        assignedDockId: null,
        assignedDockName: null
    };

    it('renders nothing when not open', () => {
        render(
            <VvnDecisionModal 
                isOpen={false} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="approve"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders approval form correctly', () => {
        render(
            <VvnDecisionModal 
                isOpen={true} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="approve"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        
        expect(screen.getByText('Approve Vessel Visit')).toBeInTheDocument();
        expect(screen.getByText('Approval Form')).toBeInTheDocument();
        expect(screen.getByLabelText('Dock to Assign')).toBeInTheDocument();
        expect(screen.getByText('Confirm Approval')).toBeInTheDocument();
    });

    it('renders rejection form correctly', () => {
        render(
            <VvnDecisionModal 
                isOpen={true} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="reject"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        
        expect(screen.getByText('Reject Vessel Visit')).toBeInTheDocument();
        expect(screen.getByText('Rejection Form')).toBeInTheDocument();
        expect(screen.getByLabelText('Reason for Rejection')).toBeInTheDocument();
        expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
    });

    it('validates approval form (requires dock name)', () => {
        render(
            <VvnDecisionModal 
                isOpen={true} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="approve"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        
        fireEvent.click(screen.getByText('Confirm Approval'));
        expect(screen.getByText('Dock name is required to approve.')).toBeInTheDocument();
        expect(mockOnConfirmApprove).not.toHaveBeenCalled();
    });

    it('submits approval form with valid data', () => {
        render(
            <VvnDecisionModal 
                isOpen={true} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="approve"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        
        fireEvent.change(screen.getByLabelText('Dock to Assign'), { target: { value: 'Dock A' } });
        fireEvent.click(screen.getByText('Confirm Approval'));
        
        expect(mockOnConfirmApprove).toHaveBeenCalledWith('1', { 
            officerId: 'OFFICER-001', 
            dockName: 'Dock A' 
        });
    });

    it('validates rejection form (requires reason)', () => {
        render(
            <VvnDecisionModal 
                isOpen={true} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="reject"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        
        fireEvent.click(screen.getByText('Confirm Rejection'));
        expect(screen.getByText('A reason is required to reject.')).toBeInTheDocument();
        expect(mockOnConfirmReject).not.toHaveBeenCalled();
    });

    it('submits rejection form with valid data', () => {
        render(
            <VvnDecisionModal 
                isOpen={true} 
                onClose={mockOnClose} 
                vvn={defaultVvn} 
                action="reject"
                onConfirmApprove={mockOnConfirmApprove}
                onConfirmReject={mockOnConfirmReject}
            />
        );
        
        fireEvent.change(screen.getByLabelText('Reason for Rejection'), { target: { value: 'Incomplete data' } });
        fireEvent.click(screen.getByText('Confirm Rejection'));
        
        expect(mockOnConfirmReject).toHaveBeenCalledWith('1', { 
            officerId: 'OFFICER-001', 
            reason: 'Incomplete data' 
        });
    });
});
