// src/pages/VesselVisitNotificationPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    getAllVvns,
    submitVvn,
    approveVvn,
    rejectVvn,
    type InternalRoleValue
} from '../services/apiService';
import type { VesselVisitNotification, ApproveVvnDto, RejectVvnDto } from '../types';
import VvnCard from '../components/vvn/VvnCard';
import StatCard from '../components/common/StatCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import {Link, useNavigate} from "react-router-dom";
import ConfirmationModal from "../components/common/ConfirmationModal.tsx";

const VesselVisitNotificationPage: React.FC = () => {
    const { internalRole} = useAuth(); //
    const navigate = useNavigate();

// --- State (UPDATED) ---
    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // --- 4. NEW: State for modals ---
    const [submitModalState, setSubmitModalState] = useState<{ isOpen: boolean; vvnId: string | null }>({ isOpen: false, vvnId: null });
    // (We'll add the details/approve modals later)

    // --- Data Fetching (Unchanged) ---
    const fetchVvns = async () => {
        try {
            setLoading(true);
            const data = await getAllVvns(); //
            setVvns(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch notifications. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVvns();
    }, []);

    // --- Action Handlers (Unchanged) ---

    const handleSubmit = async () => {
        if (!submitModalState.vvnId) return;

        try {
            await submitVvn(submitModalState.vvnId);
            setSuccessMessage('Notification submitted!');
            fetchVvns();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit.');
        } finally {
            setSubmitModalState({ isOpen: false, vvnId: null }); // Close modal
        }
    };

    const handleApprove = async (id: string) => {
        const officerId = "OFFICER-001"; // Placeholder
        const dockId = window.prompt("Enter Dock ID to assign (e.g., DOCK-A):");
        if (!dockId) return;
        const dto: ApproveVvnDto = { officerId, dockId }; //
        try {
            await approveVvn(id, dto); //
            setSuccessMessage('Notification Approved!');
            fetchVvns();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve.');
        }
    };

    const handleReject = async (id: string) => {
        const officerId = "OFFICER-001"; // Placeholder
        const reason = window.prompt("Enter reason for rejection:");
        if (!reason) return;
        const dto: RejectVvnDto = { officerId, reason }; //
        try {
            await rejectVvn(id, dto); //
            setSuccessMessage('Notification Rejected.');
            fetchVvns();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject.');
        }
    };

    const handleEdit = (vvn: VesselVisitNotification) => {
        // Navigate to the new edit page
        navigate(`/vessel-visits/edit/${vvn.id}`);
    };

    const handleViewDetails = (vvn: VesselVisitNotification) => {
        const log = vvn.decisionLog.length > 0 ? JSON.stringify(vvn.decisionLog, null, 2) : 'No decisions logged.'; //
        alert(`Status: ${vvn.status}\nAssigned Dock: ${vvn.assignedDockId || 'N/A'}\nLog: ${log}`); //
    };

    const openSubmitModal = (id: string) => {
        setSubmitModalState({ isOpen: true, vvnId: id });
    };

    // --- Filter Logic (Unchanged) ---
    const filteredVvns = useMemo(() => {
        return vvns.filter(vvn => {
            const matchesQuery = vvn.vesselImo.toLowerCase().includes(query.toLowerCase()); //
            const matchesStatus = filterStatus === '' || vvn.status === filterStatus; //
            return matchesQuery && matchesStatus;
        });
    }, [vvns, query, filterStatus]);

    // --- Calculate stats for the agent's dashboard (UPDATED) ---
    const agentStats = useMemo(() => {
        // --- THIS LINE IS CHANGED ---
        if (internalRole !== 'ShippingAgentRepresentative') return null;
        return {
            inProgress: vvns.filter(v => v.status === 'InProgress').length,
            pending: vvns.filter(v => v.status === 'Submitted').length,
            approved: vvns.filter(v => v.status === 'Approved').length,
            rejected: vvns.filter(v => v.status === 'Rejected').length,
        };
    }, [vvns, internalRole]);

    // --- DYNAMIC TITLES (UPDATED) ---
    // --- THIS LINE IS CHANGED ---
    const pageTitle = internalRole === 'ShippingAgentRepresentative'
        ? "My Vessel Visit Notifications"
        : "Vessel Visit Notifications";

    // --- THIS LINE IS CHANGED ---
    const pageSubtitle = internalRole === 'ShippingAgentRepresentative'
        ? "Manage and submit your organization's vessel visits."
        : "Manage and review incoming vessel visit submissions";

    // --- 6. FIX THE GUID (TEMPORARY) ---
    // Find a real GUID from your notifications to pass to the create page.
    // Replace this with your actual Representative ID.
    const myRepresentativeId = "cbe6abb5-7ad3-482c-b5cd-6d0876e0c9b2"

    // --- RENDER JSX (UPDATED) ---
    return (
        <div className="container mx-auto">
            {/* Page Header (Unchanged) */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                <p className="text-gray-600 mt-1">{pageSubtitle}</p>
            </div>

            {/* --- NEW: Agent Overview Dashboard (UPDATED) --- */}
            {/* --- THIS LINE IS CHANGED --- */}
            {internalRole === 'ShippingAgentRepresentative' && agentStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard title="In Progress" value={agentStats.inProgress} description="Visits you are still drafting." />
                    <StatCard title="Pending Review" value={agentStats.pending} description="Visits awaiting port approval." />
                    <StatCard title="Approved" value={agentStats.approved} description="Visits approved by the port." />
                    <StatCard title="Rejected" value={agentStats.rejected} description="Visits that need correction." />
                </div>
            )}

            {/* Filter and Action Bar (Updated) */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search Bar (Unchanged) */}
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by vessel name or IMO..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                    />
                </div>

                {/* Status Filter (Unchanged) */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full md:w-auto pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg appearance-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                {/* --- 8. UPDATED Create Button (now a Link) --- */}
                {internalRole === 'ShippingAgentRepresentative' && (
                    <Link
                        to="/vessel-visits/new"
                        state={{ representativeId: myRepresentativeId }} // Pass the hard-coded ID
                        className="btn btn-primary text-lg"
                    >
                        + Create Visit
                    </Link>
                )}
            </div>

            {/* Feedback & Card List (Unchanged) */}
            {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading notifications...</div>}
                {!loading && filteredVvns.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No notifications found matching your criteria.
                    </div>
                )}

                {/* --- 9. UPDATED Card List --- */}
                {!loading && filteredVvns.map(vvn => (
                    <VvnCard
                        key={vvn.id}
                        vvn={vvn}
                        internalRole={internalRole as InternalRoleValue | null}
                        onApprove={() => handleApprove(vvn.id)}
                        onReject={() => handleReject(vvn.id)}
                        onSubmit={() => openSubmitModal(vvn.id)} // <-- Use new modal
                        onEdit={() => handleEdit(vvn)} // <-- Use new edit function
                        onViewDetails={() => handleViewDetails(vvn)}
                    />
                ))}
            </div>
            
            {/* --- 10. NEW: Confirmation Modal --- */}
            <ConfirmationModal
                isOpen={submitModalState.isOpen}
                onClose={() => setSubmitModalState({ isOpen: false, vvnId: null })}
                onConfirm={handleSubmit}
                title="Submit Notification"
                message="Are you sure you want to submit this notification for review? You will not be able to edit it after submission."
                confirmText="Submit"
            />
        </div>
    );
};

export default VesselVisitNotificationPage;