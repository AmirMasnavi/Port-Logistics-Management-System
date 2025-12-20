import React, { useState, useEffect } from 'react';
    import { Play, CheckCircle, Clock, AlertCircle, Loader2, Edit2, XCircle, PlusCircle } from 'lucide-react';
    import type { VveOperationsDetailedResponse, OperationComparison } from '../../domain/vve/operation-execution.types';
    import { vveService } from '../../services/vveService';
    import { useAuth } from '../../auth/AuthProvider';
    
    interface Props {
        vveId: string;
    }
    
    export const OperationExecutionTable: React.FC<Props> = ({ vveId }) => {
        const [data, setData] = useState<VveOperationsDetailedResponse | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [updatingOp, setUpdatingOp] = useState<string | null>(null);
        const { user } = useAuth();
        
        // Modal states
        const [showEditModal, setShowEditModal] = useState(false);
        const [editingOperation, setEditingOperation] = useState<OperationComparison | null>(null);
        const [editStatus, setEditStatus] = useState<'STARTED' | 'COMPLETED' | 'SUSPENDED'>('STARTED');
        const [editStartTime, setEditStartTime] = useState<string>('');
        const [editEndTime, setEditEndTime] = useState<string>('');
        const [editResourceId, setEditResourceId] = useState<string>('');
        const [editNotes, setEditNotes] = useState<string>('');
        
        // Add Operation modal states
        const [showAddModal, setShowAddModal] = useState(false);
        const [newOperationId, setNewOperationId] = useState<string>('');
        const [newStatus, setNewStatus] = useState<'STARTED' | 'COMPLETED' | 'SUSPENDED'>('STARTED');
        const [newStartTime, setNewStartTime] = useState<string>('');
        const [newEndTime, setNewEndTime] = useState<string>('');
        const [newResourceId, setNewResourceId] = useState<string>('');
        const [newNotes, setNewNotes] = useState<string>('');
    
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
    
        useEffect(() => {
            loadData();
            // Optional: Auto-refresh every 30 seconds
            const interval = setInterval(loadData, 30000);
            return () => clearInterval(interval);
        }, [vveId]);
    
        // Open edit modal with operation details
        const openEditModal = (operation: OperationComparison) => {
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
            
            setEditResourceId(operation.actualResource || operation.plannedResource || '');
            setEditNotes(operation.notes || '');
            setShowEditModal(true);
        };
        
        // Handle detailed operation update from modal
        const handleDetailedUpdate = async (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!user?.uid || !editingOperation) {
                alert('User not authenticated or no operation selected');
                return;
            }
            
            try {
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
                
                // Add notes if provided
                if (editNotes) {
                    updateData.notes = editNotes;
                }
                
                await vveService.updateOperationStatus(vveId, editingOperation.operationId, updateData);
                
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
            const now = new Date();
            const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            
            setNewOperationId('');
            setNewStatus('STARTED');
            setNewStartTime(localNow);
            setNewEndTime('');
            setNewResourceId('');
            setNewNotes('');
            setShowAddModal(true);
        };
        
        // Handle adding new operation
        const handleAddOperation = async (e: React.FormEvent) => {
            e.preventDefault();
            
            if (!user?.uid) {
                alert('User not authenticated');
                return;
            }
            
            if (!newOperationId.trim()) {
                alert('Operation ID is required');
                return;
            }
            
            try {
                setUpdatingOp(newOperationId);
                
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
                
                if (newNotes) {
                    addData.notes = newNotes;
                }
                
                await vveService.updateOperationStatus(vveId, newOperationId, addData);
                
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
    
            try {
                setUpdatingOp(opId);
                await vveService.updateOperationStatus(vveId, opId, {
                    status: newStatus,
                    timestamp: new Date().toISOString(),
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
    
        // Get status badge styling
        const getStatusBadge = (status: string) => {
            const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1';
            
            switch (status) {
                case 'COMPLETED':
                    return `${baseClasses} bg-green-100 text-green-800`;
                case 'STARTED':
                    return `${baseClasses} bg-blue-100 text-blue-800`;
                case 'DELAYED':
                    return `${baseClasses} bg-red-100 text-red-800 animate-pulse`;
                case 'SUSPENDED':
                    return `${baseClasses} bg-yellow-100 text-yellow-800`;
                default: // PENDING
                    return `${baseClasses} bg-gray-100 text-gray-800`;
            }
        };
    
        // Get status icon
        const getStatusIcon = (status: string) => {
            switch (status) {
                case 'COMPLETED':
                    return <CheckCircle className="h-4 w-4" />;
                case 'STARTED':
                    return <Play className="h-4 w-4" />;
                case 'DELAYED':
                    return <AlertCircle className="h-4 w-4" />;
                default:
                    return <Clock className="h-4 w-4" />;
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
            <div className="space-y-4">
                {/* Header Info */}
                <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {data.vesselIdentifier}
                        </h3>
                        <p className="text-sm text-gray-600">VVE: {data.vveId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            {data.planExists ? (
                                <div className="text-sm">
                                    <span className="text-gray-600">Plan:</span>{' '}
                                    <span className="font-medium text-blue-600">{data.planId}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-yellow-600">
                                    <AlertCircle className="inline h-4 w-4 mr-1" />
                                    No operation plan found
                                </div>
                            )}
                        </div>
                        {/* Add Operation Button */}
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Add a new operation manually"
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Operation
                        </button>
                    </div>
                </div>
    
                {/* Operations Progress */}
                {data.operations.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Progress</h4>
                            <span className="text-sm text-gray-600">
                                {data.operations.filter(op => op.computedStatus === 'COMPLETED').length} / {data.operations.length} completed
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${(data.operations.filter(op => op.computedStatus === 'COMPLETED').length / data.operations.length) * 100}%`
                                }}
                            />
                        </div>
                    </div>
                )}
    
                {/* Operations Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Operation
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Planned Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actual Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Resource
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.operations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No operations found for this vessel visit
                                        </td>
                                    </tr>
                                ) : (
                                    data.operations.map((op) => (
                                        <tr
                                            key={op.operationId}
                                            className={`hover:bg-gray-50 ${op.computedStatus === 'DELAYED' ? 'bg-red-50' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {op.operationId}
                                                </div>
                                                {op.vesselImo && (
                                                    <div className="text-xs text-gray-500">{op.vesselImo}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatTime(op.plannedStartTime)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    to {formatTime(op.plannedEndTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatTime(op.actualStartTime)}
                                                </div>
                                                {op.actualEndTime && (
                                                    <div className="text-xs text-gray-500">
                                                        to {formatTime(op.actualEndTime)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="text-gray-900">
                                                    {op.actualResource || op.plannedResource || '-'}
                                                </div>
                                                {op.actualResource && op.actualResource !== op.plannedResource && (
                                                    <div className="text-xs text-orange-600">
                                                        (planned: {op.plannedResource})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={getStatusBadge(op.computedStatus)}>
                                                    {getStatusIcon(op.computedStatus)}
                                                    {op.computedStatus}
                                                </span>
                                                {op.delayMinutes != null && op.delayMinutes > 0 && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        +{op.delayMinutes} min delay
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {updatingOp === op.operationId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {/* Quick action buttons */}
                                                        <div className="flex items-center gap-2">
                                                            {op.computedStatus === 'PENDING' || op.computedStatus === 'DELAYED' ? (
                                                                <button
                                                                    onClick={() => handleStatusChange(op.operationId, 'STARTED')}
                                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                                >
                                                                    <Play className="h-3 w-3 mr-1" />
                                                                    Start
                                                                </button>
                                                            ) : op.computedStatus === 'STARTED' ? (
                                                                <button
                                                                    onClick={() => handleStatusChange(op.operationId, 'COMPLETED')}
                                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                                >
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Complete
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">Done</span>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Edit button - ALWAYS VISIBLE with text label */}
                                                        {op.computedStatus !== 'COMPLETED' && (
                                                            <button
                                                                onClick={() => openEditModal(op)}
                                                                className="inline-flex items-center justify-center px-3 py-1.5 border-2 border-orange-400 text-xs font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                                                                title="Edit operation details (modify time, resource, status)"
                                                            >
                                                                <Edit2 className="h-3 w-3 mr-1" />
                                                                Edit Details
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
                                <input
                                    type="text"
                                    value={editResourceId}
                                    onChange={(e) => setEditResourceId(e.target.value)}
                                    placeholder="e.g., CRANE-02, FORKLIFT-05"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    If different from planned resource: {editingOperation.plannedResource || 'None'}
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

                            {/* Operation ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operation ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newOperationId}
                                    onChange={(e) => setNewOperationId(e.target.value)}
                                    placeholder="e.g., OP-001, LOAD-CONTAINER-123"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Unique identifier for this operation
                                </p>
                            </div>

                            {/* Status Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Initial Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as 'STARTED' | 'COMPLETED' | 'SUSPENDED')}
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
                                <input
                                    type="text"
                                    value={newResourceId}
                                    onChange={(e) => setNewResourceId(e.target.value)}
                                    placeholder="e.g., CRANE-01, FORKLIFT-05, LOADER-03"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
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