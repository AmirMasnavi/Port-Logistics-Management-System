import React from 'react';
import { useShippingAgentsPageController } from '../controllers/shippingAgent/useShippingAgentsPageController';
import { Search, Edit2, Trash2, Home, Mail, Phone, HelpCircle, Users } from 'lucide-react';
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Shipping Agents</h1>
        <p className="text-gray-700 mt-1">Manage organizations and their representatives</p>
      </div>

      {/* Controls: view toggles + search - moved up to be right after the header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { setView('organizations'); setCreateMode('none'); }} className={`px-4 py-2 rounded-lg ${view === 'organizations' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-blue-50'}`}>Organizations</button>
          <button onClick={() => { setView('representatives'); setCreateMode('none'); }} className={`px-4 py-2 rounded-lg ${view === 'representatives' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700 hover:bg-blue-50'}`}>Representatives</button>
          {view === 'organizations' && (
            <button onClick={() => { setCreateMode('organization'); }} className="px-3 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100">New Organization</button>
          )}
          {view === 'representatives' && (
            <button onClick={() => { setCreateMode('representative'); }} className="px-3 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100">New Representative</button>
          )}
        </div>

        <div className="relative w-1/3 min-w-[220px] flex items-center gap-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="w-5 h-5 text-gray-400" aria-hidden /></div>
          <input id="globalSearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={'Search by name, citizen ID, organization, email or phone…'} aria-label="Search list" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base" />
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded border border-red-200 text-red-700 bg-red-50">{error}</div>}
      {successMsg && <div className="mb-4 p-3 rounded border border-green-200 text-green-700 bg-green-50">{successMsg}</div>}

      {/* Summary boxes - always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Organizations</div>
            <div className="text-2xl font-semibold text-gray-900">{orgs?.length ?? 0}</div>
            <div className="text-sm text-gray-500">Total registered</div>
          </div>
          <Home className="w-8 h-8 text-blue-600" aria-hidden />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Representatives</div>
            <div className="text-2xl font-semibold text-gray-900">{avgRepsPerOrg.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Average reps per organization</div>
          </div>
          <Users className="w-8 h-8 text-green-600" aria-hidden />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Total representatives</div>
            <div className="text-2xl font-semibold text-gray-900">{totalReps}</div>
            <div className="text-sm text-gray-500">Registered representatives</div>
          </div>
          <Users className="w-8 h-8 text-gray-500" aria-hidden />
        </div>
      </div>

      {/* Forms: only rendered when user selected New (createMode) */}
      {createMode === 'organization' && (
        <div className="mb-6">
          <form onSubmit={async (e) => { e.preventDefault(); await handleCreateOrganization(e); setCreateMode('none'); }} className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Organization + Initial Representative</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={applyOrgDefaults} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Use defaults</button>
                  <button type="button" onClick={resetOrgForm} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label htmlFor="orgNameInput" className="sr-only">Organization name</label>
                <input id="orgNameInput" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                <label htmlFor="orgAddressInput" className="sr-only">Address</label>
                <input id="orgAddressInput" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} placeholder="Address" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <label htmlFor="orgEmailInput" className="sr-only">Organization email</label>
                <input id="orgEmailInput" value={orgEmail} onChange={(e) => { setOrgEmail(e.target.value); setOrgEmailError(null); }} onBlur={() => { if (orgEmail && !isValidEmail(orgEmail)) setOrgEmailError('Organization email appears invalid.'); }} placeholder="Email *" type="email" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {orgEmailError && <p className="text-xs text-red-500 mt-1">{orgEmailError}</p>}

                <label htmlFor="orgPhoneInput" className="sr-only">Organization phone</label>
                <input id="orgPhoneInput" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} placeholder="Phone *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                <label htmlFor="orgTaxInput" className="sr-only">Tax number</label>
                <input id="orgTaxInput" value={orgTaxNumber} onChange={(e) => setOrgTaxNumber(e.target.value)} placeholder="Tax number (NIF/VAT) *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2" required />
              </div>

              <h3 className="text-md font-medium mt-2">Initial Representative (required)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label htmlFor="repInitNameInput" className="sr-only">Representative name</label>
                <input id="repInitNameInput" value={repInitName} onChange={(e) => setRepInitName(e.target.value)} placeholder="Representative name *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                <label htmlFor="repInitCitizenInput" className="sr-only">Citizen ID</label>
                <input id="repInitCitizenInput" value={repInitCitizen} onChange={(e) => setRepInitCitizen(e.target.value)} placeholder="Citizen ID *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                <label htmlFor="repInitNationalityInput" className="sr-only">Nationality</label>
                <input id="repInitNationalityInput" value={repInitNationality} onChange={(e) => setRepInitNationality(e.target.value)} placeholder="Nationality *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                <label htmlFor="repInitEmailInput" className="sr-only">Representative email</label>
                <input id="repInitEmailInput" value={repInitEmail} onChange={(e) => { setRepInitEmail(e.target.value); setRepInitEmailError(null); }} onBlur={() => { if (repInitEmail && !isValidEmail(repInitEmail)) setRepInitEmailError('Initial representative email appears invalid.'); }} placeholder="Rep Email *" type="email" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {repInitEmailError && <p className="text-xs text-red-500 mt-1">{repInitEmailError}</p>}

                <label htmlFor="repInitPhoneInput" className="sr-only">Representative phone</label>
                <input id="repInitPhoneInput" value={repInitPhone} onChange={(e) => setRepInitPhone(e.target.value)} placeholder="Rep Phone *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
        <form onSubmit={async (e) => { e.preventDefault(); await handleCreateRepresentative(e); setCreateMode('none'); }} className="mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Create Representative (link by Organization Name)</h2>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={applyRepDefaults} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200" title="Pre-fill fields with typical test data">Use defaults</button>
                <button type="button" onClick={resetRepForm} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Clear</button>
                <span className="text-gray-400 ml-1"><HelpCircle className="w-4 h-4" aria-hidden /></span>
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

      {/* Tables */}
      <div className={`overflow-x-auto ${view === 'representatives' ? 'bg-white rounded-xl shadow-md border border-gray-200 p-4' : ''}`}>
        <div className={`${view === 'representatives' ? 'max-h-[50vh] overflow-y-auto' : ''}`}>
          <table className="min-w-full divide-y divide-gray-200">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr><td colSpan={view === 'organizations' ? 5 : 6} className="text-center py-4">Loading...</td></tr>
              )}

              {!loading && view === 'organizations' && (
                displayedOrgs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12">No organizations found</td></tr>
                ) : (
                  displayedOrgs.map((org: any) => (
                    <tr key={org.id || org.name} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{org.address ?? '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{org.taxNumber ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex flex-col">
                          {org.phone && (<a href={`tel:${org.phone}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline"><Phone className="w-4 h-4" aria-hidden /><span className="text-gray-800">{org.phone}</span></a>)}
                          {org.email && (<a href={`mailto:${org.email}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline break-all"><Mail className="w-4 h-4" aria-hidden /><span className="text-gray-800 break-all">{org.email}</span></a>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openOrgModal(org)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"><Search className="w-4 h-4" aria-hidden /><span className="text-sm font-medium">See details</span></button>
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
                    <tr key={rep.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rep.citizenId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rep.organizationName ?? rep.organizationId ?? '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rep.nationality ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 align-top">
                        {(rep.phone || rep.email) ? (
                          <div className="flex flex-col text-sm">
                            {rep.phone && (<a href={`tel:${rep.phone}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline"><Phone className="w-4 h-4" aria-hidden /><span className="text-gray-800">{rep.phone}</span></a>)}
                            {rep.email && (<a href={`mailto:${rep.email}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline break-all"><Mail className="w-4 h-4" aria-hidden /><span className="text-gray-800 break-all">{rep.email}</span></a>)}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(rep)} title={`Edit ${rep.name}`} className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" aria-hidden /><span className="sr-only">Edit {rep.name}</span></button>
                          <button onClick={() => confirmDelete(rep.citizenId)} disabled={deletingRepId !== null && deletingRepId !== rep.citizenId} title={`Delete ${rep.name}`} className="p-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">{deletingRepId === rep.citizenId ? (<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>) : (<Trash2 className="w-4 h-4" aria-hidden />)}<span className="sr-only">Delete {rep.name}</span></button>
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

      {/* Edit Representative Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Representative">
        {editingValues ? (
          <form onSubmit={(e) => { e.preventDefault(); if (editingCitizenId) saveEdit(editingCitizenId); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label htmlFor="editNameInput" className="sr-only">Representative name</label>
              <input id="editNameInput" value={editingValues.name} onChange={(e) => handleEditChange('name', e.target.value)} placeholder="Representative name *" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <label htmlFor="editOrgInput" className="sr-only">Organization</label>
              <input id="editOrgInput" value={editingValues.organizationName} onChange={(e) => handleEditChange('organizationName', e.target.value)} list="org-names-edit" placeholder="Organization — search existing organization…" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <datalist id="org-names-edit">{orgs.map((o: any) => (<option key={o.id || o.name} value={o.name} />))}</datalist>
              <label htmlFor="editNationalityInput" className="sr-only">Nationality</label>
              <input id="editNationalityInput" value={editingValues.nationality} onChange={(e) => handleEditChange('nationality', e.target.value)} placeholder="Nationality" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <label htmlFor="editEmailInput" className="sr-only">Email</label>
              <input id="editEmailInput" value={editingValues.email} onChange={(e) => handleEditChange('email', e.target.value)} placeholder="Email" type="email" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label htmlFor="editPhoneInput" className="sr-only">Phone</label>
              <input id="editPhoneInput" value={editingValues.phone} onChange={(e) => handleEditChange('phone', e.target.value)} placeholder="Phone" className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEditModal} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={submittingEdit} className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{submittingEdit ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Saving…</>) : 'Save changes'}</button>
            </div>
          </form>
        ) : (<div>No data to edit</div>)}
      </Modal>

      {/* Organization details modal */}
      <Modal isOpen={isOrgModalOpen} onClose={closeOrgModal} title="Organization details" showFooter={false}>
        {selectedOrg ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center"><Home className="w-5 h-5 text-blue-600" aria-hidden /></div>
              <div>
                <div className="font-semibold text-gray-800">{selectedOrg.name}</div>
                <div className="text-sm text-gray-700">{selectedOrg.address}</div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-700">Tax Number</div>
                  <div className="font-medium text-gray-800">{selectedOrg.taxNumber ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-700">Contact</div>
                  <div className="font-medium text-blue-600">{selectedOrg.phone ? (<a href={`tel:${selectedOrg.phone}`} className="hover:underline">{selectedOrg.phone}</a>) : '-'}{selectedOrg.email ? (<><span className="mx-2">•</span><a href={`mailto:${selectedOrg.email}`} className="hover:underline">{selectedOrg.email}</a></>) : null}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-700">Full Address</div>
                  <div className="font-medium text-gray-800">{selectedOrg.address ?? '-'}</div>
                </div>
              </div>
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

