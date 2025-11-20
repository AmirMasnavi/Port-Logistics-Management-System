import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VvnDetailsModal from '../../../components/vvn/VvnDetailsModal';
import type { VesselVisitNotification } from '../../../domain/vvn/vvn.model';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Ship: () => <div data-testid="icon-ship" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Anchor: () => <div data-testid="icon-anchor" />,
    Box: () => <div data-testid="icon-box" />,
    Weight: () => <div data-testid="icon-weight" />,
    Users: () => <div data-testid="icon-users" />,
    List: () => <div data-testid="icon-list" />,
    Shield: () => <div data-testid="icon-shield" />,
    Check: () => <div data-testid="icon-check" />,
    X: () => <div data-testid="icon-x" />,
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

describe('VvnDetailsModal', () => {
    const mockOnClose = vi.fn();

    const defaultVvn: VesselVisitNotification = {
        id: 'vvn1',
        businessId: '1',
        vesselImo: '1234567',
        estimatedArrival: '2025-11-20T10:00:00',
        estimatedDeparture: '2025-11-21T10:00:00',
        status: 'InProgress',
        cargo: { 
            id: 1,
            description: 'Test Cargo', 
            weight: 100, 
            containers: [
                { id: 1, containerCode: 'C1', position: 'P1' }
            ] 
        },
        crewMembers: [
            { id: 'crew1', name: 'John Doe', nationality: 'US', isSafetyOfficer: true }
        ],
        decisionLog: [],
        submittedBy: 'Agent Smith',
        assignedDockId: 'Dock 1',
        assignedDockName: 'Dock 1 Name'
    };

    it('renders nothing when not open', () => {
        render(<VvnDetailsModal isOpen={false} onClose={mockOnClose} vvn={defaultVvn} />);
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders nothing when vvn is null', () => {
        render(<VvnDetailsModal isOpen={true} onClose={mockOnClose} vvn={null} />);
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders basic details correctly', () => {
        render(<VvnDetailsModal isOpen={true} onClose={mockOnClose} vvn={defaultVvn} />);
        
        expect(screen.getByText('Vessel Visit Details')).toBeInTheDocument();
        expect(screen.getByText('Vessel: 1234567')).toBeInTheDocument();
        expect(screen.getByText('Dock 1 Name')).toBeInTheDocument();
        expect(screen.getByTestId('badge')).toHaveTextContent('InProgress');
    });

    it('renders cargo details correctly', () => {
        render(<VvnDetailsModal isOpen={true} onClose={mockOnClose} vvn={defaultVvn} />);
        
        expect(screen.getByText('100 kg')).toBeInTheDocument();
        expect(screen.getByText('Test Cargo')).toBeInTheDocument();
        expect(screen.getByText('C1')).toBeInTheDocument();
        expect(screen.getByText('P1')).toBeInTheDocument();
    });

    it('renders crew details correctly', () => {
        render(<VvnDetailsModal isOpen={true} onClose={mockOnClose} vvn={defaultVvn} />);
        
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('US')).toBeInTheDocument();
        expect(screen.getByText('Safety Officer')).toBeInTheDocument();
    });

    it('renders empty states for cargo and crew', () => {
        const emptyVvn = {
            ...defaultVvn,
            status: 'Submitted' as const,
            cargo: { id: 1, description: 'Test Cargo', weight: 100, containers: [] },
            crewMembers: [],
        };
        render(<VvnDetailsModal isOpen={true} onClose={mockOnClose} vvn={emptyVvn} />);
        
        expect(screen.queryByText('Containers')).not.toBeInTheDocument();
        expect(screen.getByText('No crew members listed.')).toBeInTheDocument();
    });

    it('renders waiting message when submitted', () => {
        const submittedVvn = { ...defaultVvn, status: 'Submitted' as const };
        render(<VvnDetailsModal isOpen={true} onClose={mockOnClose} vvn={submittedVvn} />);
        
        expect(screen.getByText('Waiting for Port Authority approval.')).toBeInTheDocument();
    });
});
