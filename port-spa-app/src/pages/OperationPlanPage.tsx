import React, { useState, useEffect } from 'react';
import { schedulingService } from '../services/schedulingService';
import type {OperationPlan} from '../services/schedulingService';

export const OperationPlanPage: React.FC = () => {

    // --- STATE ---
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [algorithm, setAlgorithm] = useState('optimal');
    const [loading, setLoading] = useState(false);
    const [previewPlan, setPreviewPlan] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<string>('');

    // State para o Histórico
    const [history, setHistory] = useState<OperationPlan[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // --- NOVO: STATE PARA O MODAL DE ELIMINAR ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);

    // --- EFFECTS ---
    useEffect(() => {
        fetchHistory();
    }, []);

    // --- ACTIONS ---

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await schedulingService.getOperationPlans();
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setSaveStatus('');
        try {
            const result = await schedulingService.generateDailySchedule(date, algorithm as any);
            setPreviewPlan(result);
        } catch (error) {
            console.error("Generation failed", error);
            alert("Failed to generate schedule. Ensure Planning API is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!previewPlan) return;
        setLoading(true);
        try {
            const planToSave = {
                date: previewPlan.date,
                algorithm: algorithm,
                totalDelay: Number(previewPlan.totalDelay) || 0,
                executionTimeMs: Number(previewPlan.executionTimeMs) || 0,
                scheduledTasks: previewPlan.scheduledTasks?.map((t: any) => ({
                    vesselVisitId: t.vesselVisitId,
                    vesselVisitBusinessId: t.vesselVisitBusinessId,
                    dockName: t.dockName,
                    dockId: t.dockId,
                    resourceKind: t.resourceKind,
                    resourceId: t.resourceId,
                    staffShortName: t.staffShortName,
                    staffId: t.staffId,
                    startTime: t.startTime,
                    endTime: t.endTime
                })) || [],
                geneticParams: undefined
            };

            await schedulingService.saveOperationPlan(planToSave);
            setSaveStatus('success');
            setPreviewPlan(null);
            fetchHistory(); // Atualiza a lista imediatamente

        } catch (error) {
            console.error("Save failed", error);
            setSaveStatus('error');
        } finally {
            setLoading(false);
        }
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

    // --- RENDER ---
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 relative">

            {/* SECTION 1: GENERATE NEW */}
            <section>
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Generate Operation Plan</h1>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6 flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
                        <select
                            value={algorithm}
                            onChange={(e) => setAlgorithm(e.target.value)}
                            className="border rounded p-2 w-48"
                        >
                            <option value="optimal">Optimal (Prolog)</option>
                            <option value="heuristic">Heuristic (Prolog)</option>
                            <option value="genetic">Genetic (Prolog/C#)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Processing...' : 'Generate Plan'}
                    </button>
                </div>

                {saveStatus === 'success' && (
                    <div className="bg-green-100 text-green-700 p-4 rounded mb-4 border border-green-200">
                        Operation Plan successfully saved to OEM Database!
                    </div>
                )}

                {saveStatus === 'error' && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-200">
                        Failed to save Operation Plan. Check console for details.
                    </div>
                )}

                {/* PREVIEW TABLE */}
                {previewPlan && (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-blue-100 mb-8">
                        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-blue-900">Plan Preview (Draft)</h2>
                                <p className="text-sm text-blue-700">
                                    Delay: {Number(previewPlan.totalDelay).toFixed(2)}h | Time: {Number(previewPlan.executionTimeMs).toFixed(0)}ms
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 shadow disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Saving...' : 'Confirm & Save Plan'}
                            </button>
                        </div>

                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {previewPlan.scheduledTasks.map((task: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{task.vesselVisitBusinessId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{task.dockName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{task.resourceKind}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                                            {new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                                            {new Date(task.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* SECTION 2: HISTORY */}
            <section className="mt-12 border-t pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Plan History</h2>
                    <button
                        onClick={fetchHistory}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Refresh List
                    </button>
                </div>

                {loadingHistory ? (
                    <p className="text-gray-500">Loading history...</p>
                ) : history.length === 0 ? (
                    <div className="bg-gray-50 p-8 text-center rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No saved plans found in the database.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Algorithm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {history.map((plan) => (
                                <tr key={plan.planId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {plan.planId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {plan.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {plan.algorithm}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Delay: {Number(plan.metrics?.totalDelay || 0).toFixed(1)}h</div>
                                        <div className="text-xs text-gray-400">Exec: {Number(plan.metrics?.executionTimeMs || 0).toFixed(0)}ms</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(plan.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openDeleteModal(plan.planId)} // Abre o Modal
                                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
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
        </div>
    );
};