// Place mocks at the top so Vitest hoisting doesn't import real modules before mocks
vi.mock('lucide-react', () => ({
  Search: () => null,
  Edit: () => null,
  Trash: () => null,
  Home: () => null,
  Mail: () => null,
  Phone: () => null,
  HelpCircle: () => null,
  UserCheck: () => null,
  UserPlus: () => null,
}));

vi.mock('../../controllers/shippingAgent/useShippingAgentsPageController', () => ({
  useShippingAgentsPageController: vi.fn()
}));

// Update Modal mock to render children only when isOpen is true (so we can assert modal content)
vi.mock('../../components/common/Modal', () => ({ default: ({ children, isOpen }: any) => isOpen ? React.createElement('div', { 'data-testid': 'mock-modal' }, children) : null }));
vi.mock('../../components/common/ConfirmationModal', () => ({ default: (_props: any) => null }));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { useShippingAgentsPageController } from '../../controllers/shippingAgent/useShippingAgentsPageController';
import ShippingAgentsPage from '../../pages/ShippingAgentOrganization';

// Minimal but representative controller state used by tests
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
  // Ensure the mocked hook returns our desired controller state
  // @ts-ignore
  (useShippingAgentsPageController as any).mockReturnValue({ ...baseControllerState, ...override });
  return render(React.createElement(ShippingAgentsPage));
};

// Minor rewrite of some tests and add new ones

describe('ShippingAgentsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and tabs', () => {
    setup();
    expect(screen.getByText('Shipping Agents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Organizations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Representatives/i })).toBeInTheDocument();
  });

  it('renders organizations table with See details button', () => {
    setup({ filteredOrgs: baseControllerState.orgs });
    expect(screen.getByText('Atlantic Maritime')).toBeInTheDocument();
    expect(screen.getByText(/See details/i)).toBeInTheDocument();
  });

  it('switches to representatives view (renders rep row)', () => {
    setup({ view: 'representatives', filteredReps: baseControllerState.reps });
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('AB12345678')).toBeInTheDocument();
  });

  it('shows New Organization button only in organizations view', () => {
    const { unmount } = setup({ filteredOrgs: baseControllerState.orgs });
    expect(screen.getByText('New Organization')).toBeInTheDocument();
    unmount();
    setup({ view: 'representatives', filteredReps: baseControllerState.reps });
    expect(screen.queryByText('New Organization')).not.toBeInTheDocument();
  });

  it('search input has correct placeholder and calls setQuery on input', () => {
    const setQuery = vi.fn();
    setup({ setQuery });
    const input = screen.getByPlaceholderText(/Search by name, ID, organization or contact/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Atlantic' } });
    expect(setQuery).toHaveBeenCalledWith('Atlantic');
  });

  it('calls setView when switching tabs via click', () => {
    const setView = vi.fn();
    setup({ setView });
    const repsTab = screen.getByRole('button', { name: /Representatives/i });
    fireEvent.click(repsTab);
    // Component's onClick sets view via setView mock
    expect(setView).toHaveBeenCalledWith('representatives');
  });

  it('renders modal with organization details when See details is clicked', () => {
    setup({ filteredOrgs: baseControllerState.orgs });
    fireEvent.click(screen.getByText(/See details/i));
    const modal = screen.getByTestId('mock-modal');
    const m = within(modal);
    expect(m.getAllByText('Atlantic Maritime').length).toBeGreaterThan(0);
    // there are multiple address occurrences in the modal, assert at least one exists
    expect(m.getAllByText('Rua 1, Porto, Portugal').length).toBeGreaterThan(0);
    // check contact links inside modal
    expect(m.getByText('contact@atlantic.example').closest('a')).toHaveAttribute('href', 'mailto:contact@atlantic.example');
    expect(m.getByText('912345678').closest('a')).toHaveAttribute('href', 'tel:912345678');
  });

  it('renders modal with representative details when editing a representative', () => {
    setup({ view: 'representatives', filteredReps: baseControllerState.reps, editingValues: baseControllerState.reps[0], editingCitizenId: baseControllerState.reps[0].citizenId });
    // scope to the representative row and click its Edit button to open modal
    const repEl = screen.getByText('Maria Santos');
    const repRow = repEl.closest('tr') as HTMLElement | null;
    expect(repRow).toBeTruthy();
    const editBtn = within(repRow!).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const modal = screen.getByTestId('mock-modal');
    const m = within(modal);
    expect(m.getByLabelText(/Name/i)).toHaveValue('Maria Santos');
    expect(m.getByLabelText(/Email/i)).toHaveValue('maria@atlantic.example');
  });

  it('Save changes button is enabled by default and can be disabled via submittingEdit flag', () => {
    // enabled case
    const r1 = setup({ view: 'representatives', filteredReps: baseControllerState.reps, editingValues: baseControllerState.reps[0], editingCitizenId: baseControllerState.reps[0].citizenId, submittingEdit: false });
    const repEl = screen.getByText('Maria Santos');
    const repRow = repEl.closest('tr') as HTMLElement | null;
    const editBtn = within(repRow!).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);
    const modal = screen.getByTestId('mock-modal');
    // match either 'Save changes' or 'Saving…'
    expect(within(modal).getByRole('button', { name: /Save|Saving/i })).toBeEnabled();
    r1.unmount();

    // disabled case
    const r2 = setup({ view: 'representatives', filteredReps: baseControllerState.reps, editingValues: baseControllerState.reps[0], editingCitizenId: baseControllerState.reps[0].citizenId, submittingEdit: true });
    const repEl2 = screen.getByText('Maria Santos');
    const repRow2 = repEl2.closest('tr') as HTMLElement | null;
    const editBtn2 = within(repRow2!).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn2);
    const modal2 = screen.getByTestId('mock-modal');
    expect(within(modal2).getByRole('button', { name: /Save|Saving/i })).toBeDisabled();
    r2.unmount();
  });

  it('New Representative button visible only in representatives view', () => {
    const r1 = setup({ view: 'representatives', filteredReps: baseControllerState.reps });
    expect(screen.getByText('New Representative')).toBeInTheDocument();
    r1.unmount();

    const r2 = setup({ filteredOrgs: baseControllerState.orgs });
    expect(screen.queryByText('New Representative')).not.toBeInTheDocument();
    r2.unmount();
  });

  it('shows correct stats numbers based on provided lists', () => {
    // Use one org and one rep
    setup({ filteredOrgs: baseControllerState.orgs, filteredReps: baseControllerState.reps });
    // choose the non-button 'Organizations' label (there is also a tab button with the same text)
    const orgLabels = screen.getAllByText('Organizations');
    const orgLabel = orgLabels.find(el => el.closest('button') === null) as HTMLElement;
    const orgCard = orgLabel.parentElement?.parentElement as HTMLElement;
    expect(within(orgCard).getByText('1')).toBeInTheDocument();

    const repLabels = screen.getAllByText('Total representatives');
    const repLabel = repLabels.find(el => el.closest('button') === null) as HTMLElement;
    const repsCard = repLabel.parentElement?.parentElement as HTMLElement;
    expect(within(repsCard).getByText('1')).toBeInTheDocument();

    // average reps per org rendered as 1.0 in the Representatives card (find non-button label)
    const repsAvgLabels = screen.getAllByText('Representatives');
    const repsAvgLabel = repsAvgLabels.find(el => el.closest('button') === null) as HTMLElement;
    const avgCard = repsAvgLabel.parentElement?.parentElement as HTMLElement;
    expect(within(avgCard).getByText('1.0')).toBeInTheDocument();
  });

});
