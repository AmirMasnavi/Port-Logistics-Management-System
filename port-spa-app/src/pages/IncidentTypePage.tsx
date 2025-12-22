// typescript
import React, { useState, useEffect, useMemo } from 'react';
import {
    PlusCircle,
    Filter,
    RefreshCw,
    Edit2,
    Trash2,
    Search,
    ChevronRight,
    ChevronDown,
    Layers,
    Info,
    X,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { incidentTypeService, type IncidentTypeFilters } from '../services/incidentTypeService';
import type {
    IncidentTypeResponseDto,
    CreateIncidentTypeDto,
    UpdateIncidentTypeDto
} from '../infrastructure/repositories/incidentType/incidentType.dto';
import ConfirmationModal from '../components/common/ConfirmationModal';

const IncidentTypePage: React.FC = () => {

    // Core State
    const [items, setItems] = useState<IncidentTypeResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Filter & View State
    const [filters, setFilters] = useState<IncidentTypeFilters>({ search: '', severity: undefined });
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDeletingId, setSelectedDeletingId] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<IncidentTypeResponseDto | null>(null);
    const [form, setForm] = useState<CreateIncidentTypeDto>({
        code: '',
        name: '',
        description: '',
        severity: 'Minor',
        parentId: undefined
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Buscamos a lista flat e construímos a árvore no frontend para maior flexibilidade de UI
            const data = await incidentTypeService.getAllIncidentTypes({ ...filters, tree: false });
            setItems(data as IncidentTypeResponseDto[]);
        } catch (err: any) {
            setError(err?.message || 'Error loading incident types catalog.');
        } finally {
            setLoading(false);
        }
    };

    // Estruturação Hierárquica para a Tabela
    const hierarchicalData = useMemo(() => {
        const itemMap = new Map<string, any>();
        const tree: any[] = [];

        items.forEach(item => itemMap.set(item.id, { ...item, children: [] }));

        items.forEach(item => {
            if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId).children.push(itemMap.get(item.id));
            } else {
                tree.push(itemMap.get(item.id));
            }
        });
        return tree;
    }, [items]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload: CreateIncidentTypeDto = {
                code: form.code,
                name: form.name,
                description: form.description,
                severity: form.severity,
                parentId: form.parentId || undefined 
            };
            if (editingItem) {
                await incidentTypeService.updateIncidentType(editingItem.id, payload);
                setSuccessMessage('Incident type updated successfully.');
            } else {
                await incidentTypeService.createIncidentType(payload);
                setSuccessMessage('New incident type created successfully.');
            }

            setShowModal(false);
            loadData();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            // O erro 400 agora será detalhado aqui
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // handleDelete espera um id; quando usado pelo modal chamamos via wrapper
    const handleDelete = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await incidentTypeService.deleteIncidentType(id);
            setSuccessMessage('Type deleted successfully.');
            await loadData();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err?.message || 'Delete failed.');
        } finally {
            setLoading(false);
            setIsDeleteModalOpen(false);
            setSelectedDeletingId(null);
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedIds(newExpanded);
    };

    const getSeverityBadge = (severity: string) => {
        const classes = {
            Critical: 'bg-red-100 text-red-800 border-red-200',
            Major: 'bg-orange-100 text-orange-800 border-orange-200',
            Minor: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${classes[severity as keyof typeof classes] || 'bg-gray-100'}`}>{severity}</span>;
    };

    // Componente Recursivo de Linha
    const RenderTreeItem = ({ item, level = 0 }: { item: any; level: number }) => (
        <React.Fragment key={item.id}>
            <tr className={`group hover:bg-blue-50/50 transition-colors ${level > 0 ? 'bg-gray-50/40' : ''}`}>
                <td className="px-6 py-4">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 2}rem` }}>
                        <div className="w-6 flex-shrink-0">
                            {item.children?.length > 0 && (
                                <button onClick={() => toggleExpand(item.id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                    {expandedIds.has(item.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-tighter">{item.code}</span>
                            <span className="font-semibold text-gray-900">{item.name}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">{getSeverityBadge(item.severity)}</td>
                <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate" title={item.description}>
                        {item.description || <span className="text-gray-400 italic">{item.description}</span>}
                    </p>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => { setEditingItem(item); setForm({ ...form, ...item } as any); setShowModal(true); }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-200 shadow-sm transition-all"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setSelectedDeletingId(item.id);
                                setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-200 shadow-sm transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            </tr>
            {expandedIds.has(item.id) && item.children?.map((child: any) => (
                <RenderTreeItem key={child.id} item={child} level={level + 1} />
            ))}
        </React.Fragment>
    );

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Page Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-4 tracking-tight">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
                            <Layers size={32} />
                        </div>
                        Incident Catalog
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Standardized taxonomy of operational disruptions and alerts</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-5 py-2.5 border-2 rounded-xl font-bold transition-all ${showFilters ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                        <Filter size={18} /> Filters
                    </button>
                    <button
                        onClick={() => { setEditingItem(null); setForm({ code: '', name: '', description: '', severity: 'Minor', parentId: undefined }); setShowModal(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5"
                    >
                        <PlusCircle size={20} /> Create New Type
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-4">
                    <AlertTriangle size={20} className="flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={20}/></button>
                </div>
            )}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-100 rounded-2xl flex items-center gap-3 text-green-700 animate-in slide-in-from-top-4">
                    <CheckCircle2 size={20} className="flex-shrink-0" />
                    <p className="font-medium">{successMessage}</p>
                </div>
            )}

            {/* Search & Filter Bar */}
            {showFilters && (
                <div className="mb-8 p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-5 relative">
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Search Catalog</label>
                        <Search className="absolute left-4 top-[2.6rem] text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Type code or name..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none"
                            value={filters.search}
                            onChange={e => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <div className="md:col-span-4">
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Severity Level</label>
                        <select
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none appearance-none"
                            value={filters.severity || ''}
                            onChange={e => setFilters({...filters, severity: e.target.value as any || undefined})}
                        >
                            <option value="">All Severities</option>
                            <option value="Minor">Minor</option>
                            <option value="Major">Major</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <button
                            onClick={loadData}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            Apply View
                        </button>
                    </div>
                </div>
            )}

            {/* Catalog Table */}
            <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-2xl shadow-gray-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 border-b-2 border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Incident Category & Code</th>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Severity</th>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Scope / Description</th>
                            <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Management</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {hierarchicalData.length > 0 ? (
                            hierarchicalData.map(item => <RenderTreeItem key={item.id} item={item} level={0} />)
                        ) : (
                            !loading && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <Info size={64} className="opacity-10" />
                                            <div>
                                                <p className="text-xl font-bold text-gray-500">No types found</p>
                                                <p className="text-sm">Try adjusting your filters or create a new entry.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )
                        )}
                        </tbody>
                    </table>
                </div>
                {loading && (
                    <div className="p-8 flex justify-center border-t border-gray-50">
                        <RefreshCw className="animate-spin text-blue-600" size={32} />
                    </div>
                )}
            </div>

            {/* Management Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20">
                        <div className="px-8 py-6 border-b-2 border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {editingItem ? 'Update Definition' : 'Define New Incident'}
                                </h2>
                                <p className="text-sm text-gray-500 font-medium italic">Configure classification parameters</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Reference Code</label>
                                    <input
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none font-mono font-bold"
                                        placeholder="e.g. T-INC001"
                                        value={form.code}
                                        onChange={e => setForm({...form, code: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Initial Severity</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none"
                                        value={form.severity}
                                        onChange={e => setForm({...form, severity: e.target.value as any})}
                                    >
                                        <option value="Minor">Minor</option>
                                        <option value="Major">Major</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Display Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none text-lg font-bold"
                                    placeholder="e.g. Equipment Failure"
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Parent Group (Hierarchy)</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none"
                                    value={form.parentId || ''}
                                    onChange={e => setForm({...form, parentId: e.target.value || undefined})}
                                >
                                    <option value="">Top Level Category (No Parent)</option>
                                    {items.filter(i => i.id !== editingItem?.id).map(i => (
                                        <option key={i.id} value={i.id}>{i.name} [{i.code}]</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400 ml-1 italic italic">Groups incidents like "Fog" under "Environmental Conditions"</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Detailed Description</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none h-28 resize-none text-sm"
                                    placeholder="Define the scope and operational impact..."
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {loading && <RefreshCw className="animate-spin" size={18} />}
                                    {editingItem ? 'Commit Changes' : 'Publish Type'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* --- MODALS --- */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDeletingId(null);
                }}
                onConfirm={async () => {
                    if (!selectedDeletingId) return;
                    await handleDelete(selectedDeletingId);
                }}
                title="Delete Incident Type"
                message="Are you sure you want to delete this plan? This action cannot be undone."
                confirmText="Delete Plan"
            />
        </div>
    );
};

export default IncidentTypePage;