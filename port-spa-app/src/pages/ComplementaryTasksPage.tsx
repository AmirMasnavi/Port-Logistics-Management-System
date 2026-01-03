import React, { useEffect, useState } from 'react';
import {
    PlusCircle,
    Filter,
    RefreshCw,
    Edit2,
    Trash2,
    Search,
    X,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    PlayCircle,
    CheckCircle,
    Ban,
} from 'lucide-react';

import * as taskService from '../services/complementaryTasksService';
import * as categoryService from '../services/complementaryTaskCategoriesService';
import type {
    ComplementaryTaskFilters,
    CreateComplementaryTaskDto,
    UpdateComplementaryTaskDto,
} from '../services/complementaryTasksService';

import ConfirmationModal from '../components/common/ConfirmationModal';
import type { ComplementaryTask } from '../domain/complementaryTasks/complementaryTasks.model';
import type { ComplementaryTaskCategory } from '../domain/complementaryTaskCategories/complementaryTaskCategories.model';

const STATUS_OPTIONS = ['PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;
type TaskStatus = typeof STATUS_OPTIONS[number];

const ComplementaryTasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<ComplementaryTask[]>([]);
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [filters, setFilters] = useState<ComplementaryTaskFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ComplementaryTask | null>(null);
    const [form, setForm] = useState<Partial<CreateComplementaryTaskDto>>({
        categoryId: '',
        vveId: '',
        description: '',
        responsibleTeam: '',
        startTime: '',
        endTime: null,
        status: 'PENDING',
        suspendsOperations: false,
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDeletingId, setSelectedDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        loadCategories();
    }, []); // Only load on mount, filters apply when "Apply Filters" is clicked

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Convert datetime-local strings to ISO format for API
            const apiFilters = { ...filters };
            if (apiFilters.startTimeFrom) {
                apiFilters.startTimeFrom = new Date(apiFilters.startTimeFrom).toISOString();
            }
            if (apiFilters.startTimeTo) {
                apiFilters.startTimeTo = new Date(apiFilters.startTimeTo).toISOString();
            }
            
            const items = await taskService.getComplementaryTasks(apiFilters);
            setTasks(items as ComplementaryTask[]);
        } catch (err: any) {
            setError(err?.message || 'Error loading tasks.');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            // Load ALL categories (including inactive) for display purposes
            // Active filtering will be done in the dropdown
            const items = await categoryService.getComplementaryTaskCategories();
            setCategories(items as ComplementaryTaskCategory[]);
        } catch (err: any) {
            console.error('Error loading categories:', err);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setForm({
            categoryId: '',
            vveId: '',
            description: '',
            responsibleTeam: '',
            startTime: localDateTime,
            endTime: null,
            status: 'PENDING',
            suspendsOperations: false,
        });
        setShowModal(true);
    };

    const openEditModal = (task: ComplementaryTask) => {
        setEditingItem(task);
        setForm({
            categoryId: task.categoryId,
            vveId: task.vveId,
            description: task.description || '',
            responsibleTeam: task.responsibleTeam,
            startTime: task.startTime ? new Date(task.startTime).toISOString().slice(0, 16) : '',
            endTime: task.endTime ? new Date(task.endTime).toISOString().slice(0, 16) : null,
            status: task.status,
            suspendsOperations: task.suspendsOperations,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (editingItem) {
                const payload: UpdateComplementaryTaskDto = {
                    categoryId: form.categoryId,
                    description: form.description?.trim(),
                    responsibleTeam: form.responsibleTeam!.trim(),
                    startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
                    endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
                    status: form.status,
                    suspendsOperations: form.suspendsOperations,
                };
                console.log('[Update Task] Payload:', payload);
                await taskService.updateComplementaryTask(editingItem.taskId, payload);
                setSuccessMessage('Task updated successfully');
            } else {
                const payload: CreateComplementaryTaskDto = {
                    categoryId: form.categoryId!.trim(),
                    vveId: form.vveId!.trim(),
                    description: form.description?.trim() || '',
                    responsibleTeam: form.responsibleTeam!.trim(),
                    startTime: new Date(form.startTime!).toISOString(),
                    endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
                    status: form.status,
                    suspendsOperations: form.suspendsOperations ?? false,
                };
                console.log('[Create Task] Payload:', payload);
                await taskService.createComplementaryTask(payload);
                setSuccessMessage('Task created successfully');
            }

            await loadCategories(); // Reload categories to ensure we have latest data
            await loadData();
            closeModal();
        } catch (err: any) {
            console.error('[ComplementaryTask Save] Error:', err);
            const msg = err?.response?.data?.message || err?.message || 'Error saving task';
            setError(`Failed to save task: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedDeletingId) return;
        setLoading(true);
        setError(null);
        try {
            await taskService.deleteComplementaryTask(selectedDeletingId);
            setSuccessMessage('Task deleted successfully');
            await loadData();
        } catch (err: any) {
            setError(err?.message || 'Error deleting task');
        } finally {
            setLoading(false);
            setIsDeleteModalOpen(false);
            setSelectedDeletingId(null);
        }
    };

    const applyFilters = () => {
        loadData();
        setShowFilters(false);
    };

    const resetFilters = () => {
        setFilters({});
        setSearchTerm('');
        setShowFilters(false);
    };

    const formatDateTime = (dateStr?: string | null): string => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return 'Invalid date';
        }
    };

    const formatDuration = (minutes?: number | null): string => {
        if (minutes === null || minutes === undefined || minutes === 0) return 'N/A';
        const m = Math.floor(Number(minutes));
        if (isNaN(m)) return 'N/A';
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const getStatusBadge = (status: TaskStatus) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            ONGOING: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-gray-200 text-gray-600',
        };

        const icons = {
            PENDING: Clock,
            ONGOING: PlayCircle,
            COMPLETED: CheckCircle,
            CANCELLED: Ban,
        };

        const Icon = icons[status];

        return (
            <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${styles[status]}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    const getCategoryName = (categoryId: string): string => {
        const cat = categories.find(c => c.categoryId === categoryId);
        return cat ? cat.name : categoryId;
    };

    // Client-side filtering (search)
    const filteredTasks = tasks
        .filter((t) => {
            const q = searchTerm.trim().toLowerCase();
            return (
                q === '' ||
                t.taskId.toLowerCase().includes(q) ||
                t.vveId.toLowerCase().includes(q) ||
                t.responsibleTeam.toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q) ||
                getCategoryName(t.categoryId).toLowerCase().includes(q)
            );
        });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Complementary Tasks</h1>
                    <p className="text-gray-500 mt-1">
                        Manage non-cargo activities during vessel visits (inspections, cleaning, maintenance)
                    </p>
                </div>

                <div>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm flex items-center gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Messages */}
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
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={loadData}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={filters.categoryId || ''}
                                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.categoryId} value={cat.categoryId}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={filters.status || ''}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus || undefined })}
                            >
                                <option value="">All Statuses</option>
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Suspends Operations</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={
                                    filters.suspendsOperations === undefined
                                        ? ''
                                        : filters.suspendsOperations
                                            ? 'true'
                                            : 'false'
                                }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFilters({
                                        ...filters,
                                        suspendsOperations: v === '' ? undefined : v === 'true',
                                    });
                                }}
                            >
                                <option value="">All</option>
                                <option value="true">Yes (Impacting)</option>
                                <option value="false">No (Parallel)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Responsible Team</label>
                            <input
                                className="w-full border rounded-lg p-2"
                                value={filters.responsibleTeam || ''}
                                onChange={(e) => setFilters({ ...filters, responsibleTeam: e.target.value || undefined })}
                                placeholder="Safety Team, Maintenance..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date From</label>
                            <input
                                type="datetime-local"
                                className="w-full border rounded-lg p-2"
                                value={filters.startTimeFrom || ''}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        startTimeFrom: e.target.value || undefined,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date To</label>
                            <input
                                type="datetime-local"
                                className="w-full border rounded-lg p-2"
                                value={filters.startTimeTo || ''}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        startTimeTo: e.target.value || undefined,
                                    })
                                }
                            />
                        </div>

                        <div className="md:col-span-4 flex gap-2 justify-end">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Clear
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

            {/* Tasks list */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">No tasks found</p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {filteredTasks.map((task) => {
                        const isImpacting = task.status === 'ONGOING' && task.suspendsOperations;
                        return (
                            <div
                                key={task.taskId}
                                data-testid="complementary-task-card"
                                className={`bg-white p-6 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow ${
                                    isImpacting ? 'border-red-500 bg-red-50' : 'border-blue-500'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                                            <h3 className="font-bold text-xl text-gray-800">
                                                {getCategoryName(task.categoryId)}
                                            </h3>
                                            <span className="text-xs px-3 py-1 rounded-full font-mono bg-gray-100 text-gray-800">
                                                {task.taskId}
                                            </span>
                                            {getStatusBadge(task.status)}
                                            {isImpacting && (
                                                <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    IMPACTING OPERATIONS
                                                </span>
                                            )}
                                            {task.suspendsOperations && (
                                                <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                                                    Suspends Ops
                                                </span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                            <div>
                                                <span className="text-gray-500 font-medium">VVE:</span>
                                                <p className="text-gray-800 font-semibold">{task.vveId}</p>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Responsible Team:</span>
                                                <p className="text-gray-800 font-semibold">{task.responsibleTeam}</p>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    Duration:
                                                </span>
                                                <p className="text-gray-800 font-semibold">
                                                    {formatDuration(task.durationMinutes)}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">Created:</span>
                                                <p className="text-gray-700 text-xs">
                                                    {formatDateTime(task.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 font-medium">Start Time:</span>
                                                <p className="text-gray-800">{formatDateTime(task.startTime)}</p>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 font-medium">End Time:</span>
                                                <p className="text-gray-800">{formatDateTime(task.endTime)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            data-testid={`edit-task-${task.taskId}`}
                                            onClick={() => openEditModal(task)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            data-testid={`delete-task-${task.taskId}`}
                                            onClick={() => confirmDelete(task.taskId)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingItem ? 'Edit Task' : 'New Task'}
                        </h2>

                        <form onSubmit={handleSave}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={form.categoryId}
                                            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                        >
                                            <option value="">Select a category</option>
                                            {categories
                                                .filter(cat => cat.isActive || (editingItem && cat.categoryId === editingItem.categoryId))
                                                .map((cat) => (
                                                    <option key={cat.categoryId} value={cat.categoryId}>
                                                        {cat.name} {!cat.isActive ? ' (Inactive)' : ''}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            VVE ID <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            disabled={!!editingItem}
                                            className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${editingItem ? 'bg-gray-100' : ''}`}
                                            value={form.vveId}
                                            onChange={(e) => setForm({ ...form, vveId: e.target.value })}
                                            placeholder="e.g. VVE-2026-001"
                                        />
                                        {editingItem && (
                                            <p className="text-xs text-gray-500 mt-1">VVE ID cannot be changed</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Responsible Team <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.responsibleTeam}
                                        onChange={(e) => setForm({ ...form, responsibleTeam: e.target.value })}
                                        placeholder="e.g. Safety Team, Maintenance Crew"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description of the task..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Start Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="datetime-local"
                                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={form.startTime}
                                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">End Time</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={form.endTime || ''}
                                            onChange={(e) => setForm({ ...form, endTime: e.target.value || null })}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Optional - set when task is completed
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                                        >
                                            {STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center pt-6">
                                        <input
                                            type="checkbox"
                                            id="suspendsOperations"
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            checked={form.suspendsOperations}
                                            onChange={(e) =>
                                                setForm({ ...form, suspendsOperations: e.target.checked })
                                            }
                                        />
                                        <label htmlFor="suspendsOperations" className="ml-3 text-sm font-medium">
                                            Suspends cargo operations
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                    <p className="font-medium mb-1">Note:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>If "Suspends cargo operations" is checked, this task will block cargo handling</li>
                                        <li>Otherwise, the task runs in parallel with cargo operations</li>
                                        <li>Set status to COMPLETED and add End Time when task is finished</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : editingItem ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
};

export default ComplementaryTasksPage;

