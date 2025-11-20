// src/presentation/vvn/components/VvnDecisionModal.tsx
import React, { useState, useEffect } from 'react';
import type { VesselVisitNotification } from '../../domain/vvn/vvn.model';
import type { ApproveVvnDto, RejectVvnDto } from '../../infrastructure/repositories/vvn/vvn.dto';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { Ship, Calendar, User, Weight, List, CheckCircle, XCircle } from 'lucide-react';

// --- Reusable Styled Form Components (for this file) ---
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={id}
            {...props}
            className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
        />
    </div>
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            id={id}
            {...props}
            className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
        />
    </div>
);
// A simple key-value display
const DetailItem: React.FC<{ icon: React.ElementType<{className ?: string}>, label: string, value: string | null }> = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {label}
        </div>
        <div className="text-sm font-semibold text-gray-900 mt-1 truncate">
            {value || 'N/A'}
        </div>
    </div>
);

// --- Main Modal Component ---
interface VvnDecisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    vvn: VesselVisitNotification | null;
    action: 'approve' | 'reject' | null;
    onConfirmApprove: (id: string, dto: ApproveVvnDto) => void;
    onConfirmReject: (id: string, dto: RejectVvnDto) => void;
}

const VvnDecisionModal: React.FC<VvnDecisionModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               vvn,
                                                               action,
                                                               onConfirmApprove,
                                                               onConfirmReject
                                                           }) => {
    // State for the form fields
    const [dockName, setDockName] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setDockName('');
            setReason('');
            setError(null);
        }
    }, [isOpen]);

    if (!vvn || !action) return null;

    const handleSubmit = () => {
        // This is a placeholder. You'll get the real Officer ID from useAuth()
        const officerId = "OFFICER-001";

        if (action === 'approve') {
            if (!dockName) {
                setError('Dock name is required to approve.');
                return;
            }
            onConfirmApprove(vvn.businessId, { officerId, dockName });
        }

        if (action === 'reject') {
            if (!reason) {
                setError('A reason is required to reject.');
                return;
            }
            onConfirmReject(vvn.businessId, { officerId, reason });
        }
    };

    // Helper to format dates
    const formatDateTime = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return 'Invalid Date'; }
    };

    const title = action === 'approve' ? 'Approve Vessel Visit' : 'Reject Vessel Visit';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} showFooter={false}>
            <div className="max-h-[70vh] overflow-y-auto space-y-4 p-1">
                {/* 1. Status Banner */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <span className="text-lg font-bold text-gray-800">
                        Vessel: {vvn.vesselImo}
                    </span>
                    <Badge status={vvn.status} />
                </div>

                {/* 2. Decision Form */}
                <div className={`p-4 rounded-lg border ${
                    action === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                    <h3 className="text-lg font-semibold flex items-center gap-2 ${
                        action === 'approve' ? 'text-green-700' : 'text-red-700'
                    }">
                        {action === 'approve' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {action === 'approve' ? 'Approval Form' : 'Rejection Form'}
                    </h3>

                    {error && <div className="text-red-600 p-2 text-sm">{error}</div>}

                    {action === 'approve' && (
                        <Input label="Dock to Assign" id="dockName" value={dockName} onChange={(e) => setDockName(e.target.value)} placeholder="e.g., Dock A" required />
                    )}
                    {action === 'reject' && (
                        <Textarea label="Reason for Rejection" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Missing cargo details..." required />
                    )}
                </div>

                {/* 3. Read-Only Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <DetailItem icon={Ship} label="IMO Number" value={vvn.vesselImo} />
                    {/* SubmittedBy now contains the representative's name (not the internal GUID) */}
                    <DetailItem icon={User} label="Submitted By" value={vvn.submittedBy} />
                    <DetailItem icon={Calendar} label="Estimated Arrival" value={formatDateTime(vvn.estimatedArrival)} />
                    <DetailItem icon={Calendar} label="Estimated Departure" value={formatDateTime(vvn.estimatedDeparture)} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <DetailItem icon={Weight} label="Total Weight" value={`${vvn.cargo.weight} kg`} />
                    <DetailItem icon={List} label="Cargo Description" value={vvn.cargo.description} />
                </div>
                {/* (We can add Cargo/Crew tables here too, but keeping it simple for now) */}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={onClose} className="btn btn-secondary">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className={`btn ${action === 'approve' ? 'btn-primary' : 'btn-outline-danger'}`}
                >
                    {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
            </div>
        </Modal>
    );
};

export default VvnDecisionModal;

