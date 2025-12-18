import React, { useState, useEffect } from 'react';
import { schedulingService } from '../services/schedulingService';
import type { OperationPlan } from '../services/schedulingService';
import type { ScheduledTask } from '../types/scheduling.types';


export const OperationPlanPage: React.FC = () => {

    // --- STATE ---
    // State para o Histórico
    const [history, setHistory] = useState<OperationPlan[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // State para os Filtros
    const [filterDate, setFilterDate] = useState('');
    const [filterVesselImo, setFilterVesselImo] = useState('');

    // State para o Modal de Eliminar
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    
    // State para controlar qual plano está expandido (mostrar detalhes)
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

    // --- EDIT STATE ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
    const [editForm, setEditForm] = useState({
        resourceId: '',
        staffId: '',
        startTime: '',
        endTime: '',
        reason: ''
    });

    // --- SELECTION DATA STATE ---
    const [availableResources, setAvailableResources] = useState<any[]>([]);
    const [availableStaff, setAvailableStaff] = useState<any[]>([]);
    const [loadingSelectionData, setLoadingSelectionData] = useState(false);

    // --- ACTIONS ---

    // Função de fetch atualizada para receber filtros e usá-los no serviço
    const fetchHistory = async (date: string = filterDate) => {
        setLoadingHistory(true);
        try {
            // Chama o serviço com o objeto de filtros
            const data = await schedulingService.getOperationPlans({ date });
            console.log('[OperationPlanPage] Received plans:', data);
            if (data.length > 0) {
                console.log('[OperationPlanPage] First plan scheduledTasks:', data[0].scheduledTasks);
                if (data[0].scheduledTasks && data[0].scheduledTasks.length > 0) {
                    console.log('[OperationPlanPage] First task:', data[0].scheduledTasks[0]);
                }
            }
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Função para filtrar planos por Vessel IMO (filtro client-side)
    const getFilteredPlans = () => {
        let filteredPlans = history;
        
        // Aplica filtro de Vessel IMO se especificado
        if (filterVesselImo.trim()) {
            filteredPlans = filteredPlans.filter(plan => 
                plan.scheduledTasks && 
                plan.scheduledTasks.some(task => 
                    task.vesselImo && 
                    task.vesselImo.toLowerCase().includes(filterVesselImo.toLowerCase())
                )
            );
        }
        
        // Ordena por data (mais recente primeiro)
        return filteredPlans.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime(); // Ordem decrescente (mais recente primeiro)
        });
    };

    // Função para lidar com a submissão do formulário de filtros/refresh
    const handleApplyFilters = () => {
        fetchHistory(filterDate);
    };

    // 1. Abre o Modal
    const openDeleteModal = (planId: string) => {
        setPlanToDelete(planId);
        setIsDeleteModalOpen(true);
    };

    // 2. Executa a eliminação (chamado pelo botão "Delete" do Modal)
    const confirmDelete = async () => {
        if (!planToDelete) return;

        try {
            await schedulingService.deleteOperationPlan(planToDelete);
            // Remove da lista visualmente
            setHistory(history.filter(p => p.planId !== planToDelete));
            // Fecha o modal
            setIsDeleteModalOpen(false);
            setPlanToDelete(null);
        } catch (error) {
            alert("Failed to delete plan. See console.");
        }
    };

    // --- EDIT ACTIONS ---
    const openEditModal = async (planId: string, task: ScheduledTask) => {
        setEditingPlanId(planId);
        setEditingTask(task);
        setEditForm({
            resourceId: task.resourceId,
            staffId: task.staffId || '',
            startTime: task.startTime,
            endTime: task.endTime,
            reason: ''
        });
        setIsEditModalOpen(true);

        // Fetch selection data if not already loaded
        if (availableResources.length === 0) {
            setLoadingSelectionData(true);
            try {
                const data = await schedulingService.getResourcesAndStaff();
                setAvailableResources(data.resources);
                setAvailableStaff(data.staff);
            } catch (error) {
                console.error("Failed to load selection data", error);
            } finally {
                setLoadingSelectionData(false);
            }
        }
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlanId || !editingTask) return;

        try {
            // Cast task to any to access _id which comes from backend but might not be in type
            const taskId = (editingTask as any)._id;
            if (!taskId) {
                alert("Task ID not found. Cannot update.");
                return;
            }

            const result = await schedulingService.updateOperationPlanTask(editingPlanId, taskId, editForm);
            
            // Update local state
            setHistory(history.map(p => p.planId === editingPlanId ? result.plan : p));
            
            setIsEditModalOpen(false);
            setEditingPlanId(null);
            setEditingTask(null);
            
            if (result.warnings && result.warnings.length > 0) {
                alert(`Task updated with warnings:\n${result.warnings.join('\n')}`);
            } else {
                alert('Task updated successfully!');
            }
        } catch (error: any) {
            alert(`Failed to update task: ${error.message}`);
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        fetchHistory();
    }, []);

    // --- RENDER ---
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 relative">

            {/* SECTION: OPERATION PLANS HISTORY */}
            <section>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Operation Plans History</h1>
                    <p className="text-gray-600">Monitor and review saved operation plans. Generate new plans from the Scheduling page.</p>
                </div>

                {/* NOVO: FORMULÁRIO DE FILTROS */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Filter Plans</h2>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700">Plan Date (YYYY-MM-DD)</label>
                            <input
                                id="filterDate"
                                type="text"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                placeholder="e.g., 2024-12-10"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="filterVesselImo" className="block text-sm font-medium text-gray-700">Vessel IMO</label>
                            <input
                                id="filterVesselImo"
                                type="text"
                                value={filterVesselImo}
                                onChange={(e) => setFilterVesselImo(e.target.value)}
                                placeholder="e.g., 1234567"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        
                        <button
                            onClick={handleApplyFilters}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors h-10"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={() => {
                                setFilterDate('');
                                setFilterVesselImo('');
                                fetchHistory('');
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors h-10"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-700">Saved Plans</h2>
                    <button
                        onClick={handleApplyFilters}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh List
                    </button>
                </div>

                {loadingHistory ? (
                    <p className="text-gray-500">Loading history...</p>
                ) : getFilteredPlans().length === 0 ? (
                    <div className="bg-gray-50 p-8 text-center rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">
                            {history.length === 0 
                                ? "No saved plans found in the database matching the criteria."
                                : `No plans found with Vessel IMO containing "${filterVesselImo}".`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Algorithm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks (Count)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {getFilteredPlans().map((plan) => (
                                <React.Fragment key={plan.planId}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {plan.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {plan.algorithm}
                                                </span>
                                        </td>
                                        {/* Coluna de Contagem de Tasks */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                                            {plan.scheduledTasksCount || 0} tasks
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>Delay: {Number(plan.metrics?.totalDelay || 0).toFixed(1)}h</div>
                                            <div className="text-xs text-gray-400">Exec: {Number(plan.metrics?.executionTimeMs || 0).toFixed(0)}ms</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(plan.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Botão para ver detalhes */}
                                                {plan.scheduledTasks && plan.scheduledTasks.length > 0 && (
                                                    <button
                                                        onClick={() => setExpandedPlanId(expandedPlanId === plan.planId ? null : plan.planId)}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors flex items-center gap-1"
                                                    >
                                                        {expandedPlanId === plan.planId ? (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                                                </svg>
                                                                Hide
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                                Details
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                {/* Botão de Delete */}
                                                <button
                                                    onClick={() => openDeleteModal(plan.planId)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Linha Detalhada para Tasks - Apenas se o plano estiver expandido */}
                                    {expandedPlanId === plan.planId && plan.scheduledTasks && plan.scheduledTasks.length > 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-0">
                                                <div className="bg-gray-50 p-6 border-t border-gray-200">
                                                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        Scheduled Tasks Details ({plan.scheduledTasks.length} tasks)
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {plan.scheduledTasks.map((task, idx) => (
                                                            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="flex items-center gap-4 flex-wrap">
                                                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                                                                </svg>
                                                                                Vessel IMO: <span className="text-blue-700">{task.vesselImo}</span>
                                                                            </span>
                                                                            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                                </svg>
                                                                                Dock: <span className="font-medium text-blue-600">{task.dockName}</span>
                                                                            </span>
                                                                            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                                                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                                                </svg>
                                                                                Resource: <span className="font-medium text-green-600">{task.resourceKind}</span>
                                                                            </span>
                                                                            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                                                                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                </svg>
                                                                                Staff: <span className="font-medium text-purple-600">{task.staffShortName || task.staffId || 'N/A'}</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right ml-4 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                                                        <div className="text-xs text-gray-600 mb-1">Start</div>
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                            {new Date(task.startTime).toLocaleString('pt-PT', { 
                                                                                day: '2-digit', 
                                                                                month: '2-digit', 
                                                                                year: 'numeric', 
                                                                                hour: '2-digit', 
                                                                                minute: '2-digit' 
                                                                            })}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 my-1 flex items-center justify-center">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 mb-1">End</div>
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                            {new Date(task.endTime).toLocaleString('pt-PT', { 
                                                                                day: '2-digit', 
                                                                                month: '2-digit', 
                                                                                year: 'numeric', 
                                                                                hour: '2-digit', 
                                                                                minute: '2-digit' 
                                                                            })}
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => openEditModal(plan.planId, task)}
                                                                            className="mt-2 w-full text-xs bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                            Delete Operation Plan?
                        </h3>

                        <p className="text-sm text-center text-gray-500 mb-6">
                            Are you sure you want to delete plan <strong>{planToDelete}</strong>?
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT TASK MODAL --- */}
            {isEditModalOpen && editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-fade-in">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Edit Task for VVN {editingTask.vesselVisitBusinessId}
                        </h3>
                        
                        <form onSubmit={handleUpdateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Resource</label>
                                {loadingSelectionData ? (
                                    <p className="text-sm text-gray-500">Loading resources...</p>
                                ) : (
                                    <select
                                        value={editForm.resourceId}
                                        onChange={e => setEditForm({...editForm, resourceId: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        required
                                    >
                                        <option value="">Select Resource</option>
                                        {availableResources.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} ({r.type})
                                            </option>
                                        ))}
                                        {/* Fallback if current resource is not in list */}
                                        {!availableResources.find(r => r.id === editForm.resourceId) && editForm.resourceId && (
                                            <option value={editForm.resourceId}>{editForm.resourceId} (Current)</option>
                                        )}
                                    </select>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Staff</label>
                                {loadingSelectionData ? (
                                    <p className="text-sm text-gray-500">Loading staff...</p>
                                ) : (
                                    <select
                                        value={editForm.staffId}
                                        onChange={e => setEditForm({...editForm, staffId: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        required
                                    >
                                        <option value="">Select Staff</option>
                                        {availableStaff.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.role})
                                            </option>
                                        ))}
                                        {/* Fallback if current staff is not in list */}
                                        {!availableStaff.find(s => s.id === editForm.staffId) && editForm.staffId && (
                                            <option value={editForm.staffId}>{editForm.staffId} (Current)</option>
                                        )}
                                    </select>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={editForm.startTime ? new Date(editForm.startTime).toISOString().slice(0, 16) : ''}
                                        onChange={e => setEditForm({...editForm, startTime: new Date(e.target.value).toISOString()})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={editForm.endTime ? new Date(editForm.endTime).toISOString().slice(0, 16) : ''}
                                        onChange={e => setEditForm({...editForm, endTime: new Date(e.target.value).toISOString()})}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                                <textarea 
                                    value={editForm.reason}
                                    onChange={e => setEditForm({...editForm, reason: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    rows={2}
                                    required
                                    placeholder="e.g., Crane breakdown, Staff unavailable..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

