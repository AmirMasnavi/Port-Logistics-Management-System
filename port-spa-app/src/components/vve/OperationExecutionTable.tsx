import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, AlertCircle, Loader2, Edit2, XCircle, PlusCircle, RefreshCw, Ship } from 'lucide-react';
import type { VveOperationsDetailedResponse, OperationComparison } from '../../domain/vve/operation-execution.types';
import { vveService } from '../../services/vveService';
import { useAuth } from '../../auth/AuthProvider';
import { resourceApiRepository } from '../../infrastructure/repositories/resource/resourceApi.repository';
import { ResourceService } from '../../app/resource/resource.service';
import type { Resource } from '../../domain/resource/resource.model';

    // Extract friendly operation name from operation ID (fallback)
    const extractOperationName = (opId: string): string => {
        // New Smart Operation IDs
        if (opId.includes('_wait_1')) return 'Safety Clearance & Positioning';
        if (opId.includes('_unload_1')) return 'Deck/Hatch Clearance';
        if (opId.includes('_unload_2')) return 'Principal Cargo Discharge';
        if (opId.includes('_load_1')) return 'Principal Cargo Loading';
        if (opId.includes('_load_2')) return 'Lashing & Securing';

        // Legacy / Fallback
        // Loading operations
        if (opId.includes('_exec_1') && opId.toLowerCase().includes('load')) return 'Position Crane & Secure Cargo';
        if (opId.includes('_exec_2') && opId.toLowerCase().includes('load')) return 'Lift Cargo from Dock';
        if (opId.includes('_exec_3') && opId.toLowerCase().includes('load')) return 'Transfer Cargo to Vessel';
        if (opId.includes('_exec_4') && opId.toLowerCase().includes('load')) return 'Place & Secure Cargo in Hold';
        if (opId.includes('_prep') && opId.toLowerCase().includes('load')) return 'Pre-Loading Inspection & Safety Check';
        if (opId.includes('_comp') && opId.toLowerCase().includes('load')) return 'Final Cargo Securing & Documentation';
        
        // Unloading operations
        if (opId.includes('_exec_1') && opId.toLowerCase().includes('unload')) return 'Release Cargo Securing in Hold';
        if (opId.includes('_exec_2') && opId.toLowerCase().includes('unload')) return 'Lift Cargo from Vessel';
        if (opId.includes('_exec_3') && opId.toLowerCase().includes('unload')) return 'Transfer Cargo to Dock';
        if (opId.includes('_exec_4') && opId.toLowerCase().includes('unload')) return 'Place Cargo in Storage Area';
        if (opId.includes('_prep') && opId.toLowerCase().includes('unload')) return 'Pre-Unloading Inspection & Safety Check';
        if (opId.includes('_comp') && opId.toLowerCase().includes('unload')) return 'Final Inspection & Documentation';
        
        // Generic operations
        if (opId.includes('_prep')) return 'Safety Check & Equipment Setup';
        if (opId.includes('_exec_1')) return 'Primary Operation (Part 1)';
        if (opId.includes('_exec_2')) return 'Primary Operation (Part 2)';
        if (opId.includes('_exec_3')) return 'Primary Operation (Part 3)';
        if (opId.includes('_exec_4')) return 'Primary Operation (Part 4)';
        if (opId.includes('_comp')) return 'Final Verification & Teardown';
        if (opId.includes('_single')) return 'Cargo Operation';
        return 'Operation';
    };

    // Extract operation type from operation ID (fallback)
    const extractOperationType = (opId: string): string => {
        if (opId.toLowerCase().includes('wait')) return 'WAITING';
        if (opId.toLowerCase().includes('load') && !opId.toLowerCase().includes('unload')) return 'LOADING';
        if (opId.toLowerCase().includes('unload')) return 'UNLOADING';
        return 'Other';
    };

    interface Props {
        vveId: string;
    }
    
    export const OperationExecutionTable: React.FC<Props> = ({ vveId }) => {
    const [data, setData] = useState<VveOperationsDetailedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingOp, setUpdatingOp] = useState<string | null>(null);
    const { user } = useAuth();
    
    // Resources state
    const [resources, setResources] = useState<Resource[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);
    
    // Modal states
        const [showEditModal, setShowEditModal] = useState(false);
        const [editingOperation, setEditingOperation] = useState<OperationComparison | null>(null);
        const [editStatus, setEditStatus] = useState<'STARTED' | 'COMPLETED' | 'SUSPENDED'>('STARTED');
        const [editStartTime, setEditStartTime] = useState<string>('');
        const [editEndTime, setEditEndTime] = useState<string>('');
        const [editResourceId, setEditResourceId] = useState<string>('');
        const [editNotes, setEditNotes] = useState<string>('');
        const [editName, setEditName] = useState<string>('');
        const [editType, setEditType] = useState<'WAITING' | 'UNLOADING' | 'LOADING' | 'Other'>('Other');
        
        // Add Operation modal states
        const [showAddModal, setShowAddModal] = useState(false);
        const [newOperationId, setNewOperationId] = useState<string>('');
        const [newStatus, setNewStatus] = useState<'PENDING' | 'STARTED' | 'COMPLETED' | 'SUSPENDED'>('PENDING');
        const [newStartTime, setNewStartTime] = useState<string>('');
        const [newEndTime, setNewEndTime] = useState<string>('');
        const [newResourceId, setNewResourceId] = useState<string>('');
        const [newNotes, setNewNotes] = useState<string>('');
        const [newName, setNewName] = useState<string>('');
        const [newType, setNewType] = useState<'WAITING' | 'UNLOADING' | 'LOADING' | 'Other'>('LOADING');
    
        // Load operation data
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await vveService.getVveOperationsDetailed(vveId);
            setData(response);
        } catch (err) {
            console.error('Error loading operations:', err);
            setError('Failed to load operations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load resources
    const loadResources = async () => {
        try {
            setLoadingResources(true);
            const resourceService = new ResourceService(resourceApiRepository);
            const fetchedResources = await resourceService.fetchAllResources();
            setResources(fetchedResources);
        } catch (err) {
            console.error('Error loading resources:', err);
        } finally {
            setLoadingResources(false);
        }
    };

    // Get resource name by ID
    const getResourceName = (resourceId: string | undefined): string => {
        if (!resourceId) return '-';
        const resource = resources.find(r => r.code === resourceId);
        return resource ? resource.description : resourceId;
    };
    
        useEffect(() => {
        loadData();
        loadResources(); // Load resources once on mount
        // Note: Auto-refresh disabled to prevent unwanted table refreshes
        // Users can manually refresh if needed
    }, [vveId]);
    
        // Open edit modal with operation details
        const openEditModal = (operation: OperationComparison) => {
            console.log('Opening edit modal for operation:', operation);
            setEditingOperation(operation);
            
            // Pre-fill form with existing data or defaults
            if (operation.executedStatus) {
                setEditStatus(operation.executedStatus as 'STARTED' | 'COMPLETED' | 'SUSPENDED');
            } else {
                setEditStatus('STARTED');
            }
            
            // Format times for datetime-local input
            const now = new Date();
            const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            
            try {
                setEditStartTime(
                    operation.actualStartTime 
                        ? new Date(operation.actualStartTime).toISOString().slice(0, 16)
                        : localNow
                );
                
                setEditEndTime(
                    operation.actualEndTime 
                        ? new Date(operation.actualEndTime).toISOString().slice(0, 16)
                        : ''
                );
            } catch (error) {
                console.error('Error formatting dates:', error);
                setEditStartTime(localNow);
                setEditEndTime('');
            }
            
            setEditResourceId(operation.actualResource || operation.plannedResource || '');
            setEditNotes(operation.notes || '');
            setEditName(operation.name || extractOperationName(operation.operationId));
            
            // Ensure we only set valid type values
            const validTypes: Array<'WAITING' | 'UNLOADING' | 'LOADING' | 'Other'> = 
                ['WAITING', 'UNLOADING', 'LOADING', 'Other'];
            const opType = operation.type && validTypes.includes(operation.type as any) 
                ? operation.type 
                : 'Other';
            setEditType(opType as any);
            
            setShowEditModal(true);
        };
        
        // Handle detailed operation update from modal
        const handleDetailedUpdate = async (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!user?.uid || !editingOperation) {
                console.error('Update failed: User not authenticated or no operation selected', { user: !!user, editingOperation });
                alert('User not authenticated or no operation selected');
                return;
            }
            
            try {
                console.log('Updating operation:', editingOperation.operationId);
                setUpdatingOp(editingOperation.operationId);
                
                // Prepare update data
                const updateData: any = {
                    status: editStatus,
                };
                
                // Add timestamp based on status
                if (editStatus === 'STARTED' && editStartTime) {
                    updateData.timestamp = new Date(editStartTime).toISOString();
                } else if (editStatus === 'COMPLETED' && editEndTime) {
                    updateData.timestamp = new Date(editEndTime).toISOString();
                } else {
                    updateData.timestamp = new Date().toISOString();
                }
                
                // Add resource if changed
                if (editResourceId && editResourceId !== editingOperation.plannedResource) {
                    updateData.resourceId = editResourceId;
                }
                
                // Add name if provided
                if (editName && editName.trim() !== '') {
                    updateData.name = editName;
                }
                
                // Add type
                if (editType) {
                    updateData.type = editType;
                }
                
                // Add notes if provided
                if (editNotes) {
                    updateData.notes = editNotes;
                }
                
                console.log('Sending update data:', updateData);
                await vveService.updateOperationStatus(vveId, editingOperation.operationId, updateData);
                console.log('Operation updated successfully');
                
                // Close modal and refresh data
                setShowEditModal(false);
                setEditingOperation(null);
                await loadData();
            } catch (err) {
                console.error('Error updating operation:', err);
                alert('Failed to update operation. Please try again.');
            } finally {
                setUpdatingOp(null);
            }
        };
        
        // Open add operation modal
        const openAddModal = () => {
            setNewOperationId('');
            setNewStatus('PENDING');
            setNewStartTime('');
            setNewEndTime('');
            setNewResourceId('');
            setNewNotes('');
            setNewName('');
            setNewType('LOADING');
            setShowAddModal(true);
        };
        
        // Handle adding new operation
        const handleAddOperation = async (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!user?.uid) {
                alert('User not authenticated');
                return;
            }
            
            // Auto-generate ID if not provided (though we removed the input, so it will be empty)
            const opId = newOperationId.trim() || `OP-${Date.now()}`;
            
            try {
                setUpdatingOp(opId);
                
                const addData: any = {
                    status: newStatus,
                };
                
                // Add timestamp based on status
                if (newStatus === 'STARTED' && newStartTime) {
                    addData.timestamp = new Date(newStartTime).toISOString();
                } else if (newStatus === 'COMPLETED' && newEndTime) {
                    addData.timestamp = new Date(newEndTime).toISOString();
                } else {
                    addData.timestamp = new Date().toISOString();
                }
                
                if (newResourceId) {
                    addData.resourceId = newResourceId;
                }
                
                if (newName && newName.trim() !== '') {
                    addData.name = newName;
                }
                
                if (newType) {
                    addData.type = newType;
                }
                
                if (newNotes) {
                    addData.notes = newNotes;
                }
                
                await vveService.updateOperationStatus(vveId, opId, addData);
                
                // Close modal and refresh
                setShowAddModal(false);
                await loadData();
            } catch (err) {
                console.error('Error adding operation:', err);
                alert('Failed to add operation. Please try again.');
            } finally {
                setUpdatingOp(null);
            }
        };
    
        // Handle status change
        const handleStatusChange = async (opId: string, newStatus: 'STARTED' | 'COMPLETED') => {
            if (!user?.uid) {
                alert('User not authenticated');
                return;
            }

            // Find the operation to get its current type and name
            const operation = data?.operations.find(op => op.operationId === opId);
            const type = operation?.type || extractOperationType(opId);
            const name = operation?.name || extractOperationName(opId);

            try {
                setUpdatingOp(opId);
                await vveService.updateOperationStatus(vveId, opId, {
                    status: newStatus,
                    timestamp: new Date().toISOString(),
                    type: type as any,
                    name: name
                });

                // Refresh data to show updated status
                await loadData();
            } catch (err) {
                console.error('Error updating status:', err);
                alert('Failed to update operation status. Please try again.');
            } finally {
                setUpdatingOp(null);
            }
        };
    
    // Modern status badge with vibrant colors
    const getStatusBadge = (status: string) => {
        const baseClasses = 'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-2 shadow-sm transition-all duration-200 hover:shadow-md';
        
        switch (status) {
            case 'COMPLETED':
                return `${baseClasses} bg-gradient-to-r from-green-500 to-emerald-600 text-white`;
            case 'STARTED':
                return `${baseClasses} bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-pulse`;
            case 'DELAYED':
                return `${baseClasses} bg-gradient-to-r from-red-500 to-rose-600 text-white animate-pulse`;
            case 'SUSPENDED':
                return `${baseClasses} bg-gradient-to-r from-yellow-400 to-orange-500 text-white`;
            default: // PENDING
                return `${baseClasses} bg-gradient-to-r from-gray-400 to-slate-500 text-white`;
        }
    };
    
    // Status icons with better visuals
    const getStatusIcon = (status: string) => {
        const iconClass = "h-4 w-4";
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className={iconClass} />;
            case 'STARTED':
                return <Play className={iconClass} />;
            case 'DELAYED':
                return <AlertCircle className={iconClass} />;
            case 'SUSPENDED':
                return <XCircle className={iconClass} />;
            default: // PENDING
                return <Clock className={iconClass} />;
        }
    };
    
        // Format time
        const formatTime = (isoString?: string) => {
            if (!isoString) return '-';
            return new Date(isoString).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        };
    
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading operations...</span>
                </div>
            );
        }
    
        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            );
        }
    
        if (!data) {
            return (
                <div className="text-center py-12 text-gray-500">
                    No operation data available
                </div>
            );
        }
    
        return (
            <>
            <div className="space-y-6">
                {/* Modern Header Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Ship className="h-8 w-8" />
                                <h3 className="text-2xl font-bold">
                                    {data.vesselIdentifier}
                                </h3>
                            </div>
                            <p className="text-blue-100 text-sm">VVE: {data.vveId}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {data.planExists ? (
                                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                                    <div className="text-xs text-blue-100 mb-1">Operation Plan</div>
                                    <div className="font-bold text-white">{data.planId}</div>
                                </div>
                            ) : (
                                <div className="bg-yellow-400 bg-opacity-90 rounded-xl px-4 py-3 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-900" />
                                    <span className="text-sm font-semibold text-yellow-900">No Plan</span>
                                </div>
                            )}
                            
                            {/* Add Operation Button - Always visible for manual operations */}
                            <button
                                onClick={openAddModal}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                                title="Create a new operation manually"
                            >
                                <PlusCircle className="h-5 w-5" />
                                Create Operation
                            </button>
                            
                            {/* Manual Refresh Button */}
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-xl p-3 transition-all duration-200 disabled:opacity-50"
                                title="Refresh operations data"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
    
                {/* Operations Progress Card */}
                {data.operations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                            {/* Progress Stats */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Total</div>
                                <div className="text-3xl font-bold text-gray-900">{data.operations.length}</div>
                                <div className="text-xs text-gray-500 mt-1">Operations</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg p-4 border border-gray-300">
                                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Pending</div>
                                <div className="text-3xl font-bold text-slate-700">
                                    {data.operations.filter(op => op.computedStatus === 'PENDING').length}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Waiting</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border border-blue-200">
                                <div className="text-xs text-blue-700 font-semibold uppercase mb-1">Started</div>
                                <div className="text-3xl font-bold text-blue-700">
                                    {data.operations.filter(op => op.computedStatus === 'STARTED').length}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">In Progress</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-green-700 font-semibold uppercase mb-1">Completed</div>
                                <div className="text-3xl font-bold text-green-700">
                                    {data.operations.filter(op => op.computedStatus === 'COMPLETED').length}
                                </div>
                                <div className="text-xs text-green-600 mt-1">Done</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-lg p-4 border border-red-200">
                                <div className="text-xs text-red-700 font-semibold uppercase mb-1">Issues</div>
                                <div className="text-3xl font-bold text-red-700">
                                    {data.operations.filter(op => op.computedStatus === 'DELAYED' || op.computedStatus === 'SUSPENDED').length}
                                </div>
                                <div className="text-xs text-red-600 mt-1">Attention</div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-gray-700">Overall Progress</span>
                                <span className="text-gray-600">
                                    {data.operations.filter(op => op.computedStatus === 'COMPLETED').length} / {data.operations.length} completed
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                                    style={{
                                        width: `${(data.operations.filter(op => op.computedStatus === 'COMPLETED').length / data.operations.length) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
    
                {/* Operations Table - Modern Design */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Operation
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Planned Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actual Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Resource
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {data.operations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <AlertCircle className="h-12 w-12 mb-3" />
                                                <p className="text-lg font-medium">No operations found</p>
                                                <p className="text-sm mt-1">This vessel visit has no scheduled operations yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.operations.map((op, index) => (
                                        <tr
                                            key={op.operationId}
                                            className={`
                                                transition-all duration-200 hover:bg-gray-50
                                                ${op.computedStatus === 'DELAYED' ? 'bg-red-50 border-l-4 border-red-500' : ''}
                                                ${op.computedStatus === 'STARTED' ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                                                ${op.computedStatus === 'COMPLETED' ? 'bg-green-50 border-l-4 border-green-500' : ''}
                                                ${op.computedStatus === 'SUSPENDED' ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}
                                            `}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 mb-1">
                                                            {op.name || extractOperationName(op.operationId)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                                                                {op.type || extractOperationType(op.operationId)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm">
                                                    <div className="text-gray-900 font-medium">
                                                        {formatTime(op.plannedStartTime)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        to {formatTime(op.plannedEndTime)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm">
                                                    {op.actualStartTime ? (
                                                        <>
                                                            <div className="text-gray-900 font-medium">
                                                                {formatTime(op.actualStartTime)}
                                                            </div>
                                                            {op.actualEndTime && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    to {formatTime(op.actualEndTime)}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm italic">Not started</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm">
                                                <div>
                                                    <div className="text-gray-900 font-medium">
                                                        {getResourceName(op.actualResource || op.plannedResource)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-2">
                                                    <span className={getStatusBadge(op.computedStatus)}>
                                                        {getStatusIcon(op.computedStatus)}
                                                        {op.computedStatus}
                                                    </span>
                                                    {op.delayMinutes != null && op.delayMinutes > 0 && (
                                                        <div className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            +{op.delayMinutes} min delay
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {updatingOp === op.operationId ? (
                                                    <div className="flex items-center justify-center">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {/* Status Change Buttons */}
                                                        {op.computedStatus === 'PENDING' || op.computedStatus === 'DELAYED' ? (
                                                            <button
                                                                onClick={() => handleStatusChange(op.operationId, 'STARTED')}
                                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                                                            >
                                                                <Play className="h-4 w-4 mr-1" />
                                                                Start Now
                                                            </button>
                                                        ) : op.computedStatus === 'STARTED' ? (
                                                            <button
                                                                onClick={() => handleStatusChange(op.operationId, 'COMPLETED')}
                                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Complete
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs font-medium text-center py-2">
                                                                ✓ Done
                                                            </span>
                                                        )}

                                                        {/* Edit Button - Always visible for non-completed */}
                                                        {op.computedStatus !== 'COMPLETED' && (
                                                            <button
                                                                onClick={() => openEditModal(op)}
                                                                className="inline-flex items-center justify-center px-4 py-2 border-2 border-orange-400 text-xs font-bold rounded-lg text-orange-700 bg-white hover:bg-orange-50 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Edit details"
                                                            >
                                                                <Edit2 className="h-3 w-3 mr-1" />
                                                                Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Edit Operation Modal */}
            {showEditModal && editingOperation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Edit Operation: {editingOperation.operationId}
                            </h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleDetailedUpdate} className="p-6 space-y-4">
                            {/* Current Status Info */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Current Information</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Planned Resource:</span>{' '}
                                        <span className="font-medium">{editingOperation.plannedResource || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Current Status:</span>{' '}
                                        <span className="font-medium">{editingOperation.computedStatus}</span>
                                    </div>
                                    {editingOperation.delayMinutes != null && editingOperation.delayMinutes > 0 && (
                                        <div className="col-span-2">
                                            <span className="text-red-600">⚠️ Delayed by {editingOperation.delayMinutes} minutes</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operation Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operation Name
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="e.g., Lift Cargo from Vessel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Descriptive name for this operation
                                </p>
                            </div>

                            {/* Operation Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operation Type
                                </label>
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="WAITING">WAITING</option>
                                    <option value="LOADING">LOADING</option>
                                    <option value="UNLOADING">UNLOADING</option>
                                    <option value="Other">Other</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Type of cargo operation
                                </p>
                            </div>

                            {/* Status Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operation Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as 'STARTED' | 'COMPLETED' | 'SUSPENDED')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="STARTED">Started</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    When the operation was actually started
                                </p>
                            </div>

                            {/* End Time - only show if status is COMPLETED */}
                            {editStatus === 'COMPLETED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required={editStatus === 'COMPLETED'}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        When the operation was completed
                                    </p>
                                </div>
                            )}

                            {/* Resource Used */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource Used
                                </label>
                                <select
                                    value={editResourceId}
                                    onChange={(e) => setEditResourceId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loadingResources}
                                >
                                    <option value="">-- Select Resource --</option>
                                    {resources.map((resource) => (
                                        <option key={resource.code} value={resource.code}>
                                            {resource.description}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {editingOperation.plannedResource 
                                        ? `Planned: ${getResourceName(editingOperation.plannedResource)}`
                                        : 'No planned resource'}
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add any relevant notes about this operation execution..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Document delays, resource changes, or any issues
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingOp === editingOperation.operationId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {updatingOp === editingOperation.operationId ? (
                                        <>
                                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Operation'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Add Operation Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Add New Operation
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddOperation} className="p-6 space-y-4">
                            {/* Info Message */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-sm font-semibold text-blue-900 mb-1">💡 Manual Operation Entry</h3>
                                <p className="text-sm text-blue-800">
                                    Add operations manually when no operation plan exists or to record additional unplanned operations.
                                </p>
                            </div>

                            {/* Operation Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operation Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Lift Cargo from Vessel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Descriptive name for this operation
                                </p>
                            </div>

                            {/* Operation Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operation Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="WAITING">WAITING</option>
                                    <option value="LOADING">LOADING</option>
                                    <option value="UNLOADING">UNLOADING</option>
                                    <option value="Other">Other</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Type of cargo operation
                                </p>
                            </div>

                            {/* Status Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Initial Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as 'PENDING' | 'STARTED' | 'COMPLETED' | 'SUSPENDED')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="STARTED">Started</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                            </div>

                            {/* Start Time */}
                            {newStatus !== 'PENDING' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newStartTime}
                                        onChange={(e) => setNewStartTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        When the operation started
                                    </p>
                                </div>
                            )}

                            {/* End Time - only show if status is COMPLETED */}
                            {newStatus === 'COMPLETED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newEndTime}
                                        onChange={(e) => setNewEndTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required={newStatus === 'COMPLETED'}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        When the operation was completed
                                    </p>
                                </div>
                            )}

                            {/* Resource Used */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource Used
                                </label>
                                <select
                                    value={newResourceId}
                                    onChange={(e) => setNewResourceId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loadingResources}
                                >
                                    <option value="">-- Select Resource --</option>
                                    {resources.map((resource) => (
                                        <option key={resource.code} value={resource.code}>
                                            {resource.description}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Equipment or resource used for this operation
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add any relevant notes about this operation..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Optional: Document details, issues, or special circumstances
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingOp === newOperationId}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {updatingOp === newOperationId ? (
                                        <>
                                            <Loader2 className="inline h-4 w-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="h-4 w-4" />
                                            Add Operation
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </>
        );
    };