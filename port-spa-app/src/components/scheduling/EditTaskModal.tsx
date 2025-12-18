import React, { useState } from 'react';
                import type { ScheduledTask } from '../../types/scheduling.types';
                import { X, AlertTriangle, CheckCircle, Clock, User, Anchor, Truck } from 'lucide-react';
                
                interface EditTaskModalProps {
                    loadingSelectionData: boolean;
                    availableStaff: { id: string; name: string; role?: string }[];
                    availableResources: { id: string; name: string; type?: string }[];
                    setEditForm: (form: any) => void;
                    editForm: {
                        reason: string;
                        endTime?: string;
                        startTime?: string;
                        staffId?: string;
                        resourceId?: string;
                    };
                    onSave: (e: React.FormEvent, confirmWarnings?: boolean) => Promise<string[] | void>;
                    task: ScheduledTask | null;
                    onClose: () => void;
                    isOpen: boolean;
                }
                
                const formatForInput = (iso?: string) => {
                    if (!iso) return '';
                    try {
                        return new Date(iso).toISOString().slice(0, 16);
                    } catch {
                        return '';
                    }
                };
                
                const EditTaskModal: React.FC<EditTaskModalProps> = ({
                    loadingSelectionData,
                    availableStaff,
                    availableResources,
                    setEditForm,
                    editForm,
                    onSave,
                    task,
                    onClose,
                    isOpen,
                }) => {
                    const [warnings, setWarnings] = useState<string[]>([]);
                    const [showConfirmation, setShowConfirmation] = useState(false);

                    if (!isOpen || !task) return null;

                    const handleSubmit = async (e: React.FormEvent) => {
                        e.preventDefault();
                        const result = await onSave(e, false);
                        if (result && result.length > 0) {
                            setWarnings(result);
                            setShowConfirmation(true);
                        }
                    };

                    const handleConfirm = async (e: React.FormEvent) => {
                        e.preventDefault();
                        await onSave(e, true);
                        setShowConfirmation(false);
                        setWarnings([]);
                    };
                
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {showConfirmation ? 'Confirm Changes' : 'Edit Scheduled Task'}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            IMO: {task.vesselImo} <Anchor className="w-3 h-3" />
                                        </p>
                                    </div>
                                    <button
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                        onClick={() => {
                                            onClose();
                                            setShowConfirmation(false);
                                            setWarnings([]);
                                        }}
                                        aria-label="Close"
                                        type="button"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                
                                {showConfirmation ? (
                                    <div className="p-6 space-y-5">
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-amber-800">Potential Conflicts Detected</h4>
                                                    <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                                                        {warnings.map((warning, idx) => (
                                                            <li key={idx}>{warning}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Are you sure you want to proceed with these changes despite the warnings?
                                        </p>
                                        <div className="flex justify-end gap-3 pt-2 mt-4 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowConfirmation(false);
                                                    setWarnings([]);
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                            >
                                                Back to Edit
                                            </button>
                                            <button
                                                onClick={handleConfirm}
                                                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-sm transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Confirm Anyway
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Body */
                                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <div>Start Time</div>
                                            <Clock className="w-4 h-4 text-green-500" />
                                        </label>
                                        <input
                                            required
                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            onChange={e => setEditForm({ ...editForm, startTime: new Date(e.target.value).toISOString() })}
                                            value={formatForInput(editForm.startTime)}
                                            type="datetime-local"
                                        />
                
                                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <div>End Time</div>
                                            <Clock className="w-4 h-4 text-red-500" />
                                        </label>
                                        <input
                                            required
                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                            onChange={e => setEditForm({ ...editForm, endTime: new Date(e.target.value).toISOString() })}
                                            value={formatForInput(editForm.endTime)}
                                            type="datetime-local"
                                        />
                                    </div>
                
                                    {/* Staff Selection */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <div>Staff Assignment</div>
                                            <User className="w-4 h-4 text-purple-500" />
                                        </label>
                
                                        {loadingSelectionData ? (
                                            <div className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 animate-pulse">
                                                Loading staff...
                                            </div>
                                        ) : (
                                            <select
                                                required
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none"
                                                onChange={e => setEditForm({ ...editForm, staffId: e.target.value })}
                                                value={editForm.staffId || ''}
                                            >
                                                <option value="">Select Staff Member</option>
                                                {editForm.staffId && !availableStaff.find(s => s.id === editForm.staffId) && (
                                                    <option value={editForm.staffId}>{editForm.staffId} (Current)</option>
                                                )}
                                                {availableStaff.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name.replace(' (Unknown)', '')} {s.role ? `(${s.role})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                
                                    {/* Resource Selection */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <div>Resource Assignment</div>
                                            <Truck className="w-4 h-4 text-blue-500" />
                                        </label>
                
                                        {loadingSelectionData ? (
                                            <div className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 animate-pulse">
                                                Loading resources...
                                            </div>
                                        ) : (
                                            <select
                                                required
                                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                                                onChange={e => setEditForm({ ...editForm, resourceId: e.target.value })}
                                                value={editForm.resourceId || ''}
                                            >
                                                <option value="">Select Resource</option>
                                                {editForm.resourceId && !availableResources.find(r => r.id === editForm.resourceId) && (
                                                    <option value={editForm.resourceId}>{editForm.resourceId} (Current)</option>
                                                )}
                                                {availableResources.map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name} {r.type ? `(${r.type})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                
                                    {/* Reason */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <div>Reason for Change</div>
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        </label>
                                        <textarea
                                            placeholder="Please provide a reason for this manual adjustment..."
                                            required
                                            rows={3}
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                                            onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                                            value={editForm.reason}
                                        />
                                    </div>
                
                                    {/* Footer Actions */}
                                    <div className="flex justify-end gap-3 pt-2 mt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                                )}
                            </div>
                        </div>
                    );
                };
                
                export default EditTaskModal;