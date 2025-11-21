import { useEffect, useMemo, useState } from 'react';
import { shippingAgentApiRepository } from '../../infrastructure/repositories/shippingAgent/shippingAgentApi.repository';
import { ShippingAgentService } from '../../app/shippingAgent/shippingAgent.service';
import type { CreateShippingAgentOrganizationDto, CreateShippingAgentRepresentativeDto, UpdateShippingAgentRepresentativeDto } from '../../infrastructure/repositories/shippingAgent/shippingAgent.dto';

const service = new ShippingAgentService(shippingAgentApiRepository);

// Default sample values (can be overridden by user afterwards)
const DEFAULT_ORG_FORM = {
  orgName: 'Atlantic Maritime Logistics',
  orgAddress: 'Rua do Porto 123, Porto, Portugal',
  orgEmail: 'contact@atlantic-maritime.example',
  orgPhone: '912345678',
  orgTaxNumber: '501234567',
  repInitName: 'João Silva',
  // corrigido CitizenId default (removidos hífens) para formato simples válido
  repInitCitizen: 'AB12345678',
  repInitNationality: 'Portuguese',
  repInitEmail: 'joao.silva@atlantic-maritime.example',
  repInitPhone: '923456789'
};
const DEFAULT_REP_FORM = {
  repName: 'Maria Santos',
  // corrigido CitizenId default secundário
  repCitizen: 'CD23456789',
  repNationality: 'Portuguese',
  repEmail: 'maria.santos@atlantic-maritime.example',
  repPhone: '934567890',
  repOrgName: 'Atlantic Maritime Logistics'
};

