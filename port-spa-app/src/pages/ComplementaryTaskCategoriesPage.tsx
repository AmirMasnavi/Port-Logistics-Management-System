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
    AlertTriangle,
    Clock,
} from 'lucide-react';
import * as categoryService from '../services/complementaryTaskCategoriesService';
import type {
    ComplementaryTaskCategoryFilters,
    CreateComplementaryTaskCategoryDto,
    UpdateComplementaryTaskCategoryDto,
} from '../services/complementaryTaskCategoriesService';
import ConfirmationModal from '../components/common/ConfirmationModal';
import type {
    ComplementaryTaskCategory
} from "../domain/complementaryTaskCategories/complementaryTaskCategories.model.ts";

const ComplementaryTaskCategoriesPage: React.FC = () => {
    // Core state
    const [categories, setCategories] = useState<ComplementaryTaskCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filters
    const [filters, setFilters] = useState<ComplementaryTaskCategoryFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ComplementaryTaskCategory | null>(null);
    const [form, setForm] = useState<Partial<CreateComplementaryTaskCategoryDto>>({
        code: '',
        name: '',
        description: '',
        defaultDurationMinutes: undefined,
        expectedImpactMinutes: undefined,
        isActive: true,
    });

    // Delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDeletingId, setSelectedDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const items = await categoryService.getComplementaryTaskCategories(filters);
            setCategories(items as ComplementaryTaskCategory[]);
        } catch (err: any) {
            setError(err?.message || 'Error loading categories.');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setForm({
            code: '',
            name: '',
            description: '',
            defaultDurationMinutes: undefined,
            expectedImpactMinutes: undefined,
            isActive: true,
        });
        setShowModal(true);
    };

    const openEditModal = (cat: ComplementaryTaskCategory) => {
        setEditingItem(cat);
        setForm({
            code: cat.code, // presentation only, code is not updated on PATCH
            name: cat.name,
            description: cat.description || '',
            defaultDurationMinutes: cat.defaultDurationMinutes ?? undefined,
            expectedImpactMinutes: cat.expectedImpactMinutes ?? undefined,
            isActive: cat.isActive,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setForm({
            code: '',
            name: '',
            description: '',
            defaultDurationMinutes: undefined,
            expectedImpactMinutes: undefined,
            isActive: true,
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null)

        if (!editingItem && categories.some(c => c.code === form.code)) {
            setError(`The code ${form.code} already exists in the catalog.`);
            setLoading(false);
            return;
        }
        
        try {
            if (editingItem) {
                const payload: UpdateComplementaryTaskCategoryDto = {
                    name: form.name,
                    description: form.description,
                    defaultDurationMinutes: form.defaultDurationMinutes,
                    expectedImpactMinutes: form.expectedImpactMinutes,
                    isActive: form.isActive,
                };
                await categoryService.updateComplementaryTaskCategory(editingItem.categoryId, payload);
                setSuccessMessage('Category updated successfully');
            } else {
                const payload: CreateComplementaryTaskCategoryDto = {
                    code: form.code!.toUpperCase().trim(), 
                    name: form.name!,
                    description: form.description || '',
                    defaultDurationMinutes: form.defaultDurationMinutes ?? undefined,
                    expectedImpactMinutes: form.expectedImpactMinutes ?? undefined,
                    isActive: form.isActive ?? true,
                };
                await categoryService.createComplementaryTaskCategory(payload);
                setSuccessMessage('Category created successfully');
            }
            setSuccessMessage('Category saved successfully');
            await loadData();
            closeModal();
        } catch (err: any) {
            const msg = err.response?.status === 409 ? "Conflict: Unique code already in use." : (err?.message || 'Error saving category');
            setError(msg);
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
            await categoryService.deleteComplementaryTaskCategory(selectedDeletingId);
            setSuccessMessage('Category deleted successfully');
            await loadData();
            setIsDeleteModalOpen(false);
            setSelectedDeletingId(null);
        } catch (err: any) {
            setError(err?.message || 'Error deleting category');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        loadData();
    };

    const resetFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const formatDuration = (minutes?: number | null) => {
        if (minutes === null || minutes === undefined) return 'N/A';
        const m = Number(minutes);
        if (Number.isNaN(m)) return 'N/A';
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const filteredCategories = categories.filter((c) => {
        const q = searchTerm.trim().toLowerCase();
        if (q === '') return true;
        return (
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Complementary Task Categories</h1>
                    <p className="text-gray-500 mt-1">Classify non\-cargo\-related activities for consistent logging</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm flex items-center gap-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        New Category
                    </button>
                </div>
            </div>

            {/* Success/Error */}
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
                            placeholder="Search categories..."
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

                {showFilters && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Code \(exact\)</label>
                            <input
                                className="w-full border rounded-lg p-2"
                                value={filters.code || ''}
                                onChange={(e) => setFilters({ ...filters, code: e.target.value || undefined })}
                                placeholder="CTC001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Name contains</label>
                            <input
                                className="w-full border rounded-lg p-2"
                                value={filters.nameContains || ''}
                                onChange={(e) => setFilters({ ...filters, nameContains: e.target.value || undefined })}
                                placeholder="Security, Cleaning..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Active</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={filters.active === undefined ? '' : filters.active ? 'true' : 'false'}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFilters({
                                        ...filters,
                                        active: v === '' ? undefined : v === 'true',
                                    });
                                }}
                            >
                                <option value="">All</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Min expected impact \(min\)</label>
                            <input
                                type="number"
                                min={0}
                                className="w-full border rounded-lg p-2"
                                value={filters.minImpactMinutes ?? ''}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        minImpactMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Max expected impact \(min\)</label>
                            <input
                                type="number"
                                min={0}
                                className="w-full border rounded-lg p-2"
                                value={filters.maxImpactMinutes ?? ''}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        maxImpactMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                        <div className="col-span-5 flex gap-2 justify-end">
                            <button onClick={resetFilters} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Clear
                            </button>
                            <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No categories found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredCategories.map((cat) => (
                        <div key={cat.categoryId} className="bg-white p-5 rounded-lg shadow border-l-4 border-gray-300">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{cat.name}</h3>
                                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800 font-mono">
                                            {cat.code}
                                        </span>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-3">{cat.description}</p>

                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Default duration:
                                            </span>
                                            <p className="text-gray-700 font-semibold">{formatDuration(cat.defaultDurationMinutes)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expected impact:
                                            </span>
                                            <p className="text-gray-700 font-semibold">{formatDuration(cat.expectedImpactMinutes)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-medium">Created at:</span>
                                            <p className="text-gray-700">
                                                {cat.createdAt ? new Date(cat.createdAt).toLocaleString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => openEditModal(cat)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(cat.categoryId)}
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
                        <h2 className="text-2xl font-bold mb-4">{editingItem ? 'Edit Category' : 'New Category'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="space-y-4">
                                {!editingItem && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Unique code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                                            placeholder="Ex.: CTC001"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            The code must be unique and cannot be changed later.
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex.: Security Check, Hull Maintenance"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description of the task context"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Default duration (min)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                            value={form.defaultDurationMinutes ?? ''}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    defaultDurationMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                                                })
                                            }
                                            placeholder="Ex.: 60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Expected impact \(min, optional\)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                            value={form.expectedImpactMinutes ?? ''}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    expectedImpactMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                                                })
                                            }
                                            placeholder="Ex.: 60"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Active</label>
                                    <select
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        value={form.isActive ? 'true' : 'false'}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>
                                    {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone."
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

export default ComplementaryTaskCategoriesPage;