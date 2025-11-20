import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VvnCard from '../../../components/vvn/VvnCard';
import type { VesselVisitNotification } from '../../../domain/vvn/vvn.model';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Ship: () => <div data-testid="icon-ship" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Anchor: () => <div data-testid="icon-anchor" />,
    User: () => <div data-testid="icon-user" />,
    RefreshCcw: () => <div data-testid="icon-refresh" />,
}));

// Mock Badge component
vi.mock('../../../components/common/Badge', () => ({
    default: ({ status }: { status: string }) => <div data-testid="badge">{status}</div>
}));

describe('VvnCard', () => {
    const mockOnApprove = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnSubmit = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnViewDetails = vi.fn();
    const mockOnReopen = vi.fn();

    const defaultVvn: VesselVisitNotification = {
        id: '1',
        businessId: '1',
        vesselImo: '1234567',
        estimatedArrival: '2025-11-20T10:00:00',
        estimatedDeparture: '2025-11-21T10:00:00',
        status: 'InProgress',
        cargo: { id: 1, description: 'Test Cargo', weight: 100, containers: [] },
        crewMembers: [],
        decisionLog: [],
        submittedBy: 'Agent Smith',
        assignedDockId: 'Dock 1',
        assignedDockName: 'Dock 1 Name'
    };

    const renderCard = (props: Partial<any> = {}) => {
        return render(
            <VvnCard
                vvn={defaultVvn}
                internalRole="ShippingAgentRepresentative"
                onApprove={mockOnApprove}
                onReject={mockOnReject}
                onSubmit={mockOnSubmit}
                onEdit={mockOnEdit}
                onViewDetails={mockOnViewDetails}
                onReopen={mockOnReopen}
                {...props}
            />
        );
    };

    it('renders basic information correctly', () => {
        renderCard();
        expect(screen.getByText('Vessel: 1234567')).toBeInTheDocument();
        expect(screen.getByText('Agent Smith')).toBeInTheDocument();
        expect(screen.getByTestId('badge')).toHaveTextContent('InProgress');
    });

    describe('Role: ShippingAgentRepresentative', () => {
        it('shows Edit and Submit buttons when status is InProgress', () => {
            renderCard({ 
                internalRole: 'ShippingAgentRepresentative',
                vvn: { ...defaultVvn, status: 'InProgress' }
            });
            
            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
        });

        it('shows View Status button when status is Submitted', () => {
            renderCard({ 
                internalRole: 'ShippingAgentRepresentative',
                vvn: { ...defaultVvn, status: 'Submitted' }
            });
            
            expect(screen.getByText('View Status')).toBeInTheDocument();
            expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        });

        it('calls onEdit when Edit button is clicked', () => {
            renderCard({ 
                internalRole: 'ShippingAgentRepresentative',
                vvn: { ...defaultVvn, status: 'InProgress' }
            });
            
            fireEvent.click(screen.getByText('Edit'));
            expect(mockOnEdit).toHaveBeenCalled();
        });

        it('calls onSubmit when Submit button is clicked', () => {
            renderCard({ 
                internalRole: 'ShippingAgentRepresentative',
                vvn: { ...defaultVvn, status: 'InProgress' }
            });
            
            fireEvent.click(screen.getByText('Submit for Approval'));
            expect(mockOnSubmit).toHaveBeenCalled();
        });
    });

    describe('Role: PortAuthorityOfficer', () => {
        it('shows Approve and Reject buttons when status is Submitted', () => {
            renderCard({ 
                internalRole: 'PortAuthorityOfficer',
                vvn: { ...defaultVvn, status: 'Submitted' }
            });
            
            expect(screen.getByText('Approve')).toBeInTheDocument();
            expect(screen.getByText('Reject')).toBeInTheDocument();
        });

        it('shows Reopen button when status is Rejected', () => {
            renderCard({ 
                internalRole: 'PortAuthorityOfficer',
                vvn: { ...defaultVvn, status: 'Rejected' }
            });
            
            expect(screen.getByText('Reopen')).toBeInTheDocument();
            expect(screen.getByText('View Log')).toBeInTheDocument();
        });

        it('shows View Log button when status is Approved', () => {
            renderCard({ 
                internalRole: 'PortAuthorityOfficer',
                vvn: { ...defaultVvn, status: 'Approved' }
            });
            
            expect(screen.getByText('View Log')).toBeInTheDocument();
            expect(screen.queryByText('Approve')).not.toBeInTheDocument();
        });

        it('calls onApprove when Approve button is clicked', () => {
            renderCard({ 
                internalRole: 'PortAuthorityOfficer',
                vvn: { ...defaultVvn, status: 'Submitted' }
            });
            
            fireEvent.click(screen.getByText('Approve'));
            expect(mockOnApprove).toHaveBeenCalled();
        });

        it('calls onReject when Reject button is clicked', () => {
            renderCard({ 
                internalRole: 'PortAuthorityOfficer',
                vvn: { ...defaultVvn, status: 'Submitted' }
            });
            
            fireEvent.click(screen.getByText('Reject'));
            expect(mockOnReject).toHaveBeenCalled();
        });
    });

    describe('Role: Administrator', () => {
        it('behaves like Officer (shows Approve/Reject for Submitted)', () => {
            renderCard({ 
                internalRole: 'Administrator',
                vvn: { ...defaultVvn, status: 'Submitted' }
            });
            
            expect(screen.getByText('Approve')).toBeInTheDocument();
            expect(screen.getByText('Reject')).toBeInTheDocument();
        });
    });
});
