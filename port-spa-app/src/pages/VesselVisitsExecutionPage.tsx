import React, {useState, useEffect, useMemo} from 'react';
import {
    Ship,
    Calendar,
    Filter,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    PlusCircle,
    FileText,
    Edit,
    CheckCircle2
} from 'lucide-react';
import { vveService, type VveFilters, type VveWithMetrics } from '../services/vveService';
import StatCard from '../components/common/StatCard';
import { vvnApiRepository } from '../infrastructure/repositories/vvn/vvnApi.repository';
import type { CreateVveDto } from '../infrastructure/repositories/vve/vve.dto';
import type { VesselVisitNotification } from '../domain/vvn/vvn.model';
import { useAuth } from '../auth/AuthProvider';
import { useVveController } from '../controllers/vve/useVveController';
import { OperationExecutionTable } from '../components/vve/OperationExecutionTable';
import CompleteVveModal from '../components/vve/CompleteVveModal';
import Toast, { type ToastType } from '../components/common/Toast';

const VesselVisitsExecutionPage: React.FC = () => {
    const { internalRole } = useAuth();
    const { createVve, loading: createLoading, error: createError, successMessage, clearMessages, updateVve, loading: updateLoading, error: updateError } = useVveController();
   
    const [vves, setVves] = useState<VveWithMetrics[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update modal states
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedVve, setSelectedVve] = useState<VveWithMetrics | null>(null);
    const [updateActualBerthTime, setUpdateActualBerthTime] = useState<string>('');
    const [updateBerthDockId, setUpdateBerthDockId] = useState<string>('');
    const [updateNotes, setUpdateNotes] = useState<string>('');

    // US 4.1.11: Complete VVE modal states
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [vveToComplete, setVveToComplete] = useState<VveWithMetrics | null>(null);
    const [unfinishedOps, setUnfinishedOps] = useState<Array<{ operationId: string; name: string; status: string }>>([]);

    // Toast notifications
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<ToastType>('info');

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'In Progress' | 'Completed' | 'Cancelled' | ''>('');
    const [vesselFilter, setVesselFilter] = useState<string>('');
    const [berthFilter, setBerthFilter] = useState<string>(''); // US 4.1.8: filtro por cais/berth
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // View mode: 'table' or 'timeline'
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

    // Create VVE Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loadingVvns, setLoadingVvns] = useState(false);
    const [vvnId, setVvnId] = useState<string>('');
    const [vesselIdentifier, setVesselIdentifier] = useState<string>('');
    const [actualArrivalTime, setActualArrivalTime] = useState<string>(() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    });
    const [notes, setNotes] = useState('');

    // === Lista de docks disponíveis (necessária para label amigável) ===
    const availableDocks = useMemo(() => {
        const map = new Map<string, string>();
        const add = (id?: string | null, name?: string | null) => {
            if (!id && !name) return;
            const key = (id || name || '').toString().trim();
            const label = (name || id || '').toString().trim();
            if (!key) return;
            map.set(key, label);
        };

        vves.forEach(v => {
            add(v.berthDockId, (v as any).berthDockName);
            if (v.vvnData) add(v.vvnData.assignedDockId, v.vvnData.assignedDockName);
        });

        vvns.forEach(v => {
            add(v.assignedDockId, v.assignedDockName);
        });

        return Array.from(map.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [vves, vvns]);

    useEffect(() => {
        // Load VVEs on component mount with default last 30 days
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        const fromDateStr = defaultFromDate.toISOString().split('T')[0];
        const toDateStr = new Date().toISOString().split('T')[0];

        setFromDate(fromDateStr);
        setToDate(toDateStr);

        // Call search with the date values directly since state updates are async
        loadInitialData(fromDateStr, toDateStr);
    }, []);

    useEffect(() => {
        if (showCreateModal) {
            fetchVvns();
            clearMessages();
        }
    }, [showCreateModal]);

    useEffect(() => {
        const selected = vvns.find(v => v.businessId === vvnId);
        if (selected) {
            setVesselIdentifier(selected.vesselImo || '');
        }
    }, [vvnId, vvns]);

    // Pre-fill update form when a VVE is selected for update
    useEffect(() => {
        if (selectedVve) {
            // Pre-fill fields for in-progress VVE
            setUpdateActualBerthTime(
                selectedVve.actualBerthTime
                    ? new Date(selectedVve.actualBerthTime).toISOString().slice(0, 16)
                    : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
            );
            setUpdateBerthDockId(selectedVve.berthDockId || selectedVve.vvnData?.assignedDockId || '');
            setUpdateNotes(selectedVve.notes || '');
            clearMessages(); // Limpa mensagens de sucesso/erro anteriores
        }
    }, [selectedVve]);

    const loadInitialData = async (from: string, to: string) => {
        setLoading(true);
        setError(null);

        try {
            const filters: VveFilters = {
                includeMetrics: true,
                fromDate: from,
                toDate: to,
            };

            const result = await vveService.getAllVves(filters);
            setVves(result);
        } catch (err: any) {
            console.error('Failed to fetch VVEs:', err);
            setError(err.message || 'Failed to fetch vessel visit executions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const filters: VveFilters = {
                includeMetrics: true, // Always include metrics for analysis
            };

            if (statusFilter) filters.status = statusFilter;
            if (vesselFilter) filters.vesselIdentifier = vesselFilter;
            if (berthFilter) (filters as any).berthDockId = berthFilter; // US 4.1.8
            if (fromDate) filters.fromDate = fromDate;
            if (toDate) filters.toDate = toDate;

            console.log('[VVE Search] Filters being sent:', filters);

            const result = await vveService.getAllVves(filters);
            console.log('[VVE Search] Results received:', result.length);
            setVves(result);
        } catch (err: any) {
            console.error('Failed to fetch VVEs:', err);
            setError(err.message || 'Failed to fetch vessel visit executions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchVvns = async () => {
        try {
            setLoadingVvns(true);
            const data = await vvnApiRepository.getAll();
            const approvedVvns = data.filter(v => v.status === 'Approved');
            setVvns(approvedVvns);
        } catch (err: any) {
            console.error('Failed to fetch VVNs', err);
        } finally {
            setLoadingVvns(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();

        if (!vvnId || !vesselIdentifier || !actualArrivalTime) {
            return;
        }

        try {
            const iso = new Date(actualArrivalTime).toISOString();
            const dto: CreateVveDto = {
                vvnId,
                vesselIdentifier,
                actualArrivalTime: iso,
                notes: notes || undefined,
            };

            const created = await createVve(dto);
            
            if (created) {
                // Reset form
                setVvnId('');
                setVesselIdentifier('');
                setNotes('');
                const now = new Date();
                setActualArrivalTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16));
                
                // Close modal after a brief delay
                setTimeout(() => {
                    setShowCreateModal(false);
                    // Refresh the list
                    handleSearch();
                }, 1500);
            }
        } catch (err: any) {
            console.error('Create VVE failed', err);
        }
    };

    // Handle Update Submission (New Function)
    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVve || !updateActualBerthTime || !updateBerthDockId) {
            return;
        }

        clearMessages(); // Limpa mensagens anteriores

        try {
            const isoBerthTime = new Date(updateActualBerthTime).toISOString();

            const plannedDockId = selectedVve.vvnData?.assignedDockId;
            const plannedDockLabel = selectedVve.vvnData?.assignedDockName || plannedDockId || 'N/A';
            const usedDockLabel = availableDocks.find(d => d.value === updateBerthDockId)?.label || updateBerthDockId;

            let finalNotes: string | undefined = updateNotes.trim() || undefined;

            // Timestamp atual formatado para legibilidade
            const timestamp = new Date().toISOString();
            const readableTimestamp = new Date().toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            // Nota de auditoria geral (sempre adicionada em qualquer update)
            const auditNote = `Audit: VVE updated by ${internalRole || 'User'} — Actual Berth Time: ${updateActualBerthTime}, Berth Dock: ${updateBerthDockId} — ${readableTimestamp} (${timestamp})`;

            // Nota específica se houver mudança de dock
            let deviationNote = '';
            if (plannedDockId && plannedDockId !== updateBerthDockId) {
                deviationNote = `System: Dock changed from ${plannedDockLabel} to ${usedDockLabel} (recorded as deviation) — ${readableTimestamp}`;
            }

            // Monta as notas finais na ordem correta: notas do usuário → desvio (se houver) → auditoria
            const notesParts = [finalNotes, deviationNote, auditNote].filter(Boolean);
            finalNotes = notesParts.join('\n\n');
            
            // Adiciona nota automática se houver discrepância
            if (plannedDockId && plannedDockId !== updateBerthDockId) {
                const timestamp = new Date().toISOString();
                const systemNote = `System: Dock changed from ${plannedDockLabel} to ${usedDockLabel} (recorded as deviation) — ${timestamp}`;

                finalNotes = finalNotes ? `${finalNotes}\n\n${systemNote}` : systemNote;
            }

            // DTO simplificado para o update (assumindo que o endpoint só precisa disso)
            const updateDto = {
                actualBerthTime: isoBerthTime,
                berthDockId: updateBerthDockId,
                notes: finalNotes,
            };

            const updated = await updateVve(selectedVve.vveId, updateDto); // ASSUME: updateVve(vveId, dto)

            if (updated) {
                // Fechar modal após sucesso
                setTimeout(() => {
                    setShowUpdateModal(false);
                    setSelectedVve(null);
                    // Atualizar lista
                    handleSearch();
                }, 1500);
            }

        } catch (err: any) {
            console.error('Update VVE failed', err);
        }
    };

    // US 4.1.11: Handle Complete VVE
    const handleCompleteVve = async (data: { actualUnberthTime: string; actualPortDepartureTime: string }) => {
        if (!vveToComplete) return;

        try {
            const result = await vveService.completeVve(vveToComplete.vveId, data);
            
            // Success - show toast with completion details
            const completedAt = new Date(result.completedAt || new Date()).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            setToastMessage(`✅ VVE ${vveToComplete.vveId} successfully marked as completed at ${completedAt}`);
            setToastType('success');
            
            // Close modal and refresh
            setShowCompleteModal(false);
            setVveToComplete(null);
            setUnfinishedOps([]);
            await handleSearch();
        } catch (err: any) {
            console.error('Complete VVE failed:', err);
            
            // Show error toast
            setToastMessage(`❌ Failed to complete VVE: ${err.message}`);
            setToastType('error');
            
            // If the error is about unfinished operations, extract them from the error
            if (err.message.includes('unfinished')) {
                // Try to fetch the VVE details to get operations
                try {
                    const vveDetails = await vveService.getVveById(vveToComplete.vveId);
                    const unfinished = (vveDetails.executedOperations || [])
                        .filter(op => op.status !== 'COMPLETED')
                        .map(op => ({
                            operationId: op.operationId,
                            name: op.name || op.operationId,
                            status: op.status
                        }));
                    setUnfinishedOps(unfinished);
                } catch {
                    // If we can't fetch details, just show the error message
                }
            }
            
            throw err; // Re-throw to let modal handle it
        }
    };

    const formatDateTime = (dateTimeStr?: string) => {
        if (!dateTimeStr) return 'N/A';
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (hours: number | null) => {
        if (hours === null || isNaN(hours)) return 'N/A';
        const absHours = Math.abs(hours);
        const h = Math.floor(absHours);
        const m = Math.round((absHours - h) * 60);
        return `${hours < 0 ? '-' : ''}${h}h ${m}m`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'In Progress':
                return <Clock className="w-5 h-5 text-blue-500" />;
            case 'Cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDelayIndicator = (delay: number | null) => {
        if (delay === null || isNaN(delay)) return <Minus className="w-4 h-4 text-gray-400" />;
        if (delay > 1) return <TrendingDown className="w-4 h-4 text-red-500" />; // Late
        if (delay < -1) return <TrendingUp className="w-4 h-4 text-green-500" />; // Early
        return <Minus className="w-4 h-4 text-blue-500" />; // On time
    };

    // Calculate summary statistics (safely)
    const turnaroundValues = vves
        .map(v => v.metrics?.totalTurnaroundTime)
        .filter((t): t is number => t !== null && t !== undefined && !isNaN(t));
    const delayValues = vves
        .map(v => v.metrics?.arrivalDelay)
        .filter((d): d is number => d !== null && d !== undefined && !isNaN(d));

    const avgTurnaround = turnaroundValues.length > 0
        ? turnaroundValues.reduce((s, v) => s + v, 0) / turnaroundValues.length
        : null;

    const avgDelay = delayValues.length > 0
        ? delayValues.reduce((s, v) => s + v, 0) / delayValues.length
        : null;

    const stats = {
        total: vves.length,
        completed: vves.filter(v => v.status === 'Completed').length,
        inProgress: vves.filter(v => v.status === 'In Progress').length,
        cancelled: vves.filter(v => v.status === 'Cancelled').length,
        avgTurnaround,
        avgDelay,
    };

    const selectedVvn = vvns.find(v => v.businessId === vvnId);

    // Check for Dock Discrepancy
    const isDockDiscrepancy = selectedVve && selectedVve.vvnData?.assignedDockId && updateBerthDockId && selectedVve.vvnData.assignedDockId !== updateBerthDockId;
    
    return (
        <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Ship className="w-8 h-8" />
                        Vessel Visit Executions
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Monitor and analyze vessel visit execution history and performance metrics
                    </p>
                    <p className="text-sm text-blue-700 mt-3 font-medium">
                        👆 Select an <strong>In Progress</strong> VVE row in the table below and click <strong>Update</strong> to record actual berth time and dock used.
                    </p>
                </div>
                {(internalRole === 'LogisticsOperator' || internalRole === 'Administrator' || internalRole === 'PortOfficer') && (
                    <div className="flex items-center gap-3">                       
                        <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create VVE
                    </button>
                        <button
                            onClick={() => setShowUpdateModal(true)}
                            disabled={!selectedVve || selectedVve.status !== 'In Progress'}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                !selectedVve || selectedVve.status !== 'In Progress'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            title={!selectedVve ? 'Select an In Progress VVE first' : selectedVve.status !== 'In Progress' ? 'Only In Progress VVEs can be updated' : 'Update selected VVE'}
                        >
                            <Edit className="w-5 h-5" />
                            Update
                        </button>
                    </div>
                )} 
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Executions"
                    value={stats.total}
                    description="All vessel visits"
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    description="Successfully completed"
                />
                <StatCard
                    title="In Progress"
                    value={stats.inProgress}
                    description="Currently executing"
                />
                <StatCard
                    title="Avg Turnaround"
                    value={formatDuration(stats.avgTurnaround)}
                    description="Average total time"
                />
            </div>

            {/* Create VVE Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Create Vessel Visit Execution</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Role Warning */}
                            {internalRole !== 'LogisticsOperator' && internalRole !== 'Administrator' && (
                                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                        <p className="text-sm text-yellow-800">
                                            This functionality is intended for Logistics Operators
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {createError && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-red-900">Error</h3>
                                            <p className="text-sm text-red-700 mt-1">{createError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-900">Success</h3>
                                            <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleCreateSubmit} className="space-y-6">
                                {/* VVN Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        Vessel Visit Notification <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        value={vvnId} 
                                        onChange={(e) => setVvnId(e.target.value)} 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                        disabled={loadingVvns}
                                        required
                                    >
                                        <option value="">
                                            {loadingVvns ? 'Loading approved vessel visits...' : '-- Select a vessel visit notification --'}
                                        </option>
                                        {vvns.map(v => (
                                            <option key={v.businessId} value={v.businessId}>
                                                {v.businessId} | {v.vesselImo} | ETA: {new Date(v.estimatedArrival).toLocaleString('en-CA', { 
                                                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                })}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Only approved vessel visit notifications are available for execution recording
                                    </p>
                                </div>

                                {/* VVN Details Display */}
                                {selectedVvn && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Selected VVN Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">VVN ID:</span>
                                                <span className="ml-2 font-medium text-gray-900">{selectedVvn.businessId}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Vessel:</span>
                                                <span className="ml-2 font-medium text-gray-900">{selectedVvn.vesselImo}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Estimated Arrival:</span>
                                                <span className="ml-2 font-medium text-gray-900">
                                                    {new Date(selectedVvn.estimatedArrival).toLocaleString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Assigned Dock:</span>
                                                <span className="ml-2 font-medium text-gray-900">{selectedVvn.assignedDockName || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Vessel Identifier */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Ship className="w-4 h-4 inline mr-1" />
                                        Vessel Identifier (IMO) <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text"
                                        value={vesselIdentifier} 
                                        onChange={(e) => setVesselIdentifier(e.target.value)} 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                        placeholder="IMO1234567"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Auto-filled from selected VVN, can be modified if needed
                                    </p>
                                </div>

                                {/* Actual Arrival Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Actual Arrival Time <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="datetime-local" 
                                        value={actualArrivalTime} 
                                        onChange={(e) => setActualArrivalTime(e.target.value)} 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Record the precise time when the vessel actually arrived at the port
                                    </p>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <textarea 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)} 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                                        rows={4}
                                        placeholder="Add any relevant observations, delays, or special circumstances..."
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Document any deviations from the planned schedule or special conditions
                                    </p>
                                </div>


                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCreateModal(false)} 
                                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={createLoading || loadingVvns || !vvnId}
                                    >
                                        {createLoading ? 'Creating...' : 'Create VVE'}
                                    </button>
                                </div>
                            </form>

                            {/* Info Panel */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ What is a VVE?</h3>
                                <p className="text-sm text-blue-800">
                                    A <strong>Vessel Visit Execution (VVE)</strong> records the actual arrival and operations of a vessel, 
                                    tracking what really happens versus what was planned in the VVN. Once created, the VVE will be marked 
                                    as "In Progress" and can be updated as operations proceed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Update VVE Modal (New Component) */}
            {showUpdateModal && selectedVve && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Update VVE: {selectedVve.vveId}</h2>
                            <button
                                onClick={() => { setShowUpdateModal(false); setSelectedVve(null); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Messages */}
                            {updateError && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-red-900">Error</h3>
                                            <p className="text-sm text-red-700 mt-1">{updateError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-900">Success</h3>
                                            <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dock Discrepancy Warning */}
                            {isDockDiscrepancy && (
                                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-yellow-900">Dock Discrepancy Warning</h3>
                                            <p className="text-sm text-yellow-800 mt-1">
                                                The selected Berth Dock ID (**{updateBerthDockId}**) differs from the planned Assigned Dock (**{selectedVve.vvnData?.assignedDockName || selectedVve.vvnData?.assignedDockId || 'N/A'}**). This will be recorded as a deviation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleUpdateSubmit} className="space-y-6">
                                {/* Current VVE Info */}
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                                    <p><span className="font-semibold text-gray-600">Vessel:</span> {selectedVve.vesselIdentifier}</p>
                                    <p><span className="font-semibold text-gray-600">Planned Dock:</span> {selectedVve.vvnData?.assignedDockName || selectedVve.vvnData?.assignedDockId || 'N/A'}</p>
                                    <p><span className="font-semibold text-gray-600">Actual Arrival:</span> {formatDateTime(selectedVve.actualArrivalTime)}</p>
                                </div>

                                {/* Actual Berth Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Actual Berth Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={updateActualBerthTime}
                                        onChange={(e) => setUpdateActualBerthTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Record the precise time the vessel was secured at the berth
                                    </p>
                                </div>

                                {/* Berth Dock ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Ship className="w-4 h-4 inline mr-1" />
                                        Berth Dock Used <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={updateBerthDockId || ''}
                                        onChange={(e) => setUpdateBerthDockId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                                        required
                                    >
                                        <option value="">
                                            {availableDocks.length === 0
                                                ? '-- No docks registered yet --'
                                                : '-- Select the dock used --'
                                            }
                                        </option>
                                        {availableDocks.map((dock) => (
                                            <option key={dock.value} value={dock.value}>
                                                {dock.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Select from the docks already created/used in the system
                                    </p>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <textarea
                                        value={updateNotes}
                                        onChange={(e) => setUpdateNotes(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                                        rows={4}
                                        placeholder="Add any relevant observations, e.g., reason for change of dock..."
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4">                                                                      
                                    <button
                                        type="button"
                                        onClick={() => { setShowUpdateModal(false);  }}
                                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={updateLoading || !updateActualBerthTime || !updateBerthDockId}
                                    >
                                        {updateLoading ? 'Updating...' : 'Update VVE'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            

            {/* Filters Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-between text-left mb-4"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-800">Search & Filter</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                        {showFilters ? 'Hide' : 'Show'} Filters
                    </span>
                </button>

                {showFilters && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Date Range */}
                            <div>
                                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date
                                </label>
                                <input
                                    id="fromDate"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date
                                </label>
                                <input
                                    id="toDate"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="">All Status</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Vessel Filter */}
                            <div>
                                <label htmlFor="vessel" className="block text-sm font-medium text-gray-700 mb-2">
                                    Vessel (IMO/Name)
                                </label>
                                <input
                                    id="vessel"
                                    type="text"
                                    placeholder="Search vessel..."
                                    value={vesselFilter}
                                    onChange={(e) => setVesselFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Berth Filter*/}
                            <div>
                                <label htmlFor="berth" className="block text-sm font-medium text-gray-700 mb-2">
                                    Berth Dock
                                </label>
                                <input
                                    id="berth"
                                    type="text"
                                    placeholder="Search berth/dock..."
                                    value={berthFilter}
                                    onChange={(e) => setBerthFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Filter className="w-5 h-5" />
                                        Search
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setStatusFilter('');
                                    setVesselFilter('');
                                    setBerthFilter(''); // limpar berth filter
                                    const defaultFromDate = new Date();
                                    defaultFromDate.setDate(defaultFromDate.getDate() - 30);
                                    setFromDate(defaultFromDate.toISOString().split('T')[0]);
                                    setToDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="btn btn-secondary"
                            >
                                Clear Filters
                            </button>

                            <div className="ml-auto flex gap-2">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 py-2 rounded-lg ${
                                        viewMode === 'table'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Table View
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`px-4 py-2 rounded-lg ${
                                        viewMode === 'timeline'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Timeline View
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && vves.length > 0 && (
                <>
                    {viewMode === 'table' ? (
                        /* Table View */
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Execution History ({vves.length} results)
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            VVE ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vessel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actual Arrival
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Berth Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Berth Dock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Arrival Delay
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Turnaround Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Operation Delay
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created By
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {vves.map((vve) => (
                                        <tr
                                            key={vve.vveId}
                                            onClick={() => setSelectedVve(vve)}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                                selectedVve?.vveId === vve.vveId
                                                    ? vve.status === 'In Progress'
                                                        ? 'bg-blue-100 border-l-4 border-blue-600' 
                                                        : 'bg-blue-50'
                                                    : ''
                                            } ${vve.status === 'In Progress' ? 'font-medium' : ''}`}                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {vve.vveId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <Ship className="w-4 h-4 text-gray-400" />
                                                    {vve.vesselIdentifier}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {vve.vvnData?.assignedDockName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDateTime(vve.actualArrivalTime)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDateTime(vve.actualBerthTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {vve.berthDockId || vve.vvnData?.assignedDockName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    {getDelayIndicator(vve.metrics?.arrivalDelay ?? null)}
                                                    <span className={
                                                        vve.metrics?.arrivalDelay !== undefined && vve.metrics?.arrivalDelay !== null && vve.metrics.arrivalDelay > 1
                                                            ? 'text-red-600 font-medium'
                                                            : vve.metrics?.arrivalDelay !== undefined && vve.metrics?.arrivalDelay !== null && vve.metrics.arrivalDelay < -1
                                                                ? 'text-green-600 font-medium'
                                                                : 'text-gray-700'
                                                    }>
                                                            {formatDuration(vve.metrics?.arrivalDelay ?? null)}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatDuration(vve.metrics?.totalTurnaroundTime ?? null)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    {getDelayIndicator(vve.metrics?.operationDelay ?? null)}
                                                    <span className={
                                                        vve.metrics?.operationDelay !== undefined && vve.metrics?.operationDelay !== null && vve.metrics.operationDelay > 1
                                                            ? 'text-red-600 font-medium'
                                                            : vve.metrics?.operationDelay !== undefined && vve.metrics?.operationDelay !== null && vve.metrics.operationDelay < -1
                                                                ? 'text-green-600 font-medium'
                                                                : 'text-gray-700'
                                                    }>
                                                            {formatDuration(vve.metrics?.operationDelay ?? null)}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(vve.status)}
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(vve.status)}`}>
                                                            {vve.status}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {vve.creatorEmail || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Timeline View */
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                Execution Timeline ({vves.length} results)
                            </h2>
                            <div className="space-y-4">
                                {vves.map((vve) => (
                                    <div key={vve.vveId} className="relative pl-8 pb-8 border-l-2 border-gray-300">
                                        {/* Timeline dot */}
                                        <div className="absolute left-0 top-0 -ml-2 flex items-center justify-center w-4 h-4">
                                            <div className={`w-4 h-4 rounded-full ${
                                                vve.status === 'Completed' ? 'bg-green-500' :
                                                    vve.status === 'In Progress' ? 'bg-blue-500' :
                                                        'bg-red-500'
                                            }`}></div>
                                        </div>

                                        {/* Event card */}
                                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                        <Ship className="w-5 h-5" />
                                                        {vve.vesselIdentifier}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{vve.vveId}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(vve.status)}`}>
                                                    {vve.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Arrival</p>
                                                    <p className="font-medium text-gray-900">{formatDateTime(vve.actualArrivalTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Berth Time</p>
                                                    <p className="font-medium">{formatDateTime(vve.actualBerthTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Turnaround Time</p>
                                                    <p className="font-medium">{formatDuration(vve.metrics?.totalTurnaroundTime ?? null)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Dock</p>
                                                    <p className="font-medium">{vve.berthDockId || vve.vvnData?.assignedDockName || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    {getDelayIndicator(vve.metrics?.arrivalDelay ?? null)}
                                                    <span>{formatDuration(vve.metrics?.arrivalDelay ?? null)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getDelayIndicator(vve.metrics?.operationDelay ?? null)}
                                                    <span>{formatDuration(vve.metrics?.operationDelay ?? null)}</span>
                                                </div>
                                            </div>
                                        </div>                                        
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* No Results */}
            {!loading && vves.length === 0 && !error && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Executions Found</h3>
                    <p className="text-gray-600">
                        No vessel visit executions match your search criteria. Try adjusting the filters.
                    </p>
                </div>
            )}

            {/* Operation Execution Tracking (US 4.1.9) */}
            {selectedVve && selectedVve.status === 'In Progress' && (
                <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Operation Execution Tracking</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Tracking operations for {selectedVve.vesselIdentifier} - {selectedVve.vveId}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {/* US 4.1.8: Update Berth Info Button */}
                            <button
                                onClick={() => {
                                    setShowUpdateModal(true);
                                }}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Update Berth Info
                            </button>
                            
                            {/* US 4.1.11: Mark as Completed Button */}
                            <button
                                onClick={() => {
                                    setVveToComplete(selectedVve);
                                    setUnfinishedOps([]);
                                    setShowCompleteModal(true);
                                }}
                                disabled={!selectedVve.executedOperations || selectedVve.executedOperations.length === 0}
                                title={
                                    !selectedVve.executedOperations || selectedVve.executedOperations.length === 0
                                        ? 'Cannot complete VVE: no cargo operations recorded. Please create and complete at least one operation.'
                                        : 'Mark this VVE as completed'
                                }
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark as Completed
                            </button>
                            
                            <button
                                onClick={() => setSelectedVve(null)}
                                className="px-4 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close Tracking
                            </button>
                        </div>
                    </div>
                    <OperationExecutionTable vveId={selectedVve.vveId} />
                </div>
            )}

            {/* Helper message when VVE is selected but not In Progress */}
            {selectedVve && selectedVve.status !== 'In Progress' && (
                <div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-medium text-gray-800">
                                    VVE is {selectedVve.status}
                                </h3>
                                {selectedVve.status === 'Completed' && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                        🔒 Read-Only
                                    </span>
                                )}
                            </div>
                            {selectedVve.status === 'Completed' && (
                                <div className="text-sm text-gray-700 space-y-1">
                                    <p>
                                        This VVE was completed and is now read-only. 
                                        Only administrators can make corrections.
                                    </p>
                                    {selectedVve.completedBy && (
                                        <p className="text-xs text-gray-600">
                                            <strong>Completed by:</strong> {selectedVve.completedBy}
                                            {selectedVve.completedAt && (
                                                <> on {new Date(selectedVve.completedAt).toLocaleString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</>
                                            )}
                                        </p>
                                    )}
                                    {selectedVve.actualUnberthTime && selectedVve.actualPortDepartureTime && (
                                        <p className="text-xs text-gray-600">
                                            <strong>Unberth:</strong> {new Date(selectedVve.actualUnberthTime).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })} | 
                                            <strong> Port Departure:</strong> {new Date(selectedVve.actualPortDepartureTime).toLocaleString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                </div>
                            )}
                            {selectedVve.status === 'Cancelled' && (
                                <p className="text-sm text-gray-700 mt-1">
                                    This VVE was cancelled and cannot be modified.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Helper message when no VVE is selected */}
            {!selectedVve && vves.length > 0 && (
                <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-blue-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-blue-800">
                                💡 Track Operation Execution
                            </h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Click on any "In Progress" VVE in the table above to view and manage its operations in real-time.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* US 4.1.11: Complete VVE Modal */}
            <CompleteVveModal
                vve={vveToComplete}
                isOpen={showCompleteModal}
                onClose={() => {
                    setShowCompleteModal(false);
                    setVveToComplete(null);
                    setUnfinishedOps([]);
                }}
                onConfirm={handleCompleteVve}
                unfinishedOperations={unfinishedOps}
            />

            {/* Toast Notifications */}
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setToastMessage(null)}
                    duration={5000}
                />
            )}
        </div>
    );
};

export default VesselVisitsExecutionPage;
