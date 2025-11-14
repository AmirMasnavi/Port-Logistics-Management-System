// src/components/vvn/VvnCard.tsx
import React from 'react';
import type { VesselVisitNotification } from '../../types';
import Badge from '../common/Badge'; //
import { Ship, Calendar, Anchor, User } from 'lucide-react';
import type {InternalRoleValue} from '../../services/apiService'; //

// --- 1. UPDATE PROPS (Unchanged) ---
interface VvnCardProps {
    vvn: VesselVisitNotification;
    internalRole: InternalRoleValue | null;
    onApprove: () => void;
    onReject: () => void;
    onSubmit: () => void;
    onEdit: () => void;
    onViewDetails: () => void;
}

// formatDate helper (Unchanged)
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-CA', { //
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const VvnCard: React.FC<VvnCardProps> = ({
                                             vvn,
                                             internalRole,
                                             onApprove,
                                             onReject,
                                             onSubmit,
                                             onEdit,
                                             onViewDetails
                                         }) => {

    // Card data (Unchanged)
    const title = `Vessel: ${vvn.vesselImo}`; //
    const arrivalDate = formatDate(vvn.estimatedArrival); //
    const dock = vvn.assignedDockId || 'N/A'; //
    const submittedBy = vvn.submittedBy; //

    // --- 2. UPDATED: Render action buttons based on Role and Status ---
    const renderActions = () => {
        // --- Port Authority Officer & ADMIN Logic ---
        if (internalRole === 'PortAuthorityOfficer' || internalRole === 'Administrator') {
            if (vvn.status === 'Submitted') { //
                return (
                    <>
                        <button onClick={onReject} className="btn btn-outline-danger">
                            Reject
                        </button>
                        <button onClick={onApprove} className="btn btn-primary">
                            Approve
                        </button>
                    </>
                );
            }
            // For 'Approved' or 'Rejected', show a log
            return (
                <button onClick={onViewDetails} className="btn btn-secondary">
                    View Log
                </button>
            );
        }

        // --- Shipping Agent Representative Logic (UPDATED) ---
        // --- THIS LINE IS CHANGED ---
        if (internalRole === 'ShippingAgentRepresentative') { //
            if (vvn.status === 'InProgress') { //
                return (
                    <>
                        <button onClick={onEdit} className="btn btn-secondary">
                            Edit
                        </button>
                        <button onClick={onSubmit} className="btn btn-primary">
                            Submit for Approval
                        </button>
                    </>
                );
            }
            // For 'Submitted', 'Approved', 'Rejected', just allow viewing
            return (
                <button onClick={onViewDetails} className="btn btn-secondary">
                    View Status
                </button>
            );
        }

        return null; // No actions for other roles
    };

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 transition-all hover:shadow-md"
        >
            {/* Card Header (Unchanged) */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <Badge status={vvn.status} />
            </div>

            {/* Card Body (Unchanged) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem icon={Ship} title="IMO Number" value={vvn.vesselImo} />
                <InfoItem icon={Calendar} title="Arrival Date" value={arrivalDate} />
                <InfoItem icon={Anchor} title="Assigned Dock" value={dock} />
                <InfoItem icon={User} title="Submitted By" value={submittedBy.substring(0, 8)} />
            </div>

            {/* --- 3. NEW: Action buttons area (Unchanged) --- */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                {renderActions()}
            </div>
        </div>
    );
};

// --- Helper component (Unchanged) ---
const InfoItem: React.FC<{ icon: React.ElementType<{ className?: string }>, title: string, value: string }> = ({ icon: Icon, title, value }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {title}
        </div>
        <div className="text-sm font-semibold text-gray-900 mt-1 truncate" title={value}>
            {value}
        </div>
    </div>
);

export default VvnCard;