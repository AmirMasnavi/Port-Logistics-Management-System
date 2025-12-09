import React, { useState, useEffect } from 'react';
import { schedulingService } from '../services/schedulingService';
import type {OperationPlan} from '../services/schedulingService';

export const OperationPlanPage: React.FC = () => {

    // --- STATE ---
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

            {/* SECTION: OPERATION PLANS HISTORY */}
            <section>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Operation Plans History</h1>
                    <p className="text-gray-600">Monitor and review saved operation plans. Generate new plans from the Scheduling page.</p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-700">Saved Plans</h2>
                    <button
                        onClick={fetchHistory}
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