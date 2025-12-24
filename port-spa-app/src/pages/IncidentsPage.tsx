import React, { useState, useEffect } from 'react';
import {
    PlusCircle,
    Filter,
    RefreshCw,
    Edit2,
    Trash2,
    Search,
    X,
    AlertTriangle,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import * as incidentService from '../services/incidentService';
import type { IncidentFilters, CreateIncidentDto, UpdateIncidentDto } from '../services/incidentService';
import type { Incident, IncidentSeverity } from '../domain/incident/incident.model';
import { incidentTypeService } from '../services/incidentTypeService';
import type { IncidentTypeResponseDto } from '../infrastructure/repositories/incidentType/incidentType.dto';
import ConfirmationModal from '../components/common/ConfirmationModal';

const IncidentsPage: React.FC = () => {
    // Core State
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [incidentTypes, setIncidentTypes] = useState<IncidentTypeResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filter State
    const [filters, setFilters] = useState<IncidentFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Incident | null>(null);
    const [form, setForm] = useState<Partial<CreateIncidentDto>>({
        title: '',
        incidentTypeId: '',
        severity: 'Minor',
        description: '',
        affectedVves: [],
    });

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDeletingId, setSelectedDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [incidentsData, typesData] = await Promise.all([
                incidentService.getIncidents(filters),
                incidentTypeService.getAllIncidentTypes({ tree: false }),
            ]);
            setIncidents(incidentsData);
            setIncidentTypes(typesData as IncidentTypeResponseDto[]);
        } catch (err: any) {
            setError(err?.message || 'Error loading incidents.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload: CreateIncidentDto = {
                title: form.title!,
                incidentTypeId: form.incidentTypeId!,
                severity: form.severity as IncidentSeverity,
                startTime: new Date().toISOString(),
                description: form.description,
                affectedVves: form.affectedVves,
            };

            if (editingItem) {
                const updatePayload: UpdateIncidentDto = {
                    title: form.title,
                    description: form.description,
                    severity: form.severity as IncidentSeverity,
                    affectedVves: form.affectedVves,
                };
                await incidentService.updateIncident(editingItem.incidentId, updatePayload);
                setSuccessMessage('Incident updated successfully');
            } else {
                await incidentService.reportIncident(payload);
                setSuccessMessage('Incident reported successfully');
            }

            await loadData();
            closeModal();
        } catch (err: any) {
            setError(err?.message || 'Error saving incident');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await incidentService.resolveIncident(id);
            setSuccessMessage('Incident resolved successfully');
            await loadData();
        } catch (err: any) {
            setError(err?.message || 'Error resolving incident');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDeletingId) return;
        setLoading(true);
        setError(null);
        try {
            await incidentService.deleteIncident(selectedDeletingId);
            setSuccessMessage('Incident deleted successfully');
            await loadData();
            setIsDeleteModalOpen(false);
            setSelectedDeletingId(null);
        } catch (err: any) {
            setError(err?.message || 'Error deleting incident');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setForm({
            title: '',
            incidentTypeId: '',
            severity: 'Minor',
            description: '',
            affectedVves: [],
        });
        setShowModal(true);
    };

    const openEditModal = (incident: Incident) => {
        setEditingItem(incident);
        setForm({
            title: incident.title,
            incidentTypeId: incident.incidentTypeId,
            severity: incident.severity,
            description: incident.description,
            affectedVves: incident.affectedVves,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setForm({
            title: '',
            incidentTypeId: '',
            severity: 'Minor',
            description: '',
            affectedVves: [],
        });
    };

    const confirmDelete = (id: string) => {
        setSelectedDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const applyFilters = () => {
        loadData();
    };

    const resetFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const getSeverityColor = (severity: IncidentSeverity) => {
        switch (severity) {
            case 'Critical':
                return 'border-red-500 bg-red-50';
            case 'Major':
                return 'border-orange-400 bg-orange-50';
            case 'Minor':
                return 'border-yellow-300 bg-yellow-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    const getSeverityBadge = (severity: IncidentSeverity) => {
        switch (severity) {
            case 'Critical':
                return 'bg-red-100 text-red-800';
            case 'Major':
                return 'bg-orange-100 text-orange-800';
            case 'Minor':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getIncidentTypeName = (typeId: string) => {
        const type = incidentTypes.find(t => t.id === typeId);
        return type?.name || typeId;
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const filteredIncidents = incidents.filter(inc =>
        searchTerm === '' ||
        inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Operational Incidents</h1>
                    <p className="text-gray-500 mt-1">Track and manage port disruptions</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/incident-types"
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Manage Types
                    </a>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm flex items-center gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Report New Incident
                    </button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        {successMessage}
                    </div>
                    <button onClick={() => setSuccessMessage(null)}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                    <button onClick={() => setError(null)}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search & Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search incidents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={filters.status || ''}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                            >
                                <option value="">All</option>
                                <option value="Active">Active</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Severity</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={filters.severity || ''}
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value as any || undefined })}
                            >
                                <option value="">All</option>
                                <option value="Minor">Minor</option>
                                <option value="Major">Major</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2"
                                value={filters.startDate || ''}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2"
                                value={filters.endDate || ''}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                            />
                        </div>
                        <div className="col-span-4 flex gap-2 justify-end">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Reset
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Incidents List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredIncidents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No incidents found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredIncidents.map((incident) => (
                        <div
                            key={incident.incidentId}
                            className={`bg-white p-5 rounded-lg shadow border-l-4 ${getSeverityColor(incident.severity)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{incident.title}</h3>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                incident.status === 'Active'
                                                    ? 'bg-green-100 text-green-800 animate-pulse'
                                                    : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {incident.status}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${getSeverityBadge(incident.severity)}`}>
                                            {incident.severity}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-3">{incident.description}</p>

                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 font-medium">Type:</span>
                                            <p className="text-gray-700">{getIncidentTypeName(incident.incidentTypeId)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-medium">Started:</span>
                                            <p className="text-gray-700">{new Date(incident.startTime).toLocaleString()}</p>
                                        </div>
                                        {incident.endTime && (
                                            <div>
                                                <span className="text-gray-500 font-medium">Ended:</span>
                                                <p className="text-gray-700">{new Date(incident.endTime).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {incident.durationMinutes !== undefined && incident.durationMinutes > 0 && (
                                            <div>
                                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Duration:
                                                </span>
                                                <p className="text-gray-700 font-semibold">{formatDuration(incident.durationMinutes)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {incident.affectedVves && incident.affectedVves.length > 0 && (
                                        <div className="mt-3 text-sm">
                                            <span className="text-gray-500 font-medium">Affected Vessels: </span>
                                            <span className="text-gray-700">{incident.affectedVves.join(', ')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 ml-4">
                                    {incident.status === 'Active' && (
                                        <button
                                            onClick={() => handleResolve(incident.incidentId)}
                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                                            disabled={loading}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Resolve
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openEditModal(incident)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(incident.incidentId)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingItem ? 'Edit Incident' : 'Report New Incident'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="Brief description of the incident"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Incident Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={form.incidentTypeId}
                                        onChange={(e) => setForm({ ...form, incidentTypeId: e.target.value })}
                                    >
                                        <option value="">Select Type...</option>
                                        {incidentTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name} ({type.severity})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Can't find it?{' '}
                                        <a href="/incident-types" className="text-blue-500 hover:underline">
                                            Create new type
                                        </a>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Severity <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={form.severity}
                                        onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
                                    >
                                        <option value="Minor">Minor</option>
                                        <option value="Major">Major</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Detailed description of what happened"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Affected Vessel Visits (Optional)</label>
                                    <input
                                        placeholder="Enter VVE IDs (comma-separated, e.g., VVE-001, VVE-002)"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={form.affectedVves?.join(', ') || ''}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                affectedVves: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : editingItem ? 'Update' : 'Report Incident'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Incident"
                message="Are you sure you want to delete this incident? This action cannot be undone."
                confirmText="Delete"
                isDestructive={true}
                onConfirm={handleDelete}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDeletingId(null);
                }}
            />
        </div>
    );
};

export default IncidentsPage;

