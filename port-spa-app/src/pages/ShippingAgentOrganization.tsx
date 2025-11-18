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
    taxNumber?: string;
}

interface Representative {
    id: string;
    name: string;
    citizenId: string;
    nationality?: string;
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
    // NEW: required by backend
    const [orgTaxNumber, setOrgTaxNumber] = useState('');

    const [repInitName, setRepInitName] = useState('');
    const [repInitCitizen, setRepInitCitizen] = useState('');
    // Nationality must be explicitly chosen by the user (no default)
    const [repInitNationality, setRepInitNationality] = useState('');
    const [repInitEmail, setRepInitEmail] = useState('');
    const [repInitPhone, setRepInitPhone] = useState('');
    const [submittingOrg, setSubmittingOrg] = useState(false);

    // Inline email validation errors (Portuguese messages shown under inputs)
    const [orgEmailError, setOrgEmailError] = useState<string | null>(null);
    const [repInitEmailError, setRepInitEmailError] = useState<string | null>(null);
    const [repEmailError, setRepEmailError] = useState<string | null>(null);

    // form: criar representante isolado (liga por nome da organização)
    const [repName, setRepName] = useState('');
    const [repCitizen, setRepCitizen] = useState('');
    const [repEmail, setRepEmail] = useState('');
    const [repPhone, setRepPhone] = useState('');
    const [repNationality, setRepNationality] = useState('');
    const [repOrgName, setRepOrgName] = useState('');
    const [submittingRep, setSubmittingRep] = useState(false);
    const [deletingRepId, setDeletingRepId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    // Edit states for representatives
    const [editingCitizenId, setEditingCitizenId] = useState<string | null>(null);
    const [editingValues, setEditingValues] = useState<{ name: string; email?: string; phone?: string; nationality?: string; organizationName?: string } | null>(null);
    const [submittingEdit, setSubmittingEdit] = useState(false);

    const normalize = (s?: string) => {
        const str = (s ?? '').toString().normalize('NFD');
        // Try to use Unicode property escape for diacritics; if not supported, fall back to the common combining mark range.
        try {
            return str.replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
        } catch (e) {
            return str.replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        }
    };

    // Normalize phone to digits-only for uniqueness comparisons
    const normalizePhone = (p?: string) => (p ?? '').toString().replace(/\D/g, '').trim();

    const isValidCitizenId = (v: string) => {
        const s = (v ?? '').toString().trim();
        // Require at least 8 chars, allow letters, numbers and -/.
        return s.length >= 8 && /^[A-Za-z0-9.-]+$/.test(s);
    };

    // Check whether a phone (digits-only) exists on any org or representative.
    // Optionally exclude a representative by citizenId (useful during edit so the rep can keep their own number).
    const phoneExists = (phone?: string, excludeCitizenId?: string) => {
        if (!phone) return false;
        const p = normalizePhone(phone);
        if (!p) return false;
        // Check organizations
        for (const o of orgs) {
            if (normalizePhone(o.phone) === p) return true;
        }
        // Check representatives
        for (const r of reps) {
            if (excludeCitizenId && normalize(r.citizenId) === normalize(excludeCitizenId)) continue;
            if (normalizePhone(r.phone) === p) return true;
        }
        return false;
    };

    const citizenExists = (citizenId?: string) => {
        if (!citizenId) return false;
        const c = normalize(citizenId);
        return reps.some((r) => normalize(r.citizenId) === c);
    };

    const taxNumberExists = (tn?: string) => {
        if (!tn) return false;
        const t = normalize(tn);
        return orgs.some((o) => normalize(o.taxNumber) === t);
    };

    // Helper to split a free-form address into Street / City / Country
    const parseAddress = (input: string): { street: string; city: string; country: string } => {
        const raw = (input || '').split(',').map((p) => p.trim()).filter(Boolean);
        // Never inject placeholder words like 'Unknown' into the payload/UI
        if (raw.length >= 3) return { street: raw[0], city: raw[1], country: raw[2] };
        if (raw.length === 2) return { street: raw[0], city: raw[1], country: '' };
        if (raw.length === 1 && raw[0]) return { street: raw[0], city: '', country: '' };
        return { street: '', city: '', country: '' };
    };

    // Basic validators mirroring backend rules
    const isValidOrgTaxNumber = (v: string) => {
        const val = v.trim().toUpperCase();
        // Backend accepts: 9-digit NIF starting 1-9, or 2-letter prefix + 8-12 alnum, or 8-15 alnum
        return (/^[1-9][0-9]{8}$/.test(val) || /^[A-Z]{2}[0-9A-Z]{8,12}$/.test(val) || /^[A-Z0-9]{8,15}$/.test(val));
    };
    const isValidPtMobile = (v: string) => /^9\d{8}$/.test(v.trim());
    const isValidEmail = (v: string) => /.+@.+\..+/.test(v.trim());

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
                      taxNumber: o.taxNumber ?? o.TaxNumber ?? o.Tax_Number ?? undefined,
                  }))
                : [];

            // Representatives DTOs expose CitizenId. We use 'citizenId' consistently in the UI.
            const normalizedReps: Representative[] = Array.isArray(repsData)
                ? repsData.map((r: any) => ({
                      id: r.id ?? r.representativeId ?? r.RepresentativeId ?? '',
                      name: r.name ?? r.RepresentativeName ?? r.RepresentativeName ?? '',
                      // Prefer TaxNumber if present on the representative; otherwise fallback to CitizenId
                      citizenId: r.taxNumber ?? r.TaxNumber ?? r.citizenId ?? r.CitizenId ?? '',
                      nationality: r.nationality ?? r.RepresentativeNationality ?? r.RepresentativeNationality ?? '',
                      email: r.email ?? r.RepresentativeEmail ?? r.RepresentativeEmail ?? undefined,
                      phone: r.phone ?? r.RepresentativePhone ?? r.RepresentativePhone ?? undefined,
                      organizationId: r.organizationId ?? r.OrganizationId ?? r.organizationID ?? undefined,
                      organizationName: r.organizationName ?? r.OrganizationName ?? r.organizationName ?? undefined,
                  }))
                : [];

            setOrgs(normalizedOrgs);
            setReps(normalizedReps);
            // Keep minimal logging
            console.debug('Loaded representatives:', normalizedReps.length);
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
    // Organization email and phone are required per request
    // require user to choose nationality (no default)
    const canSubmitOrg: boolean = !!(
        orgName.trim() &&
        orgTaxNumber.trim() &&
        orgEmail.trim() &&
        orgPhone.trim() &&
        repInitName.trim() &&
        repInitNationality.trim() &&
        repInitCitizen.trim() &&
        repInitEmail.trim() &&
        repInitPhone.trim() &&
        !submittingOrg
    );

    const validateOrganizationBeforeSubmit = (): string | null => {
        if (!isValidOrgTaxNumber(orgTaxNumber)) return 'Organization tax number is invalid.';
        if (taxNumberExists(orgTaxNumber)) return 'An organization with this tax number already exists.';
        if (!isValidEmail(orgEmail)) return 'Organization email appears invalid.';
        if (taxNumberExists(orgTaxNumber)) return 'An organization with this tax number already exists.'; // keep fallback (rare)
        if (!isValidPtMobile(orgPhone)) return 'Organization phone must start with 9 and have 9 digits.';
        // Check if org phone exists already in other records
        if (phoneExists(orgPhone)) return 'Organization phone is already associated with another organization or representative.';
        if (!isValidEmail(repInitEmail)) return 'Initial representative email appears invalid.';
        if (!isValidPtMobile(repInitPhone)) return 'Initial representative phone must start with 9 and have 9 digits.';
        // Check if rep phone exists already in other records
        if (phoneExists(repInitPhone)) return 'Initial representative phone is already associated with another organization or representative.';
        // Prevent using the same phone number for both the organization and the initial representative in the same form
        if (normalizePhone(orgPhone) && normalizePhone(repInitPhone) && normalizePhone(orgPhone) === normalizePhone(repInitPhone)) {
            return 'Organization phone and initial representative phone must be different.';
        }
        if (!repInitNationality.trim()) return 'Initial representative nationality is required.';
        if (!isValidCitizenId(repInitCitizen)) return 'Initial representative Citizen ID format is invalid.';
        if (citizenExists(repInitCitizen)) return 'A representative with this Citizen ID already exists.';
        return null;
    };

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmitOrg) return;

        // clear inline email errors before validating
        setOrgEmailError(null);
        setRepInitEmailError(null);

        const clientValidationError = validateOrganizationBeforeSubmit();
        if (clientValidationError) {
            // If it's an email error, set the inline message under the corresponding field(s)
            if (!isValidEmail(orgEmail)) setOrgEmailError('Organization email appears invalid.');
            if (!isValidEmail(repInitEmail)) setRepInitEmailError('Initial representative email appears invalid.');
            setError(clientValidationError);
            return;
        }

        setSubmittingOrg(true);
        setError(null);
        try {
            const addr = parseAddress(orgAddress);
            // Build payload matching backend CreateShippingAgentOrganizationDto
            const payload: any = {
                LegalName: orgName.trim(),
                // AlternativeName is required by the domain; use the same as legal name if not provided
                AlternativeName: orgName.trim(),
                Street: addr.street,
                City: addr.city,
                Country: addr.country,
                Email: orgEmail.trim(),
                Phone: orgPhone.trim(),
                // REQUIRED by backend
                TaxNumber: orgTaxNumber.trim().toUpperCase(),
                Representatives: [
                    {
                        RepresentativeName: repInitName.trim(),
                        CitizenId: repInitCitizen.trim(),
                        // The DTO requires RepresentativeNationality (must be provided by user)
                        RepresentativeNationality: repInitNationality.trim(),
                        RepresentativeEmail: repInitEmail.trim(),
                        RepresentativePhone: repInitPhone.trim(),
                    },
                ],
            };

            await apiService.createShippingAgentOrganization(payload);
            // limpar
            setOrgName('');
            setOrgAddress('');
            setOrgEmail('');
            setOrgPhone('');
            setOrgTaxNumber('');
            setRepInitName('');
            setRepInitCitizen('');
            setRepInitNationality('');
            setRepInitEmail('');
            setRepInitPhone('');
            await fetchAll();
            setView('organizations');
        } catch (e: any) {
            console.error('Organization create error:', e);
            const respData = e?.response?.data;
            const friendly = formatServerValidationError(respData);
            const serverMsg = friendly || e?.message || 'Failed to create organization. Please check the data and try again.';
            setError(serverMsg);
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
        if (!isValidCitizenId(repCitizen)) return 'Citizen ID format is invalid; must have at least 8 alphanumeric characters.';
        // Phone validation: server's tests expect Portuguese mobile numbers starting with '9'
        const phone = repPhone.trim();
        if (!/^[0-9]{8,}$/.test(phone)) return 'Phone must contain at least 8 digits.';
        if (!phone.startsWith('9')) return 'Phone number must start with 9.';
        if (phoneExists(repPhone)) return 'Phone is already associated with another organization or representative.';
        if (citizenExists(repCitizen)) return 'A representative with this Citizen ID already exists.';
        // Email basic check (HTML input also enforces, but double-check)
        if (repEmail.trim() && !isValidEmail(repEmail.trim())) return 'Provided email appears invalid.';
        return null;
    };

    const handleCreateRepresentative = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmitRep) return;
        if (orgNameError) {
            setError(orgNameError);
            return;
        }

        // clear inline email error
        setRepEmailError(null);

        const clientValidationError = validateRepresentativeBeforeSubmit();
        if (clientValidationError) {
            if (repEmail && !isValidEmail(repEmail)) setRepEmailError('Provided email appears invalid.');
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

            // If we have the organization present in `orgs`, include OrganizationId and OrganizationName (controller requires OrganizationName)
            const matchedOrg = orgs.find((o) => normalize(o.name) === normalize(resolvedOrgName as string));
            if (matchedOrg) {
                payload.OrganizationId = matchedOrg.id;
                payload.OrganizationName = matchedOrg.name;
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
            // Try to show server-provided message when available (axios style), friendly English
            console.error('Representative create error:', e);
            const respData = e?.response?.data;
            const friendly = formatServerValidationError(respData);
            const serverMsg = friendly || e?.message || 'Failed to create representative. Please check the data and try again.';
            setError(serverMsg);
        } finally {
            setSubmittingRep(false);
        }
    };

    // Delete representative by citizenId (shown in UI as `rep.citizenId`)
    const handleDeleteRepresentative = async (citizenId: string) => {
        if (!citizenId) {
            setError('This representative has no Citizen ID associated — it cannot be deleted. Please check the data.');
            return;
        }
        // Confirm with the user
        const ok = window.confirm(`Are you sure you want to delete representative with Citizen ID ${citizenId}? This action cannot be undone.`);
        if (!ok) return;

        try {
            console.debug('Attempting delete for citizenId:', citizenId);
            // Backend DELETE expects the CitizenId string in the route
            const identifierToUse = citizenId;
            setDeletingRepId(citizenId);
            const resp = await apiService.deleteShippingAgentRepresentativeByCitizenId(identifierToUse);
            // If the server responded with a non-success code, show it
            if (!resp || typeof resp.status !== 'number' || resp.status < 200 || resp.status >= 300) {
                const msg = `Unexpected server response: ${JSON.stringify(resp)}`;
                console.warn(msg);
                setError(msg);
                return;
            }
            // Optimistically remove the representative from local state so UI updates immediately
            const target = normalize(citizenId?.toString().trim());
            setReps((prev) => prev.filter((r) => normalize(r.citizenId) !== target));
            // Ensure we're on the representatives view so the user sees the updated list
            setView('representatives');
            // Prefer server-provided message when available; format ProblemDetails into friendly text
            const serverFriendly = formatServerValidationError(resp.data);
            const serverMsg = serverFriendly || (resp.data && (resp.data.message || resp.data) ? (resp.data.message ?? String(resp.data)) : `Representative with Citizen ID ${identifierToUse} deleted.`);
            setSuccessMsg(serverMsg as string);
            // Refresh from server to stay in sync (no full reload)
            await fetchAll();
            // Clear success message after a short delay
            window.setTimeout(() => setSuccessMsg(null), 3500);
         } catch (e: any) {
            console.error('Delete representative error caught in UI:', e);
            // If axios error, include response status and data
            if (e?.response) {
                const { status, data } = e.response;
                console.error('Server response on delete error:', status, data);
                const friendly = formatServerValidationError(data);
                setError(friendly || `Failed to delete representative (status ${status}).`);
            } else {
                setError(e?.message ?? 'Failed to delete representative');
            }
         } finally {
             setDeletingRepId(null);
         }
    };

    const validateEditValues = (): string | null => {
         if (!editingValues) return 'No data to save.';
         if (!editingValues.name.trim()) return 'Representative name is required.';
         if (!editingValues.nationality || !editingValues.nationality.trim()) return 'Nationality is required.';
         const phone = (editingValues.phone ?? '').trim();
         if (phone && !/^\d{8,}$/.test(phone)) return 'Phone must contain at least 8 digits.';
         if (phone && !phone.startsWith('9')) return 'Phone number must start with 9.';
        // Ensure phone uniqueness (allowing the rep to keep their own number)
        if (phone && editingCitizenId && phoneExists(phone, editingCitizenId)) return 'Phone is already associated with another organization or representative.';
         if (editingValues.email && editingValues.email.trim() && !/.+@.+\..+/.test(editingValues.email.trim())) return 'Email format looks invalid.';
         return null;
    };

    const startEdit = (rep: Representative) => {
        setEditingCitizenId(rep.citizenId);
        setEditingValues({ name: rep.name ?? '', email: rep.email ?? '', phone: rep.phone ?? '', nationality: rep.nationality ?? '', organizationName: rep.organizationName ?? '' });
        setError(null);
    };

    const cancelEdit = () => {
        setEditingCitizenId(null);
        setEditingValues(null);
        setError(null);
    };

    const handleEditChange = (field: string, value: string) => {
        setEditingValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveEdit = async (citizenId: string) => {
         if (!editingValues) return;
         const validationError = validateEditValues();
         if (validationError) {
             setError(validationError);
             return;
         }

        // Ensure OrganizationName is provided: the backend requires it and it's a common UX mistake to clear it.
        const orgNameTrimmed = (editingValues.organizationName ?? '').toString().trim();
        if (!orgNameTrimmed) {
            setError('Please select an existing organization before saving. If the organization does not exist, create it first.');
            return;
        }

         setSubmittingEdit(true);
         setError(null);
         try {
             // Build DTO matching backend CreateShippingAgentRepresentativeDto used by update
             const dto: any = {
                 RepresentativeName: editingValues.name.trim(),
                 CitizenId: citizenId, // must remain the same
                 // RepresentativeNationality is required in the edit form; use the provided value (no default)
                 RepresentativeNationality: (editingValues.nationality ?? '').trim(),
                 RepresentativeEmail: (editingValues.email ?? '').trim(),
                 RepresentativePhone: (editingValues.phone ?? '').trim(),
                 OrganizationName: orgNameTrimmed,
             };

             const resp = await apiService.updateShippingAgentRepresentativeByCitizenId(citizenId, dto);
             if (!resp || typeof resp.status !== 'number' || resp.status < 200 || resp.status >= 300) {
                 setError(`Unexpected server response: ${JSON.stringify(resp)}`);
                 return;
             }

             // Optimistically update local state
             setReps((prev) => prev.map((r) => (normalize(r.citizenId) === normalize(citizenId) ? { ...r, name: dto.RepresentativeName, email: dto.RepresentativeEmail, phone: dto.RepresentativePhone, nationality: dto.RepresentativeNationality, organizationName: dto.OrganizationName } : r)));
             // Prefer server-provided message when available. Support both string payloads and { message }
             let serverMsg = '';
             try {
                 if (resp && typeof resp.data === 'string') serverMsg = resp.data as string;
                 else if (resp && resp.data && (resp.data.message || resp.data.title)) serverMsg = resp.data.message ?? resp.data.title;
             } catch { serverMsg = ''; }
             if (!serverMsg) serverMsg = `Representative with Citizen ID ${citizenId} updated.`;
             setSuccessMsg(serverMsg as string);
             // Sync with server
             await fetchAll();
             cancelEdit();
             window.setTimeout(() => setSuccessMsg(null), 3500);
         } catch (e: any) {
             console.error('Edit save error:', e);
             const respData = e?.response?.data;
             const friendly = formatServerValidationError(respData);
             const serverMsg = friendly || e?.message || 'Failed to update representative. Please check the data and try again.';
             setError(serverMsg);
         } finally {
             setSubmittingEdit(false);
         }
    };

    // Format server-side validation (ProblemDetails) into friendly Portuguese messages
    const formatServerValidationError = (respData: any): string => {
        if (!respData) return '';
        // ASP.NET ProblemDetails shape: { type, title, status, traceId, errors: { Field: ["msg"] } }
        if (respData.errors && typeof respData.errors === 'object') {
            const parts: string[] = [];
            // Friendly mapping for common fields
            if (respData.errors.OrganizationName) {
                parts.push('Please select an existing organization before submitting.');
            }
            if (respData.errors.CitizenId) {
                parts.push('The provided Citizen ID is invalid.');
            }
            if (respData.errors.RepresentativePhone) {
                parts.push('The phone number is invalid. It must start with 9 and have 9 digits.');
            }
            if (respData.errors.RepresentativeEmail) {
                parts.push('The provided email appears invalid.');
            }
            // Append any remaining messages (generic fallback)
            for (const key of Object.keys(respData.errors)) {
                if (['OrganizationName', 'CitizenId', 'RepresentativePhone', 'RepresentativeEmail'].includes(key)) continue;
                const val = respData.errors[key];
                if (Array.isArray(val)) parts.push(...val.map((v: any) => String(v)));
                else parts.push(String(val));
            }
            if (parts.length) return parts.join(' ');
        }

        if (respData.message) return String(respData.message);
        if (respData.title) return String(respData.title);
        try {
            return typeof respData === 'string' ? respData : JSON.stringify(respData);
        } catch {
            return String(respData);
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
