import React from 'react';
import { useShippingAgentsPageController } from '../controllers/shippingAgent/useShippingAgentsPageController';


// ───────────────────────────────────────────────────────────────────────────────
// Ícone ••• (Actions)
// ───────────────────────────────────────────────────────────────────────────────
const DotsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

// ───────────────────────────────────────────────────────────────────────────────
const ShippingAgentsPage: React.FC = () => {
    const {
        orgs, loading, error, successMsg, view, query,
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
        handleCreateOrganization, handleCreateRepresentative, handleDeleteRepresentative,
        isValidEmail
    } = useShippingAgentsPageController();

    return (
        <div className="container mt-6">
            <div className="panel">
                {/* Header com tabs */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Shipping Agents</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView('organizations')}
                            className={`px-3 py-1 rounded ${
                                view === 'organizations'
                                    ? 'bg-maritime-100 text-maritime-800'
                                    : 'bg-white text-gray-700 hover:bg-maritime-50'
                            }`}
                        >
                            Organizations
                        </button>
                        <button
                            onClick={() => setView('representatives')}
                            className={`px-3 py-1 rounded ${
                                view === 'representatives'
                                    ? 'bg-maritime-100 text-maritime-800'
                                    : 'bg-white text-gray-700 hover:bg-maritime-50'
                            }`}
                        >
                            Representatives
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex mb-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                            view === 'organizations'
                                ? 'Search by name, address, contact…'
                                : 'Search by name, citizen id, organization…'
                        }
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                    />
                </div>

                {/* Erros globais */}
                {error && (
                    <div className="mb-4 p-3 rounded border border-red-200 text-red-700 bg-red-50">
                        {error}
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
                    <form onSubmit={handleCreateOrganization} className="mb-6 space-y-4">
                        <h2 className="text-lg font-semibold">Create Organization + Initial Representative</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Organization name *"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Address"
                                value={orgAddress}
                                onChange={(e) => setOrgAddress(e.target.value)}
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
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
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Phone *"
                                value={orgPhone}
                                onChange={(e) => setOrgPhone(e.target.value)}
                                required
                            />
                            {/* NEW: required by backend */}
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500 md:col-span-2"
                                placeholder="Tax number (NIF/VAT) *"
                                value={orgTaxNumber}
                                onChange={(e) => setOrgTaxNumber(e.target.value)}
                                required
                            />
                        </div>

                        <h3 className="text-md font-medium mt-2">Initial Representative (required)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Representative name *"
                                value={repInitName}
                                onChange={(e) => setRepInitName(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Citizen ID *"
                                value={repInitCitizen}
                                onChange={(e) => setRepInitCitizen(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Nationality *"
                                value={repInitNationality}
                                onChange={(e) => setRepInitNationality(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
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
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Rep Phone *"
                                value={repInitPhone}
                                onChange={(e) => setRepInitPhone(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500">Organization email and phone are required and will appear in the list; the initial representative also requires email and phone. Phone must start with 9 and have 9 digits.</p>

                        <button
                            disabled={!canSubmitOrg}
                            className="px-4 py-2 rounded bg-maritime-600 text-white hover:bg-maritime-700 disabled:opacity-50"
                        >
                            {submittingOrg ? 'Creating…' : 'Create Organization'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleCreateRepresentative} className="mb-6 space-y-4">
                        <h2 className="text-lg font-semibold">Create Representative (link by Organization Name)</h2>

                        <div>
                            <input
                                list="org-names"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
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
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Representative name *"
                                value={repName}
                                onChange={(e) => setRepName(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Citizen ID *"
                                value={repCitizen}
                                onChange={(e) => setRepCitizen(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Nationality *"
                                value={repNationality}
                                onChange={(e) => setRepNationality(e.target.value)}
                                required
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
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
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Phone"
                                value={repPhone}
                                onChange={(e) => setRepPhone(e.target.value)}
                            />
                        </div>

                        <button
                            disabled={!canSubmitRep}
                            className="px-4 py-2 rounded bg-maritime-600 text-white hover:bg-maritime-700 disabled:opacity-50"
                        >
                            {submittingRep ? 'Creating…' : 'Create Representative'}
                        </button>
                    </form>
                )}

                {/* Tabelas */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-maritime-100">
                        {view === 'organizations' ? (
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                    Tax Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        ) : (
                             <tr>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                     Name
                                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                     Citizen ID
                                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                     Organization
                                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                     Nationality
                                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">
                                     Contact
                                 </th>
                                 <th className="px-6 py-3 text-right text-xs font-medium text-maritime-700 uppercase tracking-wider">
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
                                    <td colSpan={5} className="text-center py-4">
                                        No organizations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrgs.map((org) => (
                                    <tr key={org.id || org.name} className="hover:bg-maritime-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {org.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {org.address ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {org.taxNumber ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {org.phone ? `${org.phone}${org.email ? ' • ' + org.email : ''}` : org.email ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-gray-400 hover:text-gray-600" aria-label="Open actions">
                                                <DotsIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )
                        )}

                        {!loading && view === 'representatives' && (
                            filteredReps.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4">
                                        No representatives found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReps.map((rep) => (
                                     <tr key={rep.id} className="hover:bg-maritime-50">
                                        {editingCitizenId === rep.citizenId ? (
                                             <>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                     <input value={editingValues?.name ?? ''} onChange={(e) => handleEditChange('name', e.target.value)} className="p-1 border rounded w-48" />
                                                 </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                     <input disabled value={rep.citizenId} className="p-1 border rounded w-36 bg-gray-100" />
                                                 </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <input value={editingValues?.organizationName ?? ''} onChange={(e) => handleEditChange('organizationName', e.target.value)} className="p-1 border rounded w-40" />
                                                 </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <input value={editingValues?.nationality ?? ''} onChange={(e) => handleEditChange('nationality', e.target.value)} className="p-1 border rounded w-28" />
                                                 </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                     <input value={editingValues?.phone ?? ''} onChange={(e) => handleEditChange('phone', e.target.value)} className="p-1 border rounded w-36" />
                                                     <input value={editingValues?.email ?? ''} onChange={(e) => handleEditChange('email', e.target.value)} className="p-1 border rounded w-48 ml-2" />
                                                 </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                     <div className="flex items-center justify-end gap-2">
                                                         <button onClick={() => saveEdit(rep.citizenId)} disabled={submittingEdit} className="px-2 py-1 bg-maritime-600 text-white rounded">
                                                             {submittingEdit ? 'Saving…' : 'Save'}
                                                         </button>
                                                         <button onClick={cancelEdit} className="px-2 py-1 border rounded">Cancel</button>
                                                     </div>
                                                 </td>
                                             </>
                                         ) : (
                                             <>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.citizenId}</td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.organizationName ?? rep.organizationId ?? '-'}</td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.nationality ?? '-'}</td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.phone ? `${rep.phone}${rep.email ? ' • ' + rep.email : ''}` : rep.email ?? '-'}</td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                     <div className="flex items-center justify-end gap-2">
                                                         <button onClick={() => startEdit(rep)} className="px-2 py-1 border rounded text-sm">Edit</button>
                                                         <button onClick={() => handleDeleteRepresentative(rep.citizenId)} disabled={deletingRepId !== null && deletingRepId !== rep.citizenId} className="text-red-500 hover:text-red-700 disabled:opacity-50">{deletingRepId === rep.citizenId ? 'Deleting…' : 'Delete'}</button>
                                                     </div>
                                                 </td>
                                             </>
                                         )}
                                     </tr>
                                ))
                             )
                         )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShippingAgentsPage;
