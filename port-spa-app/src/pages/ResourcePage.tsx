import React, { useEffect, useMemo, useState } from 'react';
import { apiClient, getResources, getAllStorageAreas } from '../services/apiService';
import type { Resource } from '../domain/resource/resource.model';
import type { StorageArea } from '../domain/storageArea/storageArea.model';
import { Search, SlidersHorizontal, Plus, Pencil, RefreshCw } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';

// Simple enums mirroring backend (ResourceKind, ResourceStatus)
const RESOURCE_KINDS = ['Crane', 'Truck', 'Other'] as const;
// Backend statuses: Active, Inactive, UnderMaintenance
// We map them to UI buckets: Available, Busy, OutOfService
const RESOURCE_STATUSES = ['Active', 'Inactive', 'UnderMaintenance'] as const;

type ResourceKindType = (typeof RESOURCE_KINDS)[number];
type ResourceStatusType = (typeof RESOURCE_STATUSES)[number];

interface CreateResourceFormState {
    description: string;
    kind: ResourceKindType | '';
    assignedArea: string;
    status: ResourceStatusType | '';
    setupTimeMinutes: number | '';
    operationalWindowStart: string; // "HH:mm"
    operationalWindowEnd: string;   // "HH:mm"
    qualificationRequirementsText: string; // comma-separated for simplicity
    averageContainersPerHour?: number | '';
    containersPerTrip?: number | '';
    averageSpeedKmh?: number | '';
    otherUnit?: string;
    otherGenericValue?: number | '';
}

const initialFormState: CreateResourceFormState = {
    description: '',
    kind: '',
    assignedArea: '',
    status: '',
    setupTimeMinutes: '',
    operationalWindowStart: '08:00',
    operationalWindowEnd: '18:00',
    qualificationRequirementsText: '',
    averageContainersPerHour: '',
    containersPerTrip: '',
    averageSpeedKmh: '',
    otherUnit: '',
    otherGenericValue: '',
};

