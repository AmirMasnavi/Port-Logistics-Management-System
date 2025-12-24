import React, { useState, useEffect } from 'react';
import { schedulingService } from '../services/schedulingService';
import type { OperationPlan } from '../services/schedulingService';
import type { ScheduledTask } from '../types/scheduling.types';
import {
    Search, SlidersHorizontal, Calendar, Clock, Activity, Trash2, Eye, EyeOff, Edit2, Anchor, Truck, User, History,
    Box
} from 'lucide-react';
import EditTaskModal from '../components/scheduling/EditTaskModal';
import FeedbackMessage from '../components/common/FeedbackMessage';
import ChangeLogList from '../components/scheduling/ChangeLogList';
import ConfirmationModal from '../components/common/ConfirmationModal';

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
    
    // State to control which plan's logs are visible
    const [visibleLogsPlanId, setVisibleLogsPlanId] = useState<string | null>(null);

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

    // --- FEEDBACK STATE ---
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

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
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
            setFeedback({ type: 'error', message: "Failed to load operation plans history." });
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
            setFeedback({ type: 'success', message: "Operation plan deleted successfully." });
        } catch (error) {
            setFeedback({ type: 'error', message: "Failed to delete plan." });
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
        setFeedback(null); // Clear previous feedback

        // Fetch selection data if not already loaded
        if (availableResources.length === 0) {
            setLoadingSelectionData(true);
            try {
                const data = await schedulingService.getResourcesAndStaff();
                setAvailableResources(data.resources);
                setAvailableStaff(data.staff);
            } catch (error) {
                console.error("Failed to load selection data", error);
                setFeedback({ type: 'error', message: "Failed to load resources and staff list." });
            } finally {
                setLoadingSelectionData(false);
            }
        }
    };

    const handleUpdateTask = async (e: React.FormEvent, confirmWarnings: boolean = false) => {
        e.preventDefault();
        if (!editingPlanId || !editingTask) return;

        try {
            // Cast task to any to access _id which comes from backend but might not be in type
            const taskId = (editingTask as any)._id;
            if (!taskId) {
                setFeedback({ type: 'error', message: "Task ID not found. Cannot update." });
                return;
            }

            const result = await schedulingService.updateOperationPlanTask(editingPlanId, taskId, {
                ...editForm,
                confirmWarnings
            });
            
            if (result.requiresConfirmation) {
                // If confirmation is required, we don't close the modal yet
                // Instead, we pass the warnings back to the modal to display them
                // The modal will then call this function again with confirmWarnings=true
                return result.warnings;
            }

            // Update local state
            if (result.plan) {
                setHistory(history.map(p => p.planId === editingPlanId ? result.plan! : p));
            }
            
            setIsEditModalOpen(false);
            setEditingPlanId(null);
            setEditingTask(null);
            
            if (result.warnings && result.warnings.length > 0) {
                setFeedback({ 
                    type: 'warning', 
                    message: `Task Does not updated, First resolve the warnings:\n${result.warnings.join('\n')}` 
                });
            } else {
                setFeedback({ type: 'success', message: 'Task updated successfully!' });
            }
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Failed to update task: ${error.message}` });
            // Keep modal open on error so user can fix
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        fetchHistory();
    }, []);

    // --- RENDER ---
    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-8 relative">

            {/* SECTION: HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Operation Plans History</h1>
                    <p className="text-gray-600 mt-1">Monitor, review, and adjust saved operation plans.</p>
                </div>
            </div>

            {/* FEEDBACK MESSAGES */}
            {feedback && (
                <FeedbackMessage 
                    type={feedback.type} 
                    message={feedback.message} 
                    onClose={() => setFeedback(null)} 
                />
            )}

            {/* FILTERS */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">Plan Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                id="filterDate"
                                type="text"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                placeholder="YYYY-MM-DD"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <label htmlFor="filterVesselImo" className="block text-sm font-medium text-gray-700 mb-1">Vessel IMO</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                id="filterVesselImo"
                                type="text"
                                value={filterVesselImo}
                                onChange={(e) => setFilterVesselImo(e.target.value)}
                                placeholder="e.g., 1234567"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyFilters}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Apply Filters
                        </button>
                        <button
                            onClick={() => {
                                setFilterDate('');
                                setFilterVesselImo('');
                                fetchHistory('');
                            }}
                            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* PLANS LIST */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Saved Plans
                </h2>
                <button
                    onClick={handleApplyFilters}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 hover:underline"
                >
                    Refresh List
                </button>
            </div>

            {loadingHistory ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading operation plans...</p>
                </div>
            ) : getFilteredPlans().length === 0 ? (
                <div className="bg-gray-50 p-12 text-center rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">
                        {history.length === 0 
                            ? "No saved plans found in the database."
                            : "No plans found matching your filters."
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Algorithm</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasks</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Metrics</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredPlans().map((plan) => (
                            <React.Fragment key={plan.planId}>
                                <tr className={`hover:bg-gray-50 transition-colors ${expandedPlanId === plan.planId ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {plan.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                {plan.algorithm}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                        {plan.scheduledTasksCount || 0} tasks
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 w-fit">
                                                Delay: {Number(plan.metrics?.totalDelay || 0).toFixed(1)}h
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Exec: {Number(plan.metrics?.executionTimeMs || 0).toFixed(0)}ms
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(plan.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setExpandedPlanId(expandedPlanId === plan.planId ? null : plan.planId)}
                                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                                                    expandedPlanId === plan.planId 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {expandedPlanId === plan.planId ? (
                                                    <>
                                                        <EyeOff className="w-3.5 h-3.5" />
                                                        Hide
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Details
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(plan.planId)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {/* EXPANDED DETAILS ROW */}
                                {expandedPlanId === plan.planId && (
                                    <tr>
                                        <td colSpan={6} className="p-0 border-b border-gray-200">
                                            <div className="bg-gray-50/50 p-6 animate-fade-in">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                                                        <Activity className="w-4 h-4 text-blue-600" />
                                                        Scheduled Tasks ({plan.scheduledTasks?.length || 0})
                                                    </h3>
                                                    
                                                    {/* Toggle Logs Button */}
                                                    {(plan as any).changeLogs && (plan as any).changeLogs.length > 0 && (
                                                        <button
                                                            onClick={() => setVisibleLogsPlanId(visibleLogsPlanId === plan.planId ? null : plan.planId)}
                                                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                                                                visibleLogsPlanId === plan.planId
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <History className="w-3.5 h-3.5" />
                                                            {visibleLogsPlanId === plan.planId ? 'Hide Logs' : 'Show Logs'}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 gap-4">
                                                    {plan.scheduledTasks && plan.scheduledTasks.map((task, idx) => (
                                                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
                                                                            <Anchor className="w-3.5 h-3.5" />
                                                                            IMO: {task.vesselImo}
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                                            {task.resourceKind === 'Truck' ? <Truck className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
                                                                            {task.resourceKind}
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                                                                            <User className="w-3.5 h-3.5" />
                                                                            {(task.staffShortName || task.staffId || 'Unassigned').replace(' (Unknown)', '')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 pl-1">
                                                                        <span className="font-medium text-gray-900">Dock:</span> {task.dockName}
                                                                    </div>
                                                                    <div className="flex gap-2 mt-2">
                                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                                            </svg>
                                                                            <span className="text-xs font-bold text-green-700">
                                                                                Loading: {task.loadingTime?.toFixed(1) || '0.0'}h
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                                                                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                                            </svg>
                                                                            <span className="text-xs font-bold text-orange-700">
                                                                                Unloading: {task.unloadingTime?.toFixed(1) || '0.0'}h
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 w-full md:w-auto">
                                                                    <div className="text-center">
                                                                        <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Start</div>
                                                                        <div className="text-sm font-bold text-gray-900">
                                                                            {new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400">
                                                                            {new Date(task.startTime).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="text-gray-300">
                                                                        <Clock className="w-4 h-4" />
                                                                    </div>
                                                                    
                                                                    <div className="text-center">
                                                                        <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">End</div>
                                                                        <div className="text-sm font-bold text-gray-900">
                                                                            {new Date(task.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400">
                                                                            {new Date(task.endTime).toLocaleDateString()}
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-px h-8 bg-gray-200 mx-2"></div>

                                                                    <button 
                                                                        onClick={() => openEditModal(plan.planId, task)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                                        title="Edit Task"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* --- NEW SECTION: Display the Smart Generated Sub-Ops --- */}
                                                            <div className="mt-4 border-t border-gray-100 pt-4">
                                                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detailed Operations Breakdown</h5>
                                                                <div className="space-y-2">
                                                                    {task.subOperations?.map((subOp) => (
                                                                        <div key={subOp.operationId} className="flex items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                                                            <div className={`w-2 h-2 rounded-full mr-3 ${
                                                                                subOp.type === 'LOADING' ? 'bg-green-500' : 
                                                                                subOp.type === 'UNLOADING' ? 'bg-yellow-500' : 
                                                                                subOp.type === 'WAITING' ? 'bg-blue-400' : 'bg-gray-400'
                                                                            }`}></div>
                                                                            <span className="font-medium w-32 text-gray-700">{subOp.type}</span>
                                                                            <span className="flex-1 text-gray-600">{subOp.name}</span>
                                                                            <span className="text-gray-500 text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                                                                                {new Date(subOp.plannedStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                                                                - 
                                                                                {new Date(subOp.plannedEndTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                                            </span>
                                                                        </div>
                                                                    )) || (
                                                                        <span className="text-gray-400 italic text-sm">No detailed breakdown available.</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* CHANGE LOGS SECTION - Controlled by state */}
                                                {visibleLogsPlanId === plan.planId && (plan as any).changeLogs && (plan as any).changeLogs.length > 0 && (
                                                    <div className="animate-fade-in">
                                                        <ChangeLogList logs={(plan as any).changeLogs} />
                                                    </div>
                                                )}
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

            {/* --- MODALS --- */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Operation Plan"
                message="Are you sure you want to delete this plan? This action cannot be undone."
                confirmText="Delete Plan"
            />

            <EditTaskModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                task={editingTask}
                onSave={handleUpdateTask}
                editForm={editForm}
                setEditForm={setEditForm}
                availableResources={availableResources}
                availableStaff={availableStaff}
                loadingSelectionData={loadingSelectionData}
            />
        </div>
    );
};
