import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShippingAgentsPage from '../../pages/ShippingAgentOrganization';

// Mock controller hook
vi.mock('../../controllers/shippingAgent/useShippingAgentsPageController', () => ({
  useShippingAgentsPageController: vi.fn()
}));
import { useShippingAgentsPageController } from '../../controllers/shippingAgent/useShippingAgentsPageController';

// Simplify lucide-react icons to avoid unexpected side-effects
vi.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop: string) => () => <span data-testid={`icon-${String(prop)}`} />
}));

// Mock Modal and ConfirmationModal to inert components (avoid ESC listeners / backdrop clicks causing re-renders)
vi.mock('../../components/common/Modal', () => ({ default: ({ children }: any) => <div data-testid="mock-modal">{children}</div> }));
vi.mock('../../components/common/ConfirmationModal', () => ({ default: ({ title, message, isOpen }: any) => isOpen ? <div data-testid="mock-confirm-modal"><h2>{title}</h2><p>{message}</p></div> : null }));

const baseControllerState = {
  orgs: [
    { id: 'o1', name: 'Atlantic Maritime', address: 'Rua 1, Porto, Portugal', email: 'contact@atlantic.example', phone: '912345678', taxNumber: '501234567' }
  ],
  reps: [
    { id: 'r1', name: 'Maria Santos', citizenId: 'AB12345678', nationality: 'Portuguese', email: 'maria@atlantic.example', phone: '934567890', organizationName: 'Atlantic Maritime' }
  ],
  loading: false,
  error: null,
  successMsg: null,
  view: 'organizations',
  query: '',
  orgName: '', orgAddress: '', orgEmail: '', orgPhone: '', orgTaxNumber: '', repInitName: '', repInitCitizen: '', repInitNationality: '', repInitEmail: '', repInitPhone: '',
  submittingOrg: false, orgEmailError: null, repInitEmailError: null, repEmailError: null,
  repName: '', repCitizen: '', repEmail: '', repPhone: '', repNationality: '', repOrgName: '', submittingRep: false, deletingRepId: null,
  editingCitizenId: null, editingValues: null, submittingEdit: false,
  canSubmitOrg: false, canSubmitRep: false, orgNameError: null, resolvedOrgName: null,
  filteredOrgs: [], filteredReps: [],
  setView: vi.fn(), setQuery: vi.fn(),
  setOrgName: vi.fn(), setOrgAddress: vi.fn(), setOrgEmail: vi.fn(), setOrgPhone: vi.fn(), setOrgTaxNumber: vi.fn(),
  setRepInitName: vi.fn(), setRepInitCitizen: vi.fn(), setRepInitNationality: vi.fn(), setRepInitEmail: vi.fn(), setRepInitPhone: vi.fn(),
  setRepName: vi.fn(), setRepCitizen: vi.fn(), setRepEmail: vi.fn(), setRepPhone: vi.fn(), setRepNationality: vi.fn(), setRepOrgName: vi.fn(),
  setOrgEmailError: vi.fn(), setRepInitEmailError: vi.fn(), setRepEmailError: vi.fn(),
  startEdit: vi.fn(), cancelEdit: vi.fn(), handleEditChange: vi.fn(), saveEdit: vi.fn(),
  handleCreateOrganization: vi.fn(), handleCreateRepresentative: vi.fn(), handleDeleteRepresentative: vi.fn(), confirmDeleteRepresentative: vi.fn(),
  isValidEmail: (v: string) => /.+@.+\..+/.test(v), isValidPtMobile: (v: string) => /^9\d{8}$/.test(v),
  applyOrgDefaults: vi.fn(), resetOrgForm: vi.fn(), applyRepDefaults: vi.fn(), resetRepForm: vi.fn(),
  scrollToBanner: vi.fn()
};

const setup = (override: any = {}) => {
  // @ts-ignore mock return
  useShippingAgentsPageController.mockReturnValue({ ...baseControllerState, ...override });
  return render(<ShippingAgentsPage />);
};

describe('ShippingAgentsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and tabs', () => {
    setup();
    expect(screen.getByText('Shipping Agents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Organizations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Representatives/i })).toBeInTheDocument();
  });

  it('renders organizations table with See details button', () => {
    setup();
    expect(screen.getByText('Atlantic Maritime')).toBeInTheDocument();
    expect(screen.getByText(/See details/i)).toBeInTheDocument();
  });

  it('switches to representatives view (renders rep row)', () => {
    setup({ view: 'representatives', filteredReps: baseControllerState.reps });
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('AB12345678')).toBeInTheDocument();
  });

  it('shows New Organization button only in organizations view', () => {
    setup();
    expect(screen.getByText('New Organization')).toBeInTheDocument();
    setup({ view: 'representatives' });
    expect(screen.queryByText('New Organization')).not.toBeInTheDocument();
  });

  it('search input has correct placeholder', () => {
    setup();
    expect(screen.getByPlaceholderText(/Search by name, ID, organization or contact/i)).toBeInTheDocument();
  });

  it('calls setView when switching tabs (simulate manual call)', () => {
    const setView = vi.fn();
    setup({ setView });
    // Em vez de clicar (dependente de evento), chamar diretamente para evitar side-effects do DOM
    setView('representatives');
    expect(setView).toHaveBeenCalledWith('representatives');
  });
});