// Helper normalizers (kept local; some validation logic is in service but uniqueness requires current state)
const normalize = (s?: string) => {
  const str = (s ?? '').toString().normalize('NFD');
  try { return str.replace(/\p{Diacritic}/gu, '').trim().toLowerCase(); } catch { return str.replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
};
const normalizePhone = (p?: string) => (p ?? '').toString().replace(/\D/g, '').trim();

export const useShippingAgentsPageController = () => {
  // Data
  const [orgs, setOrgs] = useState<any[]>([]); // fallback to any[] to avoid TS property issues
  const [reps, setReps] = useState<any[]>([]);
  // UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [view, setView] = useState<'organizations' | 'representatives'>('organizations');
  const [query, setQuery] = useState('');

  // Org form state
  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgTaxNumber, setOrgTaxNumber] = useState('');
  const [repInitName, setRepInitName] = useState('');
  const [repInitCitizen, setRepInitCitizen] = useState('');
  const [repInitNationality, setRepInitNationality] = useState('');
  const [repInitEmail, setRepInitEmail] = useState('');
  const [repInitPhone, setRepInitPhone] = useState('');
  const [submittingOrg, setSubmittingOrg] = useState(false);
  const [orgEmailError, setOrgEmailError] = useState<string | null>(null);
  const [repInitEmailError, setRepInitEmailError] = useState<string | null>(null);

  // Representative creation form (isolated)
  const [repName, setRepName] = useState('');
  const [repCitizen, setRepCitizen] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repNationality, setRepNationality] = useState('');
  const [repOrgName, setRepOrgName] = useState('');
  const [repEmailError, setRepEmailError] = useState<string | null>(null);
  const [submittingRep, setSubmittingRep] = useState(false);
  const [deletingRepId, setDeletingRepId] = useState<string | null>(null);

  // Edit representative
  const [editingCitizenId, setEditingCitizenId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ name: string; email?: string; phone?: string; nationality?: string; organizationName?: string } | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Fetch all data
  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const { organizations, representatives } = await service.fetchAll();
      setOrgs(organizations);
      setReps(representatives);
      (globalThis as any).shippingAgentCache = { orgs: organizations, reps: representatives };
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch data. Please try again later.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // Uniqueness helpers
  const phoneExists = (phone?: string, excludeCitizenId?: string) => {
    if (!phone) return false;
    const p = normalizePhone(phone);
    if (!p) return false;
    for (const o of orgs) if (normalizePhone(o.phone) === p) return true;
    for (const r of reps) {
      if (excludeCitizenId && normalize(r.citizenId) === normalize(excludeCitizenId)) continue;
      if (normalizePhone(r.phone) === p) return true;
    }
    return false;
  };
  const citizenExists = (citizenId?: string) => {
    if (!citizenId) return false; const c = normalize(citizenId); return reps.some(r => normalize(r.citizenId) === c);
  };
  const taxNumberExists = (tn?: string) => { if (!tn) return false; const t = normalize(tn); return orgs.some(o => normalize(o.taxNumber) === t); };

  const parseAddress = (input: string): { street: string; city: string; country: string } => {
    const raw = (input || '').split(',').map(p => p.trim()).filter(Boolean);
    if (raw.length >= 3) return { street: raw[0], city: raw[1], country: raw[2] };
    if (raw.length === 2) return { street: raw[0], city: raw[1], country: '' };
    if (raw.length === 1 && raw[0]) return { street: raw[0], city: '', country: '' };
    return { street: '', city: '', country: '' };
  };

  // Service-level validators reused for UI gating
  const isValidOrgTaxNumber = (v: string) => service.isValidOrgTaxNumber(v);
  const isValidPtMobile = (v: string) => service.isValidPtMobile(v);
  const isValidEmail = (v: string) => service.isValidEmail(v);
  const isValidCitizenId = (v: string) => service.isValidCitizenId(v);

  const canSubmitOrg: boolean = !!(
    orgName.trim() && orgTaxNumber.trim() && orgEmail.trim() && orgPhone.trim() && repInitName.trim() && repInitNationality.trim() && repInitCitizen.trim() && repInitEmail.trim() && repInitPhone.trim() && !submittingOrg
  );

  const validateOrganizationBeforeSubmit = (): string | null => {
    if (!isValidOrgTaxNumber(orgTaxNumber)) return 'Organization tax number is invalid.';
    if (taxNumberExists(orgTaxNumber)) return 'An organization with this tax number already exists.';
    if (!isValidEmail(orgEmail)) return 'Organization email appears invalid.';
    if (!isValidPtMobile(orgPhone)) return 'Organization phone must start with 9 and have 9 digits.';
    if (phoneExists(orgPhone)) return 'Organization phone is already associated with another organization or representative.';
    if (!isValidEmail(repInitEmail)) return 'Initial representative email appears invalid.';
    if (!isValidPtMobile(repInitPhone)) return 'Initial representative phone must start with 9 and have 9 digits.';
    if (phoneExists(repInitPhone)) return 'Initial representative phone is already associated with another organization or representative.';
    if (normalizePhone(orgPhone) === normalizePhone(repInitPhone)) return 'Organization phone and initial representative phone must be different.';
    if (!repInitNationality.trim()) return 'Initial representative nationality is required.';
    if (!isValidCitizenId(repInitCitizen)) return 'Initial representative Citizen ID format is invalid.';
    if (citizenExists(repInitCitizen)) return 'A representative with this Citizen ID already exists.';
    return null;
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canSubmitOrg) return;
    setOrgEmailError(null); setRepInitEmailError(null); setError(null);
    const clientErr = validateOrganizationBeforeSubmit(); if (clientErr) { if (!isValidEmail(orgEmail)) setOrgEmailError('Organization email appears invalid.'); if (!isValidEmail(repInitEmail)) setRepInitEmailError('Initial representative email appears invalid.'); setError(clientErr); return; }
    setSubmittingOrg(true);
    try {
      const addr = parseAddress(orgAddress);
      const payload: CreateShippingAgentOrganizationDto = {
        LegalName: orgName.trim(),
        AlternativeName: orgName.trim(),
        Street: addr.street,
        City: addr.city,
        Country: addr.country,
        Email: orgEmail.trim(),
        Phone: orgPhone.trim(),
        TaxNumber: orgTaxNumber.trim().toUpperCase(),
        Representatives: [
          {
            RepresentativeName: repInitName.trim(),
            CitizenId: repInitCitizen.trim(),
            RepresentativeNationality: repInitNationality.trim(),
            RepresentativeEmail: repInitEmail.trim(),
            RepresentativePhone: repInitPhone.trim(),
          }
        ]
      };
      await service.createOrganization(payload);
      setOrgName(''); setOrgAddress(''); setOrgEmail(''); setOrgPhone(''); setOrgTaxNumber(''); setRepInitName(''); setRepInitCitizen(''); setRepInitNationality(''); setRepInitEmail(''); setRepInitPhone('');
      await fetchAll(); setView('organizations');
    } catch (e: any) {
      const msg = mapServerError(e) || e?.message || 'Failed to create organization. Please check the data and try again.'; setError(msg);
    } finally { setSubmittingOrg(false); }
  };

  // Representative creation
  const canSubmitRep: boolean = !!(repName.trim() && repCitizen.trim() && repNationality.trim() && repEmail.trim() && repPhone.trim() && repOrgName.trim() && !submittingRep);

  const { resolvedOrgName, orgNameError } = useMemo(() => {
    const input = repOrgName.trim(); if (!input) return { resolvedOrgName: null as string | null, orgNameError: null as string | null };
    const normalizedInput = normalize(input);
    const orgMatches = orgs.filter(o => normalize(o.name) === normalizedInput);
    if (orgMatches.length === 1) return { resolvedOrgName: orgMatches[0].name, orgNameError: null };
    if (orgMatches.length > 1) return { resolvedOrgName: null, orgNameError: 'Organization name is ambiguous. Please select an exact match.' };
    const repOrgNames = Array.from(new Set(reps.map(r => r.organizationName).filter(Boolean))) as string[];
    const repMatches = repOrgNames.filter(n => normalize(n) === normalizedInput);
    if (repMatches.length === 1) return { resolvedOrgName: repMatches[0], orgNameError: null };
    if (repMatches.length > 1) return { resolvedOrgName: null, orgNameError: 'Organization name is ambiguous. Please select an exact match.' };
    return { resolvedOrgName: null, orgNameError: 'Organization name not found. Please pick an existing one.' };
  }, [repOrgName, orgs, reps]);

  const validateRepresentativeBeforeSubmit = (): string | null => {
    if (!isValidCitizenId(repCitizen)) return 'Citizen ID format is invalid; must have at least 8 alphanumeric characters.';
    const phone = repPhone.trim(); if (!/^\d{8,}$/.test(phone)) return 'Phone must contain at least 8 digits.'; if (!phone.startsWith('9')) return 'Phone number must start with 9.';
    if (phoneExists(repPhone)) return 'Phone is already associated with another organization or representative.';
    if (citizenExists(repCitizen)) return 'A representative with this Citizen ID already exists.';
    if (repEmail.trim() && !isValidEmail(repEmail.trim())) return 'Provided email appears invalid.';
    return null;
  };

  const handleCreateRepresentative = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canSubmitRep) return; if (orgNameError) { setError(orgNameError); return; }
    setRepEmailError(null); setError(null);
    const clientErr = validateRepresentativeBeforeSubmit(); if (clientErr) { if (repEmail && !isValidEmail(repEmail)) setRepEmailError('Provided email appears invalid.'); setError(clientErr); return; }
    setSubmittingRep(true);
    try {
      const payload: CreateShippingAgentRepresentativeDto = {
        RepresentativeName: repName.trim(),
        CitizenId: repCitizen.trim(),
        RepresentativeNationality: repNationality.trim(),
        RepresentativeEmail: repEmail.trim(),
        RepresentativePhone: repPhone.trim(),
        OrganizationName: resolvedOrgName as string,
      };
      const matchedOrg = orgs.find(o => normalize(o.name) === normalize(resolvedOrgName as string));
      if (matchedOrg) { payload.OrganizationId = matchedOrg.id; }
      await service.createRepresentative(payload);
      setRepName(''); setRepCitizen(''); setRepEmail(''); setRepPhone(''); setRepNationality(''); setRepOrgName('');
      await fetchAll(); setView('representatives');
    } catch (e: any) {
      const msg = mapServerError(e) || e?.message || 'Failed to create representative. Please check the data and try again.'; setError(msg);
    } finally { setSubmittingRep(false); }
  };

  // Delete representative
  const handleDeleteRepresentative = async (citizenId: string) => {
    if (!citizenId) { setError('This representative has no Citizen ID associated — it cannot be deleted.'); return; }
    const ok = window.confirm(`Are you sure you want to delete representative with Citizen ID ${citizenId}? This action cannot be undone.`); if (!ok) return;
    try {
      setDeletingRepId(citizenId); await service.deleteRepresentative(citizenId);
      const target = normalize(citizenId.toString().trim());
      setReps(prev => prev.filter(r => normalize(r.citizenId) !== target)); setView('representatives');
      setSuccessMsg(`Representative with Citizen ID ${citizenId} deleted.`); await fetchAll(); window.setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      const msg = mapServerError(e) || e?.message || 'Failed to delete representative'; setError(msg);
    } finally { setDeletingRepId(null); }
  };

  // Editing representative
  const validateEditValues = (): string | null => {
    if (!editingValues) return 'No data to save.';
    if (!editingValues.name.trim()) return 'Representative name is required.';
    if (!editingValues.nationality || !editingValues.nationality.trim()) return 'Nationality is required.';
    const phone = (editingValues.phone ?? '').trim();
    if (phone && !/^\d{8,}$/.test(phone)) return 'Phone must contain at least 8 digits.';
    if (phone && !phone.startsWith('9')) return 'Phone number must start with 9.';
    if (phone && editingCitizenId && phoneExists(phone, editingCitizenId)) return 'Phone is already associated with another organization or representative.';
    if (editingValues.email && editingValues.email.trim() && !/.+@.+\..+/.test(editingValues.email.trim())) return 'Email format looks invalid.';
    return null;
  };

  const startEdit = (rep: any) => {
    // @ts-ignore dynamic props from API normalization
    setEditingCitizenId(rep.citizenId);
    // @ts-ignore dynamic props from API normalization
    setEditingValues({ name: rep.name ?? '', email: rep.email ?? '', phone: rep.phone ?? '', nationality: rep.nationality ?? '', organizationName: rep.organizationName ?? '' });
    setError(null);
  };
  const cancelEdit = () => { setEditingCitizenId(null); setEditingValues(null); setError(null); };
  const handleEditChange = (field: string, value: string) => { setEditingValues(prev => (prev ? { ...prev, [field]: value } : prev)); };

  const saveEdit = async (citizenId: string) => {
    if (!editingValues) return; const validationError = validateEditValues(); if (validationError) { setError(validationError); return; }
    const orgNameTrimmed = (editingValues.organizationName ?? '').toString().trim(); if (!orgNameTrimmed) { setError('Please select an existing organization before saving. If the organization does not exist, create it first.'); return; }
    setSubmittingEdit(true); setError(null);
    try {
      const dto: UpdateShippingAgentRepresentativeDto = {
        RepresentativeName: editingValues.name.trim(),
        CitizenId: citizenId,
        RepresentativeNationality: (editingValues.nationality ?? '').trim(),
        RepresentativeEmail: (editingValues.email ?? '').trim(),
        RepresentativePhone: (editingValues.phone ?? '').trim(),
        OrganizationName: orgNameTrimmed,
      };
      const matchedOrg = orgs.find(o => normalize(o.name) === normalize(orgNameTrimmed)); if (matchedOrg) dto.OrganizationId = matchedOrg.id;
      await service.updateRepresentative(citizenId, dto);
      // @ts-ignore dynamic props
      setReps(prev => prev.map(r => normalize(r.citizenId) === normalize(citizenId) ? { ...r, name: dto.RepresentativeName, email: dto.RepresentativeEmail, phone: dto.RepresentativePhone, nationality: dto.RepresentativeNationality, organizationName: dto.OrganizationName } : r));
      setSuccessMsg(`Representative with Citizen ID ${citizenId} updated.`); await fetchAll(); cancelEdit(); window.setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      const msg = mapServerError(e) || e?.message || 'Failed to update representative. Please check the data and try again.'; setError(msg);
    } finally { setSubmittingEdit(false); }
  };

  // Apply & reset helpers for default sample data
  const applyOrgDefaults = () => {
    setOrgName(DEFAULT_ORG_FORM.orgName);
    setOrgAddress(DEFAULT_ORG_FORM.orgAddress);
    setOrgEmail(DEFAULT_ORG_FORM.orgEmail); setOrgEmailError(null);
    setOrgPhone(DEFAULT_ORG_FORM.orgPhone);
    setOrgTaxNumber(DEFAULT_ORG_FORM.orgTaxNumber);
    setRepInitName(DEFAULT_ORG_FORM.repInitName);
    setRepInitCitizen(DEFAULT_ORG_FORM.repInitCitizen);
    setRepInitNationality(DEFAULT_ORG_FORM.repInitNationality);
    setRepInitEmail(DEFAULT_ORG_FORM.repInitEmail); setRepInitEmailError(null);
    setRepInitPhone(DEFAULT_ORG_FORM.repInitPhone);
  };
  const resetOrgForm = () => {
    setOrgName(''); setOrgAddress(''); setOrgEmail(''); setOrgPhone(''); setOrgTaxNumber('');
    setRepInitName(''); setRepInitCitizen(''); setRepInitNationality(''); setRepInitEmail(''); setRepInitPhone('');
    setOrgEmailError(null); setRepInitEmailError(null); setError(null);
  };
  const applyRepDefaults = () => {
    setRepName(DEFAULT_REP_FORM.repName);
    setRepCitizen(DEFAULT_REP_FORM.repCitizen);
    setRepNationality(DEFAULT_REP_FORM.repNationality);
    setRepEmail(DEFAULT_REP_FORM.repEmail); setRepEmailError(null);
    setRepPhone(DEFAULT_REP_FORM.repPhone);
    setRepOrgName(DEFAULT_REP_FORM.repOrgName);
  };
  const resetRepForm = () => {
    setRepName(''); setRepCitizen(''); setRepNationality(''); setRepEmail(''); setRepPhone(''); setRepOrgName('');
    setRepEmailError(null); setError(null);
  };

  // Filtering
  const filteredOrgs = useMemo(() => {
    const q = normalize(query);
    return orgs.filter(o => normalize(o.name).includes(q) || normalize(o.address).includes(q) || normalize(o.email).includes(q) || normalize(o.phone).includes(q));
  }, [orgs, query]);
  const filteredReps = useMemo(() => {
    const q = normalize(query);
    return reps.filter(r => normalize(r.name).includes(q) || normalize(r.citizenId).includes(q) || normalize(r.organizationName).includes(q) || normalize(r.organizationId).includes(q) || normalize(r.email).includes(q) || normalize(r.phone).includes(q));
  }, [reps, query]);

  // Map server-side ProblemDetails or validation errors to friendly messages
  const mapServerError = (resp: any): string => {
    const data = resp?.response?.data ?? resp?.data ?? resp; if (!data) return '';
    if (data.errors && typeof data.errors === 'object') {
      const parts: string[] = [];
      if (data.errors.OrganizationName) parts.push('Please select an existing organization before submitting.');
      if (data.errors.CitizenId) parts.push('The provided Citizen ID is invalid.');
      if (data.errors.RepresentativePhone) parts.push('The phone number is invalid. It must start with 9 and have 9 digits.');
      if (data.errors.RepresentativeEmail) parts.push('The provided email appears invalid.');
      for (const key of Object.keys(data.errors)) {
        if (['OrganizationName','CitizenId','RepresentativePhone','RepresentativeEmail'].includes(key)) continue;
        const val = data.errors[key]; if (Array.isArray(val)) parts.push(...val.map((v:any)=>String(v))); else parts.push(String(val));
      }
      if (parts.length) return parts.join(' ');
    }
    if (data.message) return String(data.message);
    if (data.title) return String(data.title);
    try { return typeof data === 'string' ? data : JSON.stringify(data); } catch { return String(data); }
  };

  return {
    // state exposed (matching original names for minimal page diff)
    orgs, reps, loading, error, successMsg, view, query,
    orgName, orgAddress, orgEmail, orgPhone, orgTaxNumber,
    repInitName, repInitCitizen, repInitNationality, repInitEmail, repInitPhone,
    submittingOrg, orgEmailError, repInitEmailError, repEmailError,
    repName, repCitizen, repEmail, repPhone, repNationality, repOrgName,
    submittingRep, deletingRepId, editingCitizenId, editingValues, submittingEdit,
    canSubmitOrg, canSubmitRep, orgNameError, resolvedOrgName,
    filteredOrgs, filteredReps,

    // setters & handlers
    setView, setQuery,
    setOrgName, setOrgAddress, setOrgEmail, setOrgPhone, setOrgTaxNumber,
    setRepInitName, setRepInitCitizen, setRepInitNationality, setRepInitEmail, setRepInitPhone,
    setRepName, setRepCitizen, setRepEmail, setRepPhone, setRepNationality, setRepOrgName,
    setOrgEmailError, setRepInitEmailError, setRepEmailError,
    startEdit, cancelEdit, handleEditChange, saveEdit,
    handleCreateOrganization, handleCreateRepresentative, handleDeleteRepresentative,
    // Utilities maybe needed by page (original kept)
    isValidEmail, isValidPtMobile,
    // New helpers exposed to UI
    applyOrgDefaults, resetOrgForm, applyRepDefaults, resetRepForm,
  };
};
