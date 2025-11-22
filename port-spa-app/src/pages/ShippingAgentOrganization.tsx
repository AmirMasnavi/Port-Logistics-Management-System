import React from 'react';
import { useShippingAgentsPageController } from '../controllers/shippingAgent/useShippingAgentsPageController';
import { Search, Edit, Trash, Home, Mail, Phone, HelpCircle, UserCheck, UserPlus } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';

const ShippingAgentsPage: React.FC = () => {
  const {
    orgs, loading, error, successMsg, view, query,
    orgName, orgAddress, orgEmail, orgPhone, orgTaxNumber,
    repInitName, repInitCitizen, repInitNationality, repInitEmail, repInitPhone,
    submittingOrg, orgEmailError, repInitEmailError,
    repName, repCitizen, repEmail, repPhone, repNationality, repOrgName,
    submittingRep, deletingRepId,
    // add missing controller values used by this page
    repEmailError, editingCitizenId, editingValues, submittingEdit,
    canSubmitOrg, canSubmitRep, orgNameError,
    filteredOrgs, filteredReps,
    setView, setQuery,
    setOrgName, setOrgAddress, setOrgEmail, setOrgPhone, setOrgTaxNumber,
    setRepInitName, setRepInitCitizen, setRepInitNationality, setRepInitEmail, setRepInitPhone,
    setRepName, setRepCitizen, setRepEmail, setRepPhone, setRepNationality, setRepOrgName,
    setOrgEmailError, setRepInitEmailError, setRepEmailError,
    startEdit, cancelEdit, handleEditChange, saveEdit,
    handleCreateOrganization, handleCreateRepresentative,
    confirmDeleteRepresentative,
    isValidEmail,
    applyOrgDefaults, resetOrgForm, applyRepDefaults, resetRepForm
  } = useShippingAgentsPageController();

  // Local UI state
  const [isOrgListOpen, setIsOrgListOpen] = React.useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);
  const [pendingDeleteCitizenId, setPendingDeleteCitizenId] = React.useState<string | null>(null);
  // creation mode: none | organization | representative
  const [createMode, setCreateMode] = React.useState<'none' | 'organization' | 'representative'>('none');

  // refs for create forms so we can focus/scroll when submission fails
  const orgFormRef = React.useRef<HTMLFormElement | null>(null);
  const repFormRef = React.useRef<HTMLFormElement | null>(null);

  // helper to scroll to the top message area (error/success banner). Accounts for fixed header by offsetting a little.
  const scrollToBanner = () => {
    const el = document.getElementById('pageMessage');
    if (el) {
      const headerOffset = 72; // conservative header height (adjustable)
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset);
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // helper to close the organizations list modal (open is triggered by UI elements elsewhere)
  const closeOrgList = () => setIsOrgListOpen(false);

  // inline validation state for representative form
  const [repCitizenErrorLocal, setRepCitizenErrorLocal] = React.useState<string | null>(null);
  const [repPhoneErrorLocal, setRepPhoneErrorLocal] = React.useState<string | null>(null);
  const [repNationalityErrorLocal, setRepNationalityErrorLocal] = React.useState<string | null>(null);

  const openOrgModal = (org: any) => { setSelectedOrg(org); setIsOrgModalOpen(true); };
  const closeOrgModal = () => { setSelectedOrg(null); setIsOrgModalOpen(false); };

  const openEditModal = (rep: any) => { startEdit(rep); setIsEditModalOpen(true); };
  const closeEditModal = () => { cancelEdit(); setIsEditModalOpen(false); };

  // If the controller clears editingValues (e.g., after a successful save), close the edit modal
  React.useEffect(() => {
    if (isEditModalOpen && !editingValues) {
      // delay a tick so any success message can be handled by the controller first
      const t = setTimeout(() => setIsEditModalOpen(false), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [editingValues, isEditModalOpen]);

  const confirmDelete = (citizenId: string) => { setPendingDeleteCitizenId(citizenId); setIsConfirmDeleteOpen(true); };
  const onConfirmDelete = async () => {
    if (pendingDeleteCitizenId) await confirmDeleteRepresentative(pendingDeleteCitizenId);
    setPendingDeleteCitizenId(null);
    setIsConfirmDeleteOpen(false);
  };

  const validateCitizenId = (v: string) => {
    if (!v) { setRepCitizenErrorLocal('Citizen ID is required'); return false; }
    const cidRegex = /^[A-Z]{2}\d{8}$/i;
    if (!cidRegex.test(v)) { setRepCitizenErrorLocal('Expected: AB12345600'); return false; }
    setRepCitizenErrorLocal(null); return true;
  };
  const validatePhone = (v: string) => {
    if (!v) { setRepPhoneErrorLocal(null); return true; }
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(v)) { setRepPhoneErrorLocal('Phone must start with 9 and have 9 digits'); return false; }
    setRepPhoneErrorLocal(null); return true;
  };
  const validateNationality = (v: string) => {
    if (!v) { setRepNationalityErrorLocal(null); return true; }
    const natRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
    if (!natRegex.test(v)) { setRepNationalityErrorLocal('Nationality must contain only letters'); return false; }
    setRepNationalityErrorLocal(null); return true;
  };

  // derive displayed lists (use controller filtered results - original behaviour)
  const displayedReps = React.useMemo(() => filteredReps || [], [filteredReps]);
  const displayedOrgs = React.useMemo(() => filteredOrgs || [], [filteredOrgs]);

  // helper to compute initials for an organization name (used as avatar)
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // average representatives per organization (use displayed lists so it respects filtering)
  const avgRepsPerOrg = React.useMemo(() => {
    const orgCount = (displayedOrgs?.length ?? 0) || (orgs?.length ?? 0);
    const repCount = (displayedReps?.length ?? 0);
    return orgCount > 0 ? repCount / orgCount : 0;
  }, [displayedReps, displayedOrgs, orgs]);

  // total representatives (based on displayed/filtered list)
  const totalReps = displayedReps.length ?? 0;

  return (
    <div className="container mx-auto">
      <div className="mb-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shipping Agents</h1>
            <p className="text-slate-500 mt-2">Manage organizations and their representatives</p>
          </div>
          {/* Removed PT language pill per request - header tightened so controls sit closer */}
        </div>
      </div>

      {/* Controls: view toggles + search - moved up to be right after the header */}
      <div className="flex justify-between items-center mb-8">
        {/* Tab bar: more visible active tab, dimmer inactive tabs */}
        <nav className="flex items-end gap-3" aria-label="Sections">
          <button onClick={() => { setView('organizations'); /* keep create form state intact when switching tabs */ }}
            className={`px-4 py-2 rounded-t-md transition-all ${view === 'organizations' ? 'text-blue-800 font-semibold border-b-4 border-blue-600 pb-1' : 'text-gray-400 hover:text-gray-600'}`}>
            Organizations
          </button>
          <button onClick={() => { setView('representatives'); /* keep create form state intact when switching tabs */ }}
            className={`px-4 py-2 rounded-t-md transition-all ${view === 'representatives' ? 'text-blue-800 font-semibold border-b-4 border-blue-600 pb-1' : 'text-gray-400 hover:text-gray-600'}`}>
            Representatives
          </button>
        </nav>

         <div className="relative w-1/3 min-w-[240px] flex items-center gap-2">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="w-5 h-5 text-gray-400" aria-hidden /></div>
           <input id="globalSearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={'Search by name, ID, organization or contact'} aria-label="Search list" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg shadow-sm" />
         </div>
       </div>
 
       <div id="pageMessage">
         {error && <div className="mb-4 p-3 rounded border border-red-200 text-red-700 bg-red-50">{error}</div>}
         {successMsg && <div className="mb-4 p-3 rounded border border-green-200 text-green-700 bg-green-50">{successMsg}</div>}
       </div>
 
       {/* Summary boxes - match StatCard styling from VesselTypesPage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-8 rounded-[14px] shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Organizations</div>
              <div className="text-3xl font-semibold mt-2" style={{ color: '#2596be' }}>{orgs?.length ?? 0}</div>
              <p className="text-xs text-gray-400 mt-1">Total registered</p>
            </div>
            <Home className="w-10 h-10 text-blue-700" aria-hidden />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[14px] shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Representatives</div>
              <div className="text-3xl font-semibold mt-2" style={{ color: '#2596be' }}>{avgRepsPerOrg.toFixed(1)}</div>
              <p className="text-xs text-gray-400 mt-1">Average reps per organization</p>
            </div>
            <UserCheck className="w-10 h-10 text-green-700" aria-hidden />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[14px] shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Total representatives</div>
              <div className="text-3xl font-semibold mt-2" style={{ color: '#2596be' }}>{totalReps}</div>
              <p className="text-xs text-gray-400 mt-1">Registered representatives</p>
            </div>
            <UserPlus className="w-10 h-10 text-gray-600" aria-hidden />
          </div>
        </div>
      </div>
 
      {/* Forms: only rendered when user selected New (createMode) */}
      {createMode === 'organization' && (
        <div className="mb-6">
          <form ref={orgFormRef} onSubmit={async (e) => {
            e.preventDefault();
            const ok = await handleCreateOrganization(e);
            // Ensure the message banner is visible (handles fixed header)
            scrollToBanner();
            if (ok) {
              setCreateMode('none');
            } else {
              // keep form open; wait a tick so banner renders, then focus first input WITHOUT scrolling
              setTimeout(() => {
                const first = orgFormRef.current?.querySelector('input,select,textarea,button') as HTMLElement | null;
                try { first?.focus?.({ preventScroll: true } as FocusOptions); } catch { /* don't fallback to focus() to avoid scrolling */ }
              }, 120);
            }
          }} className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Organization + Initial Representative</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={applyOrgDefaults} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Use defaults</button>
                  <button type="button" onClick={resetOrgForm} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Clear</button>
                  {/* Tooltip for organization defaults (accessible) */}
                  <div className="ml-1">
                    <div className="relative inline-block group">
                      <button type="button" aria-describedby="org-defaults-tooltip" className="text-gray-400 focus:outline-none" tabIndex={0}>
                        <HelpCircle className="w-4 h-4" aria-hidden />
                        <span className="sr-only">Defaults information</span>
                      </button>
                      <div id="org-defaults-tooltip" role="tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus:block w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 z-50">
                        Pre-fill organization and initial representative fields with typical test data (e.g. sample org name, tax number, representative name, citizen ID AB12345600, email and phone). Use for faster testing.
                      </div>
                    </div>
                  </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <label htmlFor="orgNameInput" className="sr-only">Organization name</label>
                 <input id="orgNameInput" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name — e.g. Atlantic Maritime Logistics" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                 <label htmlFor="orgAddressInput" className="sr-only">Address</label>
                 <input id="orgAddressInput" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} placeholder="Address — e.g. Rua do Porto 123, Porto, Portugal" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                 <label htmlFor="orgEmailInput" className="sr-only">Organization email</label>
                 <input id="orgEmailInput" value={orgEmail} onChange={(e) => { setOrgEmail(e.target.value); setOrgEmailError(null); }} onBlur={() => { if (orgEmail && !isValidEmail(orgEmail)) setOrgEmailError('Organization email appears invalid.'); }} placeholder="Email — e.g. contact@company.example" type="email" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                 {orgEmailError && <p className="text-xs text-red-500 mt-1">{orgEmailError}</p>}

                 <label htmlFor="orgPhoneInput" className="sr-only">Organization phone</label>
                 <input id="orgPhoneInput" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} placeholder="Phone — e.g. 912345678" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                 <label htmlFor="orgTaxInput" className="sr-only">Tax number</label>
                 <input id="orgTaxInput" value={orgTaxNumber} onChange={(e) => setOrgTaxNumber(e.target.value)} placeholder="Tax number (NIF/VAT) — e.g. 501234567" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2" required />
               </div>

               <h3 className="text-md font-medium mt-2">Initial Representative (required)</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <label htmlFor="repInitNameInput" className="sr-only">Representative name</label>
                 <input id="repInitNameInput" value={repInitName} onChange={(e) => setRepInitName(e.target.value)} placeholder="Representative name — e.g. John Doe" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                 <label htmlFor="repInitCitizenInput" className="sr-only">Citizen ID</label>
                 <input id="repInitCitizenInput" value={repInitCitizen} onChange={(e) => setRepInitCitizen(e.target.value)} placeholder="Citizen ID — e.g. AB12345600" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                 <label htmlFor="repInitNationalityInput" className="sr-only">Nationality</label>
                 <input id="repInitNationalityInput" value={repInitNationality} onChange={(e) => setRepInitNationality(e.target.value)} placeholder="Nationality — e.g. Portuguese" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                 <label htmlFor="repInitEmailInput" className="sr-only">Representative email</label>
                 <input id="repInitEmailInput" value={repInitEmail} onChange={(e) => { setRepInitEmail(e.target.value); setRepInitEmailError(null); }} onBlur={() => { if (repInitEmail && !isValidEmail(repInitEmail)) setRepInitEmailError('Initial representative email appears invalid.'); }} placeholder="Rep Email — e.g. name@example.com" type="email" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                 {repInitEmailError && <p className="text-xs text-red-500 mt-1">{repInitEmailError}</p>}

                 <label htmlFor="repInitPhoneInput" className="sr-only">Representative phone</label>
                 <input id="repInitPhoneInput" value={repInitPhone} onChange={(e) => setRepInitPhone(e.target.value)} placeholder="Rep Phone — e.g. 912345678" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
               </div>

               <p className="text-xs text-gray-700">Organization email and phone are required and will appear in the list; the initial representative also requires email and phone.</p>

               <div className="flex items-center gap-2">
                 <button disabled={!canSubmitOrg} className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50">{submittingOrg ? 'Creating…' : 'Create Organization'}</button>
                 <button type="button" onClick={() => { resetOrgForm(); setCreateMode('none'); }} className="px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
               </div>
             </div>
           </form>
         </div>
       )}

      {createMode === 'representative' && (
        <form ref={repFormRef} onSubmit={async (e) => {
          e.preventDefault();
          const ok = await handleCreateRepresentative(e);
          // Ensure the message banner is visible (handles fixed header)
          scrollToBanner();
          if (ok) {
            setCreateMode('none');
          } else {
            // keep form open; wait a tick so banner renders, then focus first input WITHOUT scrolling
            setTimeout(() => {
              const first = repFormRef.current?.querySelector('input,select,textarea,button') as HTMLElement | null;
              try { first?.focus?.({ preventScroll: true } as FocusOptions); } catch { /* skip fallback to avoid scrolling */ }
            }, 120);
          }
        }} className="mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Create Representative (link by Organization Name)</h2>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={applyRepDefaults} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200" title="Pre-fill fields with typical test data">Use defaults</button>
                <button type="button" onClick={resetRepForm} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Clear</button>
                {/* Tooltip: explain what 'Use defaults' does (visible on hover or focus) */}
                <div className="ml-1">
                  <div className="relative inline-block group">
                    <button type="button" aria-describedby="defaults-tooltip" className="text-gray-400 focus:outline-none" tabIndex={0}>
                      <HelpCircle className="w-4 h-4" aria-hidden />
                      <span className="sr-only">Defaults information</span>
                    </button>
                    <div id="defaults-tooltip" role="tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus:block w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 z-50">
                      Pre-fill fields with typical test data (e.g. sample name, citizen ID like AB12345600, email and phone). Use for faster testing.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="repOrgNameInput" className="sr-only">Organization</label>
              <input id="repOrgNameInput" list="org-names" value={repOrgName} onChange={(e) => setRepOrgName(e.target.value)} placeholder="Organization — search existing organization…" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <datalist id="org-names">{orgs.map((o: any) => (<option key={o.id || o.name} value={o.name} />))}</datalist>
              <p className="text-xs text-gray-700 mt-1">Select an existing organization.</p>
              {orgNameError && <p className="text-xs text-red-500 mt-1">{orgNameError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label htmlFor="repNameInput" className="sr-only">Representative name</label>
              <input id="repNameInput" value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Representative name *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

              <label htmlFor="repCitizenInput" className="sr-only">Citizen ID</label>
              <input id="repCitizenInput" value={repCitizen} onChange={(e) => { setRepCitizen(e.target.value); validateCitizenId(e.target.value); }} placeholder="Citizen ID — e.g. AB12345600" className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${repCitizenErrorLocal ? 'border-red-500' : 'border-gray-200'}`} required />
              {repCitizenErrorLocal && <p className="text-xs text-red-500 mt-1">{repCitizenErrorLocal}</p>}

              <label htmlFor="repNationalityInput" className="sr-only">Nationality</label>
              <input id="repNationalityInput" value={repNationality} onChange={(e) => { setRepNationality(e.target.value); validateNationality(e.target.value); }} placeholder="Nationality — e.g. Portuguese" className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${repNationalityErrorLocal ? 'border-red-500' : 'border-gray-200'}`} required />
              {repNationalityErrorLocal && <p className="text-xs text-red-500 mt-1">{repNationalityErrorLocal}</p>}

              <label htmlFor="repEmailInput" className="sr-only">Email</label>
              <input id="repEmailInput" value={repEmail} onChange={(e) => { setRepEmail(e.target.value); if (!e.target.value) setRepEmailError(null); else if (!isValidEmail(e.target.value)) setRepEmailError('Provided email appears invalid.'); else setRepEmailError(null); }} placeholder="Email — e.g. name@example.com" type="email" className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${repEmailError ? 'border-red-500' : 'border-gray-200'}`} />
              {repEmailError && <p className="text-xs text-red-500 mt-1">{repEmailError}</p>}

              <label htmlFor="repPhoneInput" className="sr-only">Phone</label>
              <input id="repPhoneInput" value={repPhone} onChange={(e) => { setRepPhone(e.target.value); validatePhone(e.target.value); }} placeholder="Phone — start with 9 and 9 digits" className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${repPhoneErrorLocal ? 'border-red-500' : 'border-gray-200'}`} />
              {repPhoneErrorLocal && <p className="text-xs text-red-500 mt-1">{repPhoneErrorLocal}</p>}
            </div>

            <div className="flex items-center gap-2">
              <button disabled={!canSubmitRep} className="inline-flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50">
                {submittingRep ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    Creating…
                  </>
                ) : 'Create Representative'}
              </button>
              <button type="button" onClick={() => { resetRepForm(); setCreateMode('none'); }} className="px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Use the same card + scroll behaviour for both organizations and representatives views */}
      <div className={`overflow-x-auto ${(view === 'representatives' || view === 'organizations') ? 'bg-white rounded-[14px] shadow-md border border-gray-200 p-6' : ''}`}>
        <div className={`${(view === 'representatives' || view === 'organizations') ? 'max-h-[50vh] overflow-y-auto' : ''}`}>
          <table className="min-w-full">
            <thead className="bg-blue-100 sticky top-0 z-10">
              {view === 'organizations' ? (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Tax Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Citizen ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Nationality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="bg-white">
               {loading && (
                <tr><td colSpan={view === 'organizations' ? 5 : 6} className="text-center py-6">Loading...</td></tr>
               )}
 
               {!loading && view === 'organizations' && (
                 displayedOrgs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12">No organizations found</td></tr>
                 ) : (
                   displayedOrgs.map((org: any) => (
                    <tr key={org.id || org.name} className="transition-colors border-b" style={{ borderColor: '#F2F2F5' }}>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold uppercase">{getInitials(org.name)}</div>
                          <div className="truncate max-w-[340px]">
                            <div className="text-sm font-medium text-gray-900 truncate">{org.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700 align-top">{org.address ?? '-'}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700 align-top">{org.taxNumber ?? '-'}</td>
                      <td className="px-6 py-5 text-sm text-gray-700 align-top">
                        <div className="flex flex-col gap-2">
                          {org.phone && (
                            <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline leading-normal">
                              <Phone className="w-4 h-4" aria-hidden />
                              <span className="text-gray-800">{org.phone}</span>
                            </a>
                          )}
                          {org.email && (
                            <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-blue-600 hover:underline leading-normal truncate" title={org.email}>
                              <Mail className="w-4 h-4" aria-hidden />
                              <span className="text-gray-800 truncate max-w-[260px]">{org.email}</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openOrgModal(org)} className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 hover:shadow-sm transition-all"><Search className="w-4 h-4" aria-hidden /><span className="text-sm font-medium">See details</span></button>
                        </div>
                      </td>
                     </tr>
                   ))
                 )
               )}
 
               {!loading && view === 'representatives' && (
                 displayedReps.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">No representatives found</td></tr>
                 ) : (
                   displayedReps.map((rep: any) => (
                    <tr key={rep.id} className="border-b" style={{ borderColor: '#F2F2F5' }}>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold uppercase">{getInitials(rep.name)}</div>
                          <div className="truncate max-w-[240px]">
                            <div className="text-sm font-medium text-gray-900 truncate">{rep.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700 align-top">{rep.citizenId}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700 align-top">{rep.organizationName ?? rep.organizationId ?? '-'}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700 align-top">{(rep.nationality || '-').toString().charAt(0).toUpperCase() + (rep.nationality || '').toString().slice(1)}</td>
                      <td className="px-6 py-5 text-sm text-gray-700 align-top">
                        {(rep.phone || rep.email) ? (
                          <div className="flex flex-col gap-2">
                            {rep.phone && (
                              <a href={`tel:${rep.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline leading-normal">
                                <Phone className="w-4 h-4" aria-hidden />
                                <span className="text-gray-800">{rep.phone}</span>
                              </a>
                            )}
                            {rep.email && (
                              <a href={`mailto:${rep.email}`} className="flex items-center gap-2 text-blue-600 hover:underline leading-normal truncate" title={rep.email}>
                                <Mail className="w-4 h-4" aria-hidden />
                                <span className="text-gray-800 truncate max-w-[240px]">{rep.email}</span>
                              </a>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(rep)} title={`Edit ${rep.name}`} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                            <Edit className="w-4 h-4" aria-hidden />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => confirmDelete(rep.citizenId)} disabled={deletingRepId !== null && deletingRepId !== rep.citizenId} title={`Delete ${rep.name}`} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                            {deletingRepId === rep.citizenId ? (
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                            ) : (
                              <Trash className="w-4 h-4" aria-hidden />
                            )}
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                   ))
                 )
               )}
             </tbody>
           </table>
         </div>
       </div>
 
      {/* Bottom action area: aligned with the table container and visually a footer */}
      {view === 'organizations' && (
        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
          <button onClick={() => { setCreateMode('organization'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">New Organization</button>
        </div>
      )}
 
      {view === 'representatives' && (
        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
          <button onClick={() => { setCreateMode('representative'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">New Representative</button>
        </div>
      )}
 
      {/* Edit Representative Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Representative" showFooter={false}>
        {editingValues ? (
          <form onSubmit={(e) => { e.preventDefault(); if (editingCitizenId) saveEdit(editingCitizenId); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editNameInput" className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input id="editNameInput" value={editingValues.name} onChange={(e) => handleEditChange('name', e.target.value)} placeholder="Representative name" className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label htmlFor="editOrgInput" className="block text-xs font-medium text-gray-500 mb-1">Organization</label>
                <input id="editOrgInput" value={editingValues.organizationName} onChange={(e) => handleEditChange('organizationName', e.target.value)} list="org-names-edit" placeholder="Organization — search existing organization…" className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <datalist id="org-names-edit">{orgs.map((o: any) => (<option key={o.id || o.name} value={o.name} />))}</datalist>
              </div>

              <div>
                <label htmlFor="editNationalityInput" className="block text-xs font-medium text-gray-500 mb-1">Nationality</label>
                <input id="editNationalityInput" value={editingValues.nationality} onChange={(e) => handleEditChange('nationality', e.target.value)} placeholder="Nationality" className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label htmlFor="editEmailInput" className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input id="editEmailInput" value={editingValues.email} onChange={(e) => handleEditChange('email', e.target.value)} placeholder="Email" type="email" className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label htmlFor="editPhoneInput" className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input id="editPhoneInput" value={editingValues.phone} onChange={(e) => handleEditChange('phone', e.target.value)} placeholder="Phone" className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Footer actions: aligned right, Cancel + Save; in mobile stacked full-width */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={closeEditModal} className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200">Cancel</button>
              <button type="submit" disabled={submittingEdit} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                {submittingEdit ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    Saving…
                  </>
                ) : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (<div>No data to edit</div>)}
      </Modal>

      {/* Organization details modal */}
      <Modal isOpen={isOrgModalOpen} onClose={closeOrgModal} title="Organization details" showFooter={false}>
        {selectedOrg ? (
          <div>
            {/* Header area inside modal body: larger logo circle and name/address */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Home className="w-6 h-6 text-blue-600" aria-hidden />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{selectedOrg.name}</div>
                <div className="text-sm text-gray-500 mt-1">{selectedOrg.address}</div>
              </div>
            </div>

            {/* Data blocks: Tax Number | Contact (two columns on md) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500">Tax Number</div>
                <div className="font-medium text-gray-800 mt-1">{selectedOrg.taxNumber ?? '-'}</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500">Contact</div>
                <div className="mt-2 space-y-2">
                  {selectedOrg.phone ? (
                    <a href={`tel:${selectedOrg.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                      <Phone className="w-4 h-4" aria-hidden />
                      <span className="text-gray-800">{selectedOrg.phone}</span>
                    </a>
                  ) : <div className="text-gray-500">-</div>}

                  {selectedOrg.email ? (
                    <a href={`mailto:${selectedOrg.email}`} className="flex items-center gap-2 text-blue-600 hover:underline break-words">
                      <Mail className="w-4 h-4" aria-hidden />
                      <span className="text-gray-800">{selectedOrg.email}</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Full address block full width */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-500">Full Address</div>
              <div className="font-medium text-gray-800 mt-1">{selectedOrg.address ?? '-'}</div>
            </div>
          </div>
        ) : (<div>No organization selected.</div>)}
      </Modal>

      {/* Organizations list modal */}
      <Modal isOpen={isOrgListOpen} onClose={closeOrgList} title="Organizations" footerLabel="Fechar">
        <div>
          <ul className="divide-y divide-gray-200">
            {orgs.map((o: any) => (
              <li key={o.id || o.name} className="py-3">
                <button onClick={() => { openOrgModal(o); }} className="w-full text-left text-gray-800 hover:text-blue-600">{o.name}</button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <ConfirmationModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm delete" onConfirm={onConfirmDelete} message="Are you sure you want to delete this representative? This action cannot be undone." />
    </div>
  );
};

export default ShippingAgentsPage;

