import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateVvnPage from '../../pages/CreateVvnPage';
import * as useVvnFormControllerModule from '../../controllers/vvn/useVvnFormController';

// Mock the controller hook
vi.mock('../../controllers/vvn/useVvnFormController');

// Mock lucide-react icons to avoid issues during rendering
vi.mock('lucide-react', () => ({
    Ship: () => <div data-testid="icon-ship" />,
    Package: () => <div data-testid="icon-package" />,
    Users: () => <div data-testid="icon-users" />,
    Plus: () => <div data-testid="icon-plus" />,
    Trash2: () => <div data-testid="icon-trash" />,
    ArrowLeft: () => <div data-testid="icon-arrow-left" />,
}));

describe('CreateVvnPage', () => {
    const mockNavigate = vi.fn();
    const mockHandleSubmit = vi.fn((e) => e.preventDefault());
    const mockHandleChange = vi.fn();
    const mockHandleCargoChange = vi.fn();
    const mockHandleContainerChange = vi.fn();
    const mockAddContainer = vi.fn();
    const mockRemoveContainer = vi.fn();
    const mockHandleCrewChange = vi.fn();
    const mockAddCrewMember = vi.fn();
    const mockRemoveCrewMember = vi.fn();
    const mockSetStep = vi.fn();

    const defaultFormData = {
        vesselImo: '',
        estimatedArrival: '',
        estimatedDeparture: '',
        cargo: {
            description: '',
            weight: 0,
            containers: [],
        },
        crewMembers: [],
    };

    const setupControllerMock = (overrides = {}) => {
        const defaultValues = {
            step: 1,
            setStep: mockSetStep,
            formData: defaultFormData,
            isEditMode: false,
            isLoading: false,
            isSubmitting: false,
            error: null,
            navigate: mockNavigate,
            handleSubmit: mockHandleSubmit,
            handleChange: mockHandleChange,
            handleCargoChange: mockHandleCargoChange,
            handleContainerChange: mockHandleContainerChange,
            addContainer: mockAddContainer,
            removeContainer: mockRemoveContainer,
            handleCrewChange: mockHandleCrewChange,
            addCrewMember: mockAddCrewMember,
            removeCrewMember: mockRemoveCrewMember,
            ...overrides,
        };
        
        // @ts-ignore
        useVvnFormControllerModule.useVvnFormController.mockReturnValue(defaultValues);
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state correctly', () => {
        setupControllerMock({ isLoading: true });
        render(<CreateVvnPage />);
        expect(screen.getByText('Loading notification data...')).toBeInTheDocument();
    });

    it('renders step 1 (Visit Details) correctly', () => {
        setupControllerMock({ step: 1 });
        render(<CreateVvnPage />);
        
        expect(screen.getByText('Create New Vessel Visit Notification')).toBeInTheDocument();
        expect(screen.getByLabelText(/Vessel IMO/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Estimated Arrival/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Estimated Departure/i)).toBeInTheDocument();
        expect(screen.queryByText('Back')).not.toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders step 2 (Cargo) correctly', () => {
        setupControllerMock({ step: 2 });
        render(<CreateVvnPage />);
        
        expect(screen.getByLabelText(/Cargo Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Cargo Weight/i)).toBeInTheDocument();
        expect(screen.getByText('Containers')).toBeInTheDocument();
        expect(screen.getByText('Add Container')).toBeInTheDocument();
        expect(screen.getByText('Back')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders step 3 (Crew) correctly', () => {
        setupControllerMock({ step: 3 });
        render(<CreateVvnPage />);
        
        expect(screen.getByText('Crew Members')).toBeInTheDocument();
        expect(screen.getByText('Add Crew Member')).toBeInTheDocument();
        expect(screen.getByText('Back')).toBeInTheDocument();
        expect(screen.getByText('Create Notification')).toBeInTheDocument();
    });

    it('navigates to next step when Next button is clicked', () => {
        setupControllerMock({ step: 1 });
        render(<CreateVvnPage />);
        
        fireEvent.click(screen.getByText('Next'));
        expect(mockSetStep).toHaveBeenCalled();
    });

    it('navigates to previous step when Back button is clicked', () => {
        setupControllerMock({ step: 2 });
        render(<CreateVvnPage />);
        
        fireEvent.click(screen.getByText('Back'));
        expect(mockSetStep).toHaveBeenCalled();
    });

    it('calls handleSubmit when form is submitted on last step', () => {
        setupControllerMock({ step: 3 });
        render(<CreateVvnPage />);
        
        fireEvent.click(screen.getByText('Create Notification'));
        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('displays error message when error is present', () => {
        setupControllerMock({ error: 'Something went wrong' });
        render(<CreateVvnPage />);
        
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders edit mode title correctly', () => {
        setupControllerMock({ isEditMode: true, step: 3 });
        render(<CreateVvnPage />);
        
        expect(screen.getByText('Edit Vessel Visit Notification')).toBeInTheDocument();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('calls addContainer when Add Container button is clicked', () => {
        setupControllerMock({ step: 2 });
        render(<CreateVvnPage />);
        
        fireEvent.click(screen.getByText('Add Container'));
        expect(mockAddContainer).toHaveBeenCalled();
    });

    it('calls addCrewMember when Add Crew Member button is clicked', () => {
        setupControllerMock({ step: 3 });
        render(<CreateVvnPage />);
        
        fireEvent.click(screen.getByText('Add Crew Member'));
        expect(mockAddCrewMember).toHaveBeenCalled();
    });

    it('renders containers list correctly', () => {
        const containers = [
            { containerCode: 'C1', position: 'P1' },
            { containerCode: 'C2', position: 'P2' }
        ];
        setupControllerMock({ 
            step: 2, 
            formData: { ...defaultFormData, cargo: { ...defaultFormData.cargo, containers } } 
        });
        render(<CreateVvnPage />);
        
        expect(screen.getByDisplayValue('C1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('C2')).toBeInTheDocument();
        expect(screen.getAllByTestId('icon-trash')).toHaveLength(2);
    });

    it('renders crew members list correctly', () => {
        const crewMembers = [
            { name: 'John', nationality: 'US', isSafetyOfficer: true },
            { name: 'Jane', nationality: 'UK', isSafetyOfficer: false }
        ];
        setupControllerMock({ 
            step: 3, 
            formData: { ...defaultFormData, crewMembers } 
        });
        render(<CreateVvnPage />);
        
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
        expect(screen.getAllByTestId('icon-trash')).toHaveLength(2);
    });
});