const ResourcePage: React.FC = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Storage areas for dropdown
    const [storageAreas, setStorageAreas] = useState<StorageArea[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);

    // Filters
    const [filterQuery, setFilterQuery] = useState('');
    const [filterKind, setFilterKind] = useState<ResourceKindType | ''>('');
    const [filterStatus, setFilterStatus] = useState<ResourceStatusType | ''>('');

    // Create form
    const [form, setForm] = useState<CreateResourceFormState>(initialFormState);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Edit form
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<CreateResourceFormState>(initialFormState);
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Update status
    const [statusResource, setStatusResource] = useState<Resource | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<ResourceStatusType | ''>('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    const loadResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getResources();
            setResources(data);
        } catch (err: any) {
            console.error('Failed to fetch resources', err);
            setError('Failed to fetch resources. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const loadStorageAreas = async () => {
        setLoadingAreas(true);
        try {
            const data = await getAllStorageAreas();
            setStorageAreas(data);
        } catch (err: any) {
            console.error('Failed to fetch storage areas', err);
            // Non-blocking error - user can still create resources without area
        } finally {
            setLoadingAreas(false);
        }
    };

    useEffect(() => {
        loadResources();
        loadStorageAreas();
    }, []);

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError(null);
        setSuccessMessage(null);

        // Basic client-side validation aligned with backend rules
        if (!form.kind) {
            setCreateError('Kind is required.');
            setCreating(false);
            return;
        }
        if (!form.status) {
            setCreateError('Status is required.');
            setCreating(false);
            return;
        }
        if (form.setupTimeMinutes === '' || Number(form.setupTimeMinutes) < 0) {
            setCreateError('Setup time must be a non-negative number.');
            setCreating(false);
            return;
        }
        if (!form.operationalWindowStart || !form.operationalWindowEnd) {
            setCreateError('Operational window start and end are required.');
            setCreating(false);
            return;
        }

        // Capacity-specific validations
        if (form.kind === 'Crane') {
            if (form.averageContainersPerHour === '' || form.averageContainersPerHour == null) {
                setCreateError('Average containers per hour is required for Crane resources.');
                setCreating(false);
                return;
            }
        } else if (form.kind === 'Truck') {
            if (form.containersPerTrip === '' || form.containersPerTrip == null) {
                setCreateError('Containers per trip is required for Truck resources.');
                setCreating(false);
                return;
            }
            if (form.averageSpeedKmh === '' || form.averageSpeedKmh == null) {
                setCreateError('Average speed (km/h) is required for Truck resources.');
                setCreating(false);
                return;
            }
        } else if (form.kind === 'Other') {
            if (!form.otherUnit || form.otherGenericValue === '' || form.otherGenericValue == null) {
                setCreateError('Other unit and value are required for Other resources.');
                setCreating(false);
                return;
            }
        }

        try {
            const qualificationRequirements = form.qualificationRequirementsText
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            // Ensure backend-friendly TimeOnly format (HH:mm:ss)
            const start = form.operationalWindowStart.length === 5
                ? form.operationalWindowStart + ':00'
                : form.operationalWindowStart;
            const end = form.operationalWindowEnd.length === 5
                ? form.operationalWindowEnd + ':00'
                : form.operationalWindowEnd;

            const payload: any = {
                description: form.description,
                kind: form.kind,
                assignedArea: form.assignedArea || null,
                status: form.status,
                setupTimeMinutes: Number(form.setupTimeMinutes),
                operationalWindowStart: start,
                operationalWindowEnd: end,
                qualificationRequirements: qualificationRequirements.length > 0 ? qualificationRequirements : null,
                averageContainersPerHour:
                    form.kind === 'Crane' ? Number(form.averageContainersPerHour) : null,
                containersPerTrip:
                    form.kind === 'Truck' ? Number(form.containersPerTrip) : null,
                averageSpeedKmh:
                    form.kind === 'Truck' ? Number(form.averageSpeedKmh) : null,
                otherUnit: form.kind === 'Other' ? form.otherUnit : null,
                otherGenericValue: form.kind === 'Other' ? Number(form.otherGenericValue) : null,
            };

            await apiClient.post<Resource>('/Resource', payload);
            setSuccessMessage('Resource created successfully.');
            setForm(initialFormState);
            setIsCreateModalOpen(false);
            await loadResources();
        } catch (err: any) {
            console.error('Failed to create resource', err);
            // Attempt to extract backend error message
            const msg = err?.response?.data?.message || err?.response?.data || 'Failed to create resource.';
            if (typeof msg === 'string') {
                setCreateError(msg);
            } else {
                setCreateError('Failed to create resource.');
            }
        } finally {
            setCreating(false);
        }
    };


    const openEditModal = (resource: Resource) => {
        setEditingResource(resource);
        // Parse time strings (remove seconds if present)
        const startTime = resource.operationalWindowStart.substring(0, 5);
        const endTime = resource.operationalWindowEnd.substring(0, 5);
        
        setEditForm({
            description: resource.description,
            kind: resource.kind as ResourceKindType,
            assignedArea: resource.assignedArea || '',
            status: resource.status as ResourceStatusType,
            setupTimeMinutes: resource.setupTimeMinutes,
            operationalWindowStart: startTime,
            operationalWindowEnd: endTime,
            qualificationRequirementsText: resource.qualificationRequirements?.join(', ') || '',
            averageContainersPerHour: resource.averageContainersPerHour ?? '',
            containersPerTrip: resource.containersPerTrip ?? '',
            averageSpeedKmh: resource.averageSpeedKmh ?? '',
            otherUnit: resource.otherUnit || '',
            otherGenericValue: resource.otherGenericValue ?? '',
        });
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResource) return;
        
        setEditing(true);
        setEditError(null);
        setSuccessMessage(null);

        // Same validation as create
        if (!editForm.kind) {
            setEditError('Kind is required.');
            setEditing(false);
            return;
        }
        if (!editForm.status) {
            setEditError('Status is required.');
            setEditing(false);
            return;
        }
        if (editForm.setupTimeMinutes === '' || Number(editForm.setupTimeMinutes) < 0) {
            setEditError('Setup time must be a non-negative number.');
            setEditing(false);
            return;
        }
        if (!editForm.operationalWindowStart || !editForm.operationalWindowEnd) {
            setEditError('Operational window start and end are required.');
            setEditing(false);
            return;
        }

        // Capacity-specific validations
        if (editForm.kind === 'Crane') {
            if (editForm.averageContainersPerHour === '' || editForm.averageContainersPerHour == null) {
                setEditError('Average containers per hour is required for Crane resources.');
                setEditing(false);
                return;
            }
        } else if (editForm.kind === 'Truck') {
            if (editForm.containersPerTrip === '' || editForm.containersPerTrip == null) {
                setEditError('Containers per trip is required for Truck resources.');
                setEditing(false);
                return;
            }
            if (editForm.averageSpeedKmh === '' || editForm.averageSpeedKmh == null) {
                setEditError('Average speed (km/h) is required for Truck resources.');
                setEditing(false);
                return;
            }
        } else if (editForm.kind === 'Other') {
            if (!editForm.otherUnit || editForm.otherGenericValue === '' || editForm.otherGenericValue == null) {
                setEditError('Other unit and value are required for Other resources.');
                setEditing(false);
                return;
            }
        }

        try {
            const qualificationRequirements = editForm.qualificationRequirementsText
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const start = editForm.operationalWindowStart.length === 5
                ? editForm.operationalWindowStart + ':00'
                : editForm.operationalWindowStart;
            const end = editForm.operationalWindowEnd.length === 5
                ? editForm.operationalWindowEnd + ':00'
                : editForm.operationalWindowEnd;

            const payload: any = {
                description: editForm.description,
                kind: editForm.kind,
                assignedArea: editForm.assignedArea || null,
                status: editForm.status,
                setupTimeMinutes: Number(editForm.setupTimeMinutes),
                operationalWindowStart: start,
                operationalWindowEnd: end,
                qualificationRequirements: qualificationRequirements.length > 0 ? qualificationRequirements : null,
                averageContainersPerHour:
                    editForm.kind === 'Crane' ? Number(editForm.averageContainersPerHour) : null,
                containersPerTrip:
                    editForm.kind === 'Truck' ? Number(editForm.containersPerTrip) : null,
                averageSpeedKmh:
                    editForm.kind === 'Truck' ? Number(editForm.averageSpeedKmh) : null,
                otherUnit: editForm.kind === 'Other' ? editForm.otherUnit : null,
                otherGenericValue: editForm.kind === 'Other' ? Number(editForm.otherGenericValue) : null,
            };

            await apiClient.put<Resource>(`/Resource/${editingResource.code}`, payload);
            setSuccessMessage('Resource updated successfully.');
            setIsEditModalOpen(false);
            setEditingResource(null);
            await loadResources();
        } catch (err: any) {
            console.error('Failed to update resource', err);
            const msg = err?.response?.data?.message || err?.response?.data || 'Failed to update resource.';
            if (typeof msg === 'string') {
                setEditError(msg);
            } else {
                setEditError('Failed to update resource.');
            }
        } finally {
            setEditing(false);
        }
    };

    const openStatusModal = (resource: Resource) => {
        setStatusResource(resource);
        setNewStatus(resource.status as ResourceStatusType);
        setStatusError(null);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusResource || !newStatus) return;
        
        setUpdatingStatus(true);
        setStatusError(null);
        setSuccessMessage(null);

        try {
            await apiClient.patch(`/Resource/${statusResource.code}/status`, { NewStatus: newStatus });
            setSuccessMessage('Resource status updated successfully.');
            setIsStatusModalOpen(false);
            setStatusResource(null);
            await loadResources();
        } catch (err: any) {
            console.error('Failed to update status', err);
            const msg = err?.response?.data?.message || err?.response?.data || 'Failed to update status.';
            if (typeof msg === 'string') {
                setStatusError(msg);
            } else {
                setStatusError('Failed to update status.');
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    // --- Derived stats & filtered list (like VesselVisitsPage) ---
    const filteredResources = useMemo(() => {
        return resources.filter(r => {
            const q = filterQuery.toLowerCase();
            const matchesQuery =
                !q ||
                r.description.toLowerCase().includes(q) ||
                r.assignedArea?.toLowerCase().includes(q);
            const matchesKind = !filterKind || r.kind === filterKind;
            const matchesStatus = !filterStatus || r.status === filterStatus;
            return matchesQuery && matchesKind && matchesStatus;
        });
    }, [resources, filterQuery, filterKind, filterStatus]);

    const stats = useMemo(() => {
        // Map domain statuses into UI buckets
        let available = 0;
        let busy = 0;
        let outOfService = 0;

        for (const r of resources) {
            if (r.status === 'Active') {
                busy++;
            } else if (r.status === 'Inactive') {
                available++;
            } else if (r.status === 'UnderMaintenance') {
                outOfService++;
            }
        }

        return {
            total: resources.length,
            available,
            busy,
            outOfService,
        };
    }, [resources]);

    return (
        <div className="container mx-auto">
            {/* Header and primary actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Port Resources</h1>
                    <p className="text-gray-600 mt-1">
                        Manage cranes, trucks and other operational resources used in the port.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setForm(initialFormState);
                        setCreateError(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maritime-600 hover:bg-maritime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Resource
                </button>
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Resources"
                    value={stats.total}
                    description="All registered resources in the system."
                />
                <StatCard
                    title="Available"
                    value={stats.available}
                    description="Ready to be assigned."
                />
                <StatCard
                    title="Busy"
                    value={stats.busy}
                    description="Currently in operation."
                />
                <StatCard
                    title="Out of Service"
                    value={stats.outOfService}
                    description="Unavailable or under maintenance."
                />
            </div>

            {/* Search / filter bar similar to VesselVisits */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by description or assigned area..."
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as ResourceStatusType | '')}
                            className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                            <option value="">All statuses</option>
                            {RESOURCE_STATUSES.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={filterKind}
                        onChange={e => setFilterKind(e.target.value as ResourceKindType | '')}
                        className="pr-4 py-3 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="">All kinds</option>
                        {RESOURCE_KINDS.map(k => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <p className="text-sm text-gray-500 mb-4">Loading resources...</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {successMessage && <p className="text-sm text-green-600 mb-4">{successMessage}</p>}

            {/* Cards panel */}
            <section className="lg:col-span-2">
                {filteredResources.length === 0 ? (
                    <p className="text-sm text-gray-500">No resources match the current filters.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredResources.map(r => (
                            <article
                                key={r.code}
                                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {r.description}
                                            </h3>
                                            {/* Code intentionally hidden from UI for security/privacy reasons */}
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {r.kind}
                                        </span>
                                    </div>

                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <div>
                                            <span className="font-medium">Status:</span> {r.status}
                                        </div>
                                        <div>
                                            <span className="font-medium">Assigned area:</span>{' '}
                                            {r.assignedArea ?? '—'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Description:</span>{' '}
                                            {r.description || '—'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Setup Time:</span>{' '}
                                            {r.setupTimeMinutes} min
                                        </div>
                                    </div>

                                    {r.qualificationRequirements && r.qualificationRequirements.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">Qualifications:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {r.qualificationRequirements.map(q => (
                                                    <span
                                                        key={q}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700"
                                                    >
                                                        {q}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => openEditModal(r)}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-500 shadow-sm text-xs font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => openStatusModal(r)}
                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-500 shadow-sm text-xs font-medium rounded-md text-green-600 bg-white hover:bg-green-50 hover:border-green-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                        Status
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Create Resource Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Resource"
                showFooter={false}
            >
                <form onSubmit={handleCreate} className="space-y-6 max-h-[75vh] overflow-y-auto">
                    {createError && <p className="mb-2 text-sm text-red-600">{createError}</p>}

                    {/* Basic info (code removed, backend-generated) */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                value={form.description}
                                onChange={handleFormChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 text-sm"
                                placeholder="e.g. STS crane at North dock"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
                                <select
                                    name="kind"
                                    value={form.kind}
                                    onChange={handleFormChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 text-sm"
                                >
                                    <option value="">Select kind</option>
                                    {RESOURCE_KINDS.map(k => (
                                        <option key={k} value={k}>
                                            {k}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 text-sm"
                                >
                                    <option value="">Select status</option>
                                    {RESOURCE_STATUSES.map(s => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Assignment & time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Area</label>
                            <select
                                name="assignedArea"
                                value={form.assignedArea}
                                onChange={handleFormChange}
                                disabled={loadingAreas}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            >
                                <option value="">Select storage area (optional)</option>
                                {storageAreas.map(area => (
                                    <option key={area.code} value={area.code}>
                                        {area.code} - {area.type}
                                    </option>
                                ))}
                            </select>
                            {loadingAreas && (
                                <p className="mt-1 text-xs text-gray-500">Loading storage areas...</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Setup Time (min)</label>
                            <input
                                type="number"
                                name="setupTimeMinutes"
                                value={form.setupTimeMinutes}
                                onChange={handleFormChange}
                                min={0}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operational Start</label>
                            <input
                                type="time"
                                name="operationalWindowStart"
                                value={form.operationalWindowStart}
                                onChange={handleFormChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operational End</label>
                            <input
                                type="time"
                                name="operationalWindowEnd"
                                value={form.operationalWindowEnd}
                                onChange={handleFormChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Qualifications */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                        <input
                            type="text"
                            name="qualificationRequirementsText"
                            value={form.qualificationRequirementsText}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            placeholder="Comma separated, e.g. CraneOperator, SafetyCert"
                        />
                    </div>

                    {/* Capacity fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avg containers/hour (Crane)</label>
                            <input
                                type="number"
                                name="averageContainersPerHour"
                                value={form.averageContainersPerHour}
                                onChange={handleFormChange}
                                min={0}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Containers/trip (Truck)</label>
                            <input
                                type="number"
                                name="containersPerTrip"
                                value={form.containersPerTrip}
                                onChange={handleFormChange}
                                min={0}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avg speed (km/h, Truck)</label>
                            <input
                                type="number"
                                name="averageSpeedKmh"
                                value={form.averageSpeedKmh}
                                onChange={handleFormChange}
                                min={0}
                                step="0.1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Other capacity</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="otherGenericValue"
                                    value={form.otherGenericValue}
                                    onChange={handleFormChange}
                                    min={0}
                                    step="0.1"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                                    placeholder="Value"
                                />
                                <input
                                    type="text"
                                    name="otherUnit"
                                    value={form.otherUnit}
                                    onChange={handleFormChange}
                                    className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                                    placeholder="Unit"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={creating}
                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maritime-600 hover:bg-maritime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500 disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create Resource'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Resource Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Resource"
                showFooter={false}
            >
                <form onSubmit={handleEdit} className="space-y-6 max-h-[75vh] overflow-y-auto">
                    {editError && <p className="mb-2 text-sm text-red-600">{editError}</p>}

                    {/* Basic info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                value={editForm.description}
                                onChange={handleEditFormChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 text-sm"
                                placeholder="e.g. STS crane at North dock"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
                                <select
                                    name="kind"
                                    value={editForm.kind}
                                    onChange={handleEditFormChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 text-sm"
                                >
                                    <option value="">Select kind</option>
                                    {RESOURCE_KINDS.map(k => (
                                        <option key={k} value={k}>
                                            {k}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={editForm.status}
                                    onChange={handleEditFormChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 text-sm"
                                >
                                    <option value="">Select status</option>
                                    {RESOURCE_STATUSES.map(s => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Assignment & time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Area</label>
                            <select
                                name="assignedArea"
                                value={editForm.assignedArea}
                                onChange={handleEditFormChange}
                                disabled={loadingAreas}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            >
                                <option value="">Select storage area (optional)</option>
                                {storageAreas.map(area => (
                                    <option key={area.code} value={area.code}>
                                        {area.code} - {area.type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Setup Time (min)</label>
                            <input
                                type="number"
                                name="setupTimeMinutes"
                                value={editForm.setupTimeMinutes}
                                onChange={handleEditFormChange}
                                min={0}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operational Start</label>
                            <input
                                type="time"
                                name="operationalWindowStart"
                                value={editForm.operationalWindowStart}
                                onChange={handleEditFormChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operational End</label>
                            <input
                                type="time"
                                name="operationalWindowEnd"
                                value={editForm.operationalWindowEnd}
                                onChange={handleEditFormChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Qualifications */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                        <input
                            type="text"
                            name="qualificationRequirementsText"
                            value={editForm.qualificationRequirementsText}
                            onChange={handleEditFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            placeholder="Comma separated, e.g. CraneOperator, SafetyCert"
                        />
                    </div>

                    {/* Capacity fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avg containers/hour (Crane)</label>
                            <input
                                type="number"
                                name="averageContainersPerHour"
                                value={editForm.averageContainersPerHour}
                                onChange={handleEditFormChange}
                                min={0}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Containers/trip (Truck)</label>
                            <input
                                type="number"
                                name="containersPerTrip"
                                value={editForm.containersPerTrip}
                                onChange={handleEditFormChange}
                                min={0}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avg speed (km/h, Truck)</label>
                            <input
                                type="number"
                                name="averageSpeedKmh"
                                value={editForm.averageSpeedKmh}
                                onChange={handleEditFormChange}
                                min={0}
                                step="0.1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Other capacity</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="otherGenericValue"
                                    value={editForm.otherGenericValue}
                                    onChange={handleEditFormChange}
                                    min={0}
                                    step="0.1"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                                    placeholder="Value"
                                />
                                <input
                                    type="text"
                                    name="otherUnit"
                                    value={editForm.otherUnit}
                                    onChange={handleEditFormChange}
                                    className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                                    placeholder="Unit"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editing}
                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maritime-600 hover:bg-maritime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500 disabled:opacity-50"
                        >
                            {editing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Update Status Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title="Update Resource Status"
                showFooter={false}
            >
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                    {statusError && <p className="mb-2 text-sm text-red-600">{statusError}</p>}
                    
                    {statusResource && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Updating status for: <span className="font-semibold">{statusResource.description}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                                Current status: {statusResource.status}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as ResourceStatusType)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-maritime-500 focus:ring-maritime-500 sm:text-sm"
                        >
                            <option value="">Select status</option>
                            {RESOURCE_STATUSES.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsStatusModalOpen(false)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updatingStatus}
                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-maritime-600 hover:bg-maritime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-500 disabled:opacity-50"
                        >
                            {updatingStatus ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ResourcePage;
