import React from 'react';
import { useShippingAgentsPageController } from '../controllers/shippingAgent/useShippingAgentsPageController';
import { Search, Edit2, Trash2, Users, Home, Layers, Mail, Phone, Hash } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal';


// Simple stat card used above the lists (icon + value + label)
const StatCard: React.FC<{title: string; value: React.ReactNode; desc?: string; icon?: React.ReactNode}> = ({ title, value, desc, icon }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        {icon && (
            <div className="flex-shrink-0 bg-blue-50 rounded-md p-2 text-blue-600">
                {icon}
            </div>
        )}
        <div className="flex-1">
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-2xl font-semibold text-blue-600">{value}</div>
            {desc && <div className="text-xs text-gray-400 mt-1">{desc}</div>}
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────────
// Ícone ••• (Actions)
// ───────────────────────────────────────────────────────────────────────────────
const ShippingAgentsPage: React.FC = () => {
    const {
        orgs, reps, loading, error, successMsg, view, query,
        orgName, orgAddress, orgEmail, orgPhone, orgTaxNumber,
        repInitName, repInitCitizen, repInitNationality, repInitEmail, repInitPhone,
        submittingOrg, orgEmailError, repInitEmailError, repEmailError,
        repName, repCitizen, repEmail, repPhone, repNationality, repOrgName,
        submittingRep, deletingRepId, editingCitizenId, editingValues, submittingEdit,
        canSubmitOrg, canSubmitRep, orgNameError,
        filteredOrgs, filteredReps,
        // setters & handlers
        setView, setQuery,
        setOrgName, setOrgAddress, setOrgEmail, setOrgPhone, setOrgTaxNumber,
        setRepInitName, setRepInitCitizen, setRepInitNationality, setRepInitEmail, setRepInitPhone,
        setRepName, setRepCitizen, setRepEmail, setRepPhone, setRepNationality, setRepOrgName,
        setOrgEmailError, setRepInitEmailError, setRepEmailError,
        startEdit, cancelEdit, handleEditChange, saveEdit,
        handleCreateOrganization, handleCreateRepresentative,
        confirmDeleteRepresentative,
        isValidEmail,
        // new helpers
        applyOrgDefaults, resetOrgForm, applyRepDefaults, resetRepForm
    } = useShippingAgentsPageController();

    // Derived metrics for stat cards
    const totalOrgs = orgs.length;
    const totalReps = reps.length;
    const repsWithEmail = reps.filter((r: any) => (r.email ?? r.RepresentativeEmail)).length;
    const repsWithPhone = reps.filter((r: any) => (r.phone ?? r.RepresentativePhone)).length;
    const orgsWithPhone = orgs.filter((o: any) => (o.phone ?? o.Phone)).length;
    const avgRepsPerOrg = totalOrgs ? Math.round(totalReps / totalOrgs) : 0;

    // Local UI state for modals
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);
    const [pendingDeleteCitizenId, setPendingDeleteCitizenId] = React.useState<string | null>(null);
    // Organization modals
    const [selectedOrg, setSelectedOrg] = React.useState<any | null>(null);
    const [isOrgModalOpen, setIsOrgModalOpen] = React.useState(false);
    const [isOrgDeleteConfirmOpen, setIsOrgDeleteConfirmOpen] = React.useState(false);
    const [orgMessage, setOrgMessage] = React.useState<string | null>(null);

    // Open edit modal and start edit in controller
    const openEditModal = (rep: any) => {
        startEdit(rep);
        setIsEditModalOpen(true);
    };

    const openOrgModal = (org: any) => {
        setSelectedOrg(org);
        setIsOrgModalOpen(true);
    };

    const closeOrgModal = () => {
        setSelectedOrg(null);
        setIsOrgModalOpen(false);
    };

    const closeEditModal = () => {
        cancelEdit();
        setIsEditModalOpen(false);
    };

    const confirmDelete = (citizenId: string) => {
        setPendingDeleteCitizenId(citizenId);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDeleteOrg = (_orgId: string) => {
        setIsOrgDeleteConfirmOpen(true);
    };

    const onConfirmDelete = async () => {
        if (pendingDeleteCitizenId) {
            await confirmDeleteRepresentative(pendingDeleteCitizenId);
        }
        setIsConfirmDeleteOpen(false);
        setPendingDeleteCitizenId(null);
    };

    const onConfirmDeleteOrg = () => {
        // Deleting organizations via UI isn't implemented: show informative message
        setIsOrgDeleteConfirmOpen(false);
        setOrgMessage('Organization deletion is not available in the UI.');
        window.setTimeout(() => setOrgMessage(null), 4000);
    };

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Shipping Agents</h1>
                <p className="text-gray-600 mt-1">Manage organizations and their representatives</p>
            </div>

            {/* Stat cards (different sets for organizations vs representatives) */}
            <div className="mb-6">
                {view === 'organizations' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <StatCard title="Total Organizations" value={totalOrgs} desc="Total registered organizations" icon={<Home className="w-5 h-5" />} />
                        <StatCard title="Representatives" value={totalReps} desc="Representatives across all organizations" icon={<Users className="w-5 h-5" />} />
                        <StatCard title="Orgs with Phone" value={orgsWithPhone} desc="Organizations providing a phone number" icon={<Phone className="w-5 h-5" />} />
                        <StatCard title="Avg Reps / Org" value={avgRepsPerOrg} desc="Average number of representatives per organization" icon={<Layers className="w-5 h-5" />} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <StatCard title="Total Representatives" value={totalReps} desc="All registered representatives" icon={<Users className="w-5 h-5" />} />
                        <StatCard title="With Email" value={repsWithEmail} desc="Representatives with an email address" icon={<Mail className="w-5 h-5" />} />
                        <StatCard title="With Phone" value={repsWithPhone} desc="Representatives with a phone number" icon={<Phone className="w-5 h-5" />} />
                        <StatCard title="Unique Orgs" value={new Set(reps.map((r:any) => r.organizationName || r.organizationId)).size} desc="Distinct organizations referenced by reps" icon={<Hash className="w-5 h-5" />} />
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setView('organizations')}
                        className={`px-4 py-2 rounded-lg ${
                            view === 'organizations'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                    >
                        Organizations
                    </button>
                    <button
                        onClick={() => setView('representatives')}
                        className={`px-4 py-2 rounded-lg ${
                            view === 'representatives'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                    >
                        Representatives
                    </button>
                </div>

                {/* Search - estilo semelhante ao VesselsPage */}
                <div className="relative w-1/3 min-w-[220px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                            view === 'organizations'
                                ? 'Search by name, address, contact…'
                                : 'Search by name, citizen id, organization…'
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base"
                    />
                </div>
            </div>

            {/* Erros globais */}
            {error && (
                <div className="mb-4 p-3 rounded border border-red-200 text-red-700 bg-red-50">
                    {error}
                </div>
            )}
            {orgMessage && (
                <div className="mb-4 p-3 rounded border border-yellow-200 text-yellow-800 bg-yellow-50">
                    {orgMessage}
                </div>
            )}
            {/* Mensagem de sucesso */}
            {successMsg && (
                <div className="mb-4 p-3 rounded border border-green-200 text-green-700 bg-green-50">
                    {successMsg}
                </div>
            )}

            {/* Área de criação */}
            {view === 'organizations' ? (
                <form onSubmit={handleCreateOrganization} className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Create Organization + Initial Representative</h2>
                          <div className="flex gap-2">
                            <button type="button" onClick={applyOrgDefaults} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Use defaults</button>
                            <button type="button" onClick={resetOrgForm} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Clear</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Organization name *"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Address"
                                value={orgAddress}
                                onChange={(e) => setOrgAddress(e.target.value)}
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Email *"
                                value={orgEmail}
                                onChange={(e) => { setOrgEmail(e.target.value); setOrgEmailError(null); }}
                                onBlur={() => { if (orgEmail && !isValidEmail(orgEmail)) setOrgEmailError('Organization email appears invalid.'); }}
                                onInvalid={(e: any) => { e.preventDefault(); if (!orgEmail) setOrgEmailError('Organization email is required.'); else setOrgEmailError('Organization email appears invalid.'); }}
                                type="email"
                                required
                            />
                           {orgEmailError && (
                                <p className="text-xs text-red-500 mt-1">{orgEmailError}</p>
                           )}
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Phone *"
                                value={orgPhone}
                                onChange={(e) => setOrgPhone(e.target.value)}
                                required
                            />
                            {/* NEW: required by backend */}
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                                placeholder="Tax number (NIF/VAT) *"
                                value={orgTaxNumber}
                                onChange={(e) => setOrgTaxNumber(e.target.value)}
                                required
                            />
                        </div>

                        <h3 className="text-md font-medium mt-2">Initial Representative (required)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Representative name *"
                                value={repInitName}
                                onChange={(e) => setRepInitName(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Citizen ID *"
                                value={repInitCitizen}
                                onChange={(e) => setRepInitCitizen(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nationality *"
                                value={repInitNationality}
                                onChange={(e) => setRepInitNationality(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Rep Email *"
                                value={repInitEmail}
                                onChange={(e) => { setRepInitEmail(e.target.value); setRepInitEmailError(null); }}
                                onBlur={() => { if (repInitEmail && !isValidEmail(repInitEmail)) setRepInitEmailError('Initial representative email appears invalid.'); }}
                                onInvalid={(e: any) => { e.preventDefault(); if (!repInitEmail) setRepInitEmailError('Representative email is required.'); else setRepInitEmailError('Initial representative email appears invalid.'); }}
                                type="email"
                                required
                            />
                           {repInitEmailError && (
                                <p className="text-xs text-red-500 mt-1">{repInitEmailError}</p>
                           )}
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Rep Phone *"
                                value={repInitPhone}
                                onChange={(e) => setRepInitPhone(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500">Organization email and phone are required and will appear in the list; the initial representative also requires email and phone. Phone must start with 9 and have 9 digits.</p>

                        <button
                            disabled={!canSubmitOrg}
                            className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
                        >
                            {submittingOrg ? 'Creating…' : 'Create Organization'}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleCreateRepresentative} className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Create Representative (link by Organization Name)</h2>
                          <div className="flex gap-2">
                            <button type="button" onClick={applyRepDefaults} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Use defaults</button>
                            <button type="button" onClick={resetRepForm} className="px-3 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">Clear</button>
                          </div>
                        </div>

                        <div>
                            <input
                                list="org-names"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Organization name *"
                                value={repOrgName}
                                onChange={(e) => setRepOrgName(e.target.value)}
                                required
                            />
                            <datalist id="org-names">
                                {orgs.map((o) => (
                                    <option key={o.id || o.name} value={o.name} />
                                ))}
                            </datalist>
                            <p className="text-xs text-gray-500 mt-1">
                                Select an existing organization. The backend links by name and resolves the FK.
                            </p>
                            {orgNameError && (
                                <p className="text-xs text-red-500 mt-1">
                                    {orgNameError}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Representative name *"
                                value={repName}
                                onChange={(e) => setRepName(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Citizen ID *"
                                value={repCitizen}
                                onChange={(e) => setRepCitizen(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nationality *"
                                value={repNationality}
                                onChange={(e) => setRepNationality(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Email"
                                value={repEmail}
                                onChange={(e) => { setRepEmail(e.target.value); setRepEmailError(null); }}
                                onBlur={() => { if (repEmail && !isValidEmail(repEmail)) setRepEmailError('Provided email appears invalid.'); }}
                                onInvalid={(e: any) => { e.preventDefault(); if (repEmail === '') setRepEmailError(null); else setRepEmailError('Provided email appears invalid.'); }}
                                type="email"
                            />
                           {repEmailError && (
                                <p className="text-xs text-red-500 mt-1">{repEmailError}</p>
                           )}
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Phone"
                                value={repPhone}
                                onChange={(e) => setRepPhone(e.target.value)}
                            />
                        </div>

                        <button
                            disabled={!canSubmitRep}
                            className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
                        >
                            {submittingRep ? 'Creating…' : 'Create Representative'}
                        </button>
                    </div>
                </form>
            )}

            {/* Tabelas */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-100">
                    {view === 'organizations' ? (
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Tax Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    ) : (
                         <tr>
                             <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                 Name
                             </th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                 Citizen ID
                             </th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                 Organization
                             </th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                 Nationality
                             </th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                 Contact
                             </th>
                             <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">
                                 Actions
                             </th>
                         </tr>
                    )}
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                        <tr>
                            <td colSpan={view === 'organizations' ? 5 : 6} className="text-center py-4">
                                Loading...
                            </td>
                        </tr>
                    )}

                    {!loading && view === 'organizations' && (
                        filteredOrgs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-gray-600 font-medium">No organizations found</p>
                                            <p className="text-gray-500 text-sm mt-1">Create your first organization to get started</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredOrgs.map((org) => (
                                <tr key={org.id || org.name} className="hover:bg-blue-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.address ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.taxNumber ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.phone ? `${org.phone}${org.email ? ' • ' + org.email : ''}` : org.email ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openOrgModal(org)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="text-sm font-medium">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => confirmDeleteOrg(org.id ?? org.taxNumber ?? org.name)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="text-sm font-medium">Delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )
                    )}

                    {!loading && view === 'representatives' && (
                        filteredReps.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="text-gray-600 font-medium">No representatives found</p>
                                            <p className="text-gray-500 text-sm mt-1">Create your first representative to get started</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredReps.map((rep) => (
                                <tr key={rep.id} className="hover:bg-blue-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.citizenId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.organizationName ?? rep.organizationId ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.nationality ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.phone ? `${rep.phone}${rep.email ? ' • ' + rep.email : ''}` : rep.email ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(rep)}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="text-sm font-medium">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(rep.citizenId)}
                                                disabled={deletingRepId !== null && deletingRepId !== rep.citizenId}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="text-sm font-medium">{deletingRepId === rep.citizenId ? 'Deleting…' : 'Delete'}</span>
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

            {/* Edit Representative Modal */}
            <Modal isOpen={isEditModalOpen && !!editingCitizenId} onClose={closeEditModal} title={editingCitizenId ? 'Edit Representative' : 'Edit Representative'}>
                {editingValues ? (
                    <form onSubmit={(e) => { e.preventDefault(); if (editingCitizenId) { saveEdit(editingCitizenId); } closeEditModal(); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Name</label>
                                <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingValues.name} onChange={(e) => handleEditChange('name', e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Citizen ID</label>
                                <input disabled className="w-full p-2 border border-gray-100 rounded-lg bg-gray-50" value={editingCitizenId ?? ''} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Organization</label>
                                <input list="org-names-edit" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingValues.organizationName ?? ''} onChange={(e) => handleEditChange('organizationName', e.target.value)} required />
                                <datalist id="org-names-edit">{orgs.map(o => <option key={o.id || o.name} value={o.name} />)}</datalist>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Nationality</label>
                                <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingValues.nationality ?? ''} onChange={(e) => handleEditChange('nationality', e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingValues.phone ?? ''} onChange={(e) => handleEditChange('phone', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input type="email" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingValues.email ?? ''} onChange={(e) => handleEditChange('email', e.target.value)} />
                            </div>
                        </div>
                        {error && <div className="text-sm text-red-600">{error}</div>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeEditModal} className="px-3 py-2 border rounded">Cancel</button>
                            <button type="submit" disabled={submittingEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{submittingEdit ? 'Saving…' : 'Save changes'}</button>
                        </div>
                    </form>
                ) : null}
            </Modal>

            {/* Confirmation modal for delete representative */}
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={onConfirmDelete}
                title="Delete Representative"
                message="Are you sure you want to delete this representative? This action cannot be undone."
                isDestructive
            />

            {/* Confirmation modal for delete organization */}
            <ConfirmationModal
                isOpen={isOrgDeleteConfirmOpen}
                onClose={() => setIsOrgDeleteConfirmOpen(false)}
                onConfirm={onConfirmDeleteOrg}
                title="Delete Organization"
                message="Are you sure you want to delete this organization? This action cannot be undone."
                isDestructive
            />

            {/* Organization details modal (read-only) */}
            <Modal isOpen={isOrgModalOpen && !!selectedOrg} onClose={closeOrgModal} title={selectedOrg ? 'Organization details' : 'Organization'}>
                {selectedOrg && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <div className="text-xs text-gray-500">Name</div>
                                <div className="text-sm text-gray-900">{selectedOrg.name}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Address</div>
                                <div className="text-sm text-gray-900">{selectedOrg.address ?? '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Tax Number</div>
                                <div className="text-sm text-gray-900">{selectedOrg.taxNumber ?? '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Contact</div>
                                <div className="text-sm text-gray-900">{selectedOrg.phone ? `${selectedOrg.phone}${selectedOrg.email ? ' • ' + selectedOrg.email : ''}` : selectedOrg.email ?? '-'}</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button onClick={closeOrgModal} className="px-4 py-2 rounded-md border">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default ShippingAgentsPage;
