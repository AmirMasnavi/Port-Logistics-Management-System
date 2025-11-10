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
    const [repNationality, setRepNationality] = useState('');
    const [repOrgName, setRepOrgName] = useState('');
    const [submittingRep, setSubmittingRep] = useState(false);

    const normalize = (s?: string) => {
        const str = (s ?? '').toString().normalize('NFD');
        // Try to use Unicode property escape for diacritics; if not supported, fall back to the common combining mark range.
        try {
            return str.replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
        } catch (e) {
            return str.replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        }
    };

    // lista inicial
    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch organizations and representatives separately so one failing call
            // doesn't prevent the other from loading. Keep the page usable even if
            // the backend endpoint is temporarily unavailable or returns 401.
            let orgsData: any[] = [];
            try {
                orgsData = await apiService.getAllShippingAgentOrganizations();
            } catch (orgErr) {
                console.error('Error fetching shipping agent organizations:', orgErr);
                orgsData = [];
                // We avoid setting a fatal error here so the UI can still show reps or allow creation.
            }

            let repsData: any[] = [];
            try {
                repsData = await apiService.getAllShippingAgentRepresentatives().catch(() => []);
            } catch (repErr) {
                console.error('Error fetching shipping agent representatives:', repErr);
                repsData = [];
            }

            // Normalize backend DTOs to the frontend shape expected by the UI.
            // Backend ShippingAgentOrganizationDto has: LegalName, AlternativeName, Street, City, Country, TaxNumber
            const normalizedOrgs: ShippingAgentOrganization[] = Array.isArray(orgsData)
                ? orgsData.map((o: any) => ({
                      id: o.id ?? o.organizationId ?? o.OrganizationId ?? '',
                      name: o.legalName ?? o.LegalName ?? o.legalname ?? o.LegalName ?? o.name ?? '',
                      address: [o.street ?? o.Street, o.city ?? o.City, o.country ?? o.Country]
                          .filter(Boolean)
                          .join(', ') || undefined,
                      email: o.email ?? o.Email ?? undefined,
                      phone: o.phone ?? o.Phone ?? undefined,
                  }))
                : [];

            // Representatives DTOs may include CitizenId or TaxNumber depending on the API.
            // We normalize to use 'citizenId' in the frontend but display it as 'Tax number' in the UI.
            const normalizedReps: Representative[] = Array.isArray(repsData)
                ? repsData.map((r: any) => ({
                      id: r.id ?? r.representativeId ?? r.RepresentativeId ?? '',
                      name: r.name ?? r.RepresentativeName ?? r.RepresentativeName ?? '',
                      // Prefer TaxNumber if present on the representative; otherwise fallback to CitizenId
                      citizenId: r.taxNumber ?? r.TaxNumber ?? r.citizenId ?? r.CitizenId ?? '',
                      email: r.email ?? r.RepresentativeEmail ?? r.RepresentativeEmail ?? undefined,
                      phone: r.phone ?? r.RepresentativePhone ?? r.RepresentativePhone ?? undefined,
                      organizationId: r.organizationId ?? r.OrganizationId ?? r.organizationID ?? undefined,
                      organizationName: r.organizationName ?? r.OrganizationName ?? r.organizationName ?? undefined,
                  }))
                : [];

            setOrgs(normalizedOrgs);
            setReps(normalizedReps);
            // Quick debug logs requested
            console.log('orgs:', normalizedOrgs);
            console.log('reps:', normalizedReps);
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
            // Build payload matching backend CreateShippingAgentOrganizationDto
            const payload: any = {
                LegalName: orgName.trim(),
                AlternativeName: '',
                // The server expects Street, City, Country individually; we only have a single address field
                // so put it into Street and leave City/Country empty. This can be improved later with separate inputs.
                Street: orgAddress.trim() || '',
                City: '',
                Country: '',
                // Organization tax number is optional on the form; leave empty so backend default or validations apply
                TaxNumber: '',
                Representatives: [
                    {
                        RepresentativeName: repInitName.trim(),
                        CitizenId: repInitCitizen.trim(),
                        // The DTO requires RepresentativeNationality; use a reasonable default so model validation passes
                        RepresentativeNationality: 'PT',
                        RepresentativeEmail: repInitEmail.trim() || '',
                        RepresentativePhone: repInitPhone.trim() || '',
                    },
                ],
            };

            await apiService.createShippingAgentOrganization(payload);
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
    // Backend DTO requires RepresentativeName, CitizenId, RepresentativeNationality, RepresentativeEmail, RepresentativePhone, OrganizationName
    const canSubmitRep: boolean = !!(
        repName.trim() && repCitizen.trim() && repNationality.trim() && repEmail.trim() && repPhone.trim() && repOrgName.trim() && !submittingRep
    );

    // Resolve o nome fornecido pelo utilizador para um nome canónico (se houver exactamente 1 match).
    // Retorna `resolvedOrgName` (string | null) e `orgNameError` (string | null).
    const { resolvedOrgName, orgNameError } = useMemo(() => {
        const input = repOrgName.trim();
        if (!input) return { resolvedOrgName: null as string | null, orgNameError: null as string | null };
        const normalizedInput = normalize(input);

        // 1) Try exact matches in orgs by normalized name
        const orgMatches = orgs.filter((o) => normalize(o.name) === normalizedInput);
        if (orgMatches.length === 1) return { resolvedOrgName: orgMatches[0].name, orgNameError: null };
        if (orgMatches.length > 1) return { resolvedOrgName: null, orgNameError: 'Organization name is ambiguous. Please select an exact match.' };

        // 2) Fallback: try distinct organizationName values from existing representatives
        const repOrgNames = Array.from(new Set(reps.map((r) => r.organizationName).filter(Boolean))) as string[];
        const repMatches = repOrgNames.filter((n) => normalize(n) === normalizedInput);
        if (repMatches.length === 1) return { resolvedOrgName: repMatches[0], orgNameError: null };
        if (repMatches.length > 1) return { resolvedOrgName: null, orgNameError: 'Organization name is ambiguous. Please select an exact match.' };

        // No matches found
        return { resolvedOrgName: null, orgNameError: 'Organization name not found. Please pick an existing one.' };
    }, [repOrgName, orgs, reps]);

    const validateRepresentativeBeforeSubmit = (): string | null => {
        // Basic client-side checks mirroring server expectations to avoid 400 responses
        if (repCitizen.trim().length < 8) return 'Tax number must be at least 8 characters.';
        // Phone validation: server's tests expect Portuguese mobile numbers starting with '9'
        const phone = repPhone.trim();
        if (!/^\d{8,}$/.test(phone)) return 'Phone must contain at least 8 digits.';
        if (!phone.startsWith('9')) return 'Phone number must start with 9.';
        // Email basic check (HTML input also enforces, but double-check)
        if (repEmail.trim() && !/.+@.+\..+/.test(repEmail.trim())) return 'Email format looks invalid.';
        return null;
    };

    const handleCreateRepresentative = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmitRep) return;
        if (orgNameError) {
            setError(orgNameError);
            return;
        }

        const clientValidationError = validateRepresentativeBeforeSubmit();
        if (clientValidationError) {
            setError(clientValidationError);
            return;
        }

        setSubmittingRep(true);
        setError(null);
        try {
            // Debug: log payload about to be sent
            const payload: any = {
                RepresentativeName: repName.trim(),
                CitizenId: repCitizen.trim(),
                RepresentativeNationality: repNationality.trim(),
                RepresentativeEmail: repEmail.trim(),
                RepresentativePhone: repPhone.trim(),
            };

            // If we have the organization present in `orgs`, include OrganizationId (prefer id)
            const matchedOrg = orgs.find((o) => normalize(o.name) === normalize(resolvedOrgName as string));
            if (matchedOrg && matchedOrg.id) {
                payload.OrganizationId = matchedOrg.id;
            } else {
                // fallback: send OrganizationName so backend can resolve it
                payload.OrganizationName = resolvedOrgName as string;
            }

            console.log('Creating representative payload:', payload);

            // Send payload using the backend DTO property names
            await apiService.createShippingAgentRepresentative(payload);
            // limpar
            setRepName('');
            setRepCitizen('');
            setRepEmail('');
            setRepPhone('');
            setRepNationality('');
            setRepOrgName('');
            await fetchAll();
            setView('representatives');
        } catch (e: any) {
            // Try to show server-provided message when available (axios style)
            console.error('Representative create error:', e);
            const respData = e?.response?.data;
            let serverMsg = e?.message ?? 'Failed to create representative';
            if (respData) {
                console.error('Server response data:', respData);
                // ASP.NET ProblemDetails often have 'errors' dictionary
                if (respData.errors && typeof respData.errors === 'object') {
                    const parts: string[] = [];
                    for (const key of Object.keys(respData.errors)) {
                        const val = respData.errors[key];
                        if (Array.isArray(val)) parts.push(...val.map((v) => `${key}: ${v}`));
                        else parts.push(`${key}: ${String(val)}`);
                    }
                    serverMsg = parts.join(' | ');
                } else if (respData.title || respData.detail) {
                    serverMsg = `${respData.title ?? ''}${respData.detail ? ' - ' + respData.detail : ''}`.trim();
                } else if (respData.message) {
                    serverMsg = respData.message;
                } else if (typeof respData === 'string') {
                    serverMsg = respData;
                } else {
                    try {
                        serverMsg = JSON.stringify(respData);
                    } catch (jsonErr) {
                        serverMsg = String(respData);
                    }
                }
            }
            setError(serverMsg);
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
                                : 'Search by name, tax number, organization…'
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
                                placeholder="Tax number *"
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
                                placeholder="Tax number *"
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
                                    Tax number
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
