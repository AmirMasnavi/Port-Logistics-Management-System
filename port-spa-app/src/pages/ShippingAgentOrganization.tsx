import React, { useEffect, useMemo, useState } from 'react';
import * as apiService from '../services/apiService';


// ───────────────────────────────────────────────────────────────────────────────
// Tipos
// ───────────────────────────────────────────────────────────────────────────────
interface ShippingAgentOrganization {
    id: string;
    name: string;
    address?: string;
    email?: string;
    phone?: string;
}

interface Representative {
    id: string;
    name: string;
    citizenId: string;
    email?: string;
    phone?: string;
    organizationId?: string;
    organizationName?: string;
}

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
    // dados
    const [orgs, setOrgs] = useState<ShippingAgentOrganization[]>([]);
    const [reps, setReps] = useState<Representative[]>([]);
    // ui
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'organizations' | 'representatives'>('organizations');
    const [query, setQuery] = useState('');

    // form: criar organização + representante obrigatório
    const [orgName, setOrgName] = useState('');
    const [orgAddress, setOrgAddress] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [orgPhone, setOrgPhone] = useState('');
    const [repInitName, setRepInitName] = useState('');
    const [repInitCitizen, setRepInitCitizen] = useState('');
    const [repInitEmail, setRepInitEmail] = useState('');
    const [repInitPhone, setRepInitPhone] = useState('');
    const [submittingOrg, setSubmittingOrg] = useState(false);

    // form: criar representante isolado (liga por nome da organização)
    const [repName, setRepName] = useState('');
    const [repCitizen, setRepCitizen] = useState('');
    const [repEmail, setRepEmail] = useState('');
    const [repPhone, setRepPhone] = useState('');
    const [repOrgName, setRepOrgName] = useState('');
    const [submittingRep, setSubmittingRep] = useState(false);

    const normalize = (s?: string) =>
        (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

    // lista inicial
    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [orgsData, repsData] = await Promise.all([
                apiService.getAllShippingAgentOrganizations(),
                apiService.getAllShippingAgentRepresentatives().catch(() => []), // se ainda não existir endpoint, não quebra a página
            ]);
            setOrgs(Array.isArray(orgsData) ? orgsData : []);
            setReps(Array.isArray(repsData) ? repsData : []);
        } catch (e: any) {
            setError('Failed to fetch data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // filtros
    const filteredOrgs = useMemo(() => {
        const q = normalize(query);
        return orgs.filter(
            (o) =>
                normalize(o.name).includes(q) ||
                normalize(o.address).includes(q) ||
                normalize(o.email).includes(q) ||
                normalize(o.phone).includes(q)
        );
    }, [orgs, query]);

    const filteredReps = useMemo(() => {
        const q = normalize(query);
        return reps.filter(
            (r) =>
                normalize(r.name).includes(q) ||
                normalize(r.citizenId).includes(q) ||
                normalize(r.organizationName).includes(q) ||
                normalize(r.organizationId).includes(q) ||
                normalize(r.email).includes(q) ||
                normalize(r.phone).includes(q)
        );
    }, [reps, query]);

    // submit: criar organization + representative obrigatório (sem precisar nome da org no rep)
    // coerção para booleano — evita strings em atributos `disabled`
    const canSubmitOrg: boolean = !!(
        orgName.trim() && repInitName.trim() && repInitCitizen.trim() && !submittingOrg
    );

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmitOrg) return;
        setSubmittingOrg(true);
        setError(null);
        try {
            // função exportada é `createShippingAgentOrganization` (singular)
            await apiService.createShippingAgentOrganization({
                name: orgName.trim(),
                address: orgAddress.trim() || undefined,
                email: orgEmail.trim() || undefined,
                phone: orgPhone.trim() || undefined,
                initialRepresentative: {
                    name: repInitName.trim(),
                    citizenId: repInitCitizen.trim(),
                    email: repInitEmail.trim() || undefined,
                    phone: repInitPhone.trim() || undefined,
                },
            });
            // limpar
            setOrgName('');
            setOrgAddress('');
            setOrgEmail('');
            setOrgPhone('');
            setRepInitName('');
            setRepInitCitizen('');
            setRepInitEmail('');
            setRepInitPhone('');
            await fetchAll();
            setView('organizations');
        } catch (e: any) {
            setError(e?.message ?? 'Failed to create organization');
        } finally {
            setSubmittingOrg(false);
        }
    };

    // submit: criar representante isolado (obrigatório organizationName)
    // coerção para booleano — evita strings em atributos `disabled`
    const canSubmitRep: boolean = !!(
        repName.trim() && repCitizen.trim() && repOrgName.trim() && !submittingRep
    );

    // Resolve o nome fornecido pelo utilizador para um nome canónico (se houver exactamente 1 match).
    // Retorna `resolvedOrgName` (string | null) e `orgNameError` (string | null).
    const { resolvedOrgName, orgNameError } = useMemo(() => {
        if (!repOrgName.trim()) return { resolvedOrgName: null as string | null, orgNameError: null as string | null };
        const matches = orgs.filter((o) => normalize(o.name) === normalize(repOrgName));
        if (matches.length === 1) return { resolvedOrgName: matches[0].name, orgNameError: null };
        if (matches.length === 0)
            return { resolvedOrgName: null, orgNameError: 'Organization name not found. Please pick an existing one.' };
        return { resolvedOrgName: null, orgNameError: 'Organization name is ambiguous. Please select an exact match.' };
    }, [repOrgName, orgs]);

    const handleCreateRepresentative = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmitRep) return;
        if (orgNameError) {
            setError(orgNameError);
            return;
        }
        setSubmittingRep(true);
        setError(null);
        try {
            await apiService.createShippingAgentRepresentative({
                name: repName.trim(),
                citizenId: repCitizen.trim(),
                email: repEmail.trim() || undefined,
                phone: repPhone.trim() || undefined,
                organizationName: resolvedOrgName as string, // backend liga por NAME e resolve FK
            });
            // limpar
            setRepName('');
            setRepCitizen('');
            setRepEmail('');
            setRepPhone('');
            setRepOrgName('');
            await fetchAll();
            setView('representatives');
        } catch (e: any) {
            setError(e?.message ?? 'Failed to create representative');
        } finally {
            setSubmittingRep(false);
        }
    };

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
                                : 'Search by name, citizen ID, organization…'
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
                                placeholder="Email"
                                value={orgEmail}
                                onChange={(e) => setOrgEmail(e.target.value)}
                                type="email"
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Phone"
                                value={orgPhone}
                                onChange={(e) => setOrgPhone(e.target.value)}
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
                                placeholder="Rep Email"
                                value={repInitEmail}
                                onChange={(e) => setRepInitEmail(e.target.value)}
                                type="email"
                            />
                            <input
                                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                placeholder="Rep Phone"
                                value={repInitPhone}
                                onChange={(e) => setRepInitPhone(e.target.value)}
                            />
                        </div>

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
                                    <option key={o.id} value={o.name} />
                                ))}
                            </datalist>
                            <p className="text-xs text-gray-500 mt-1">
                                Select an existing organization. The backend links by name and resolves the FK.
                            </p>
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
                                placeholder="Email"
                                value={repEmail}
                                onChange={(e) => setRepEmail(e.target.value)}
                                type="email"
                            />
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
                                <td colSpan={view === 'organizations' ? 4 : 5} className="text-center py-4">
                                    Loading...
                                </td>
                            </tr>
                        )}

                        {!loading && view === 'organizations' && (
                            filteredOrgs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">
                                        No organizations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrgs.map((org) => (
                                    <tr key={org.id} className="hover:bg-maritime-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {org.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {org.address ?? '-'}
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
                                    <td colSpan={5} className="text-center py-4">
                                        No representatives found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReps.map((rep) => (
                                    <tr key={rep.id} className="hover:bg-maritime-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {rep.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {rep.citizenId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {rep.organizationName ?? rep.organizationId ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {rep.phone ? `${rep.phone}${rep.email ? ' • ' + rep.email : ''}` : rep.email ?? '-'}
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShippingAgentsPage;
