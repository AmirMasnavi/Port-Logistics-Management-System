// src/pages/VesselVisitNotificationPage.tsx
import React, { useState, useEffect } from 'react';
import {
    getAllVvns,
    submitVvn,
    approveVvn,
    rejectVvn
} from '../services/apiService';
import type { VesselVisitNotification, ApproveVvnDto, RejectVvnDto } from '../types';
import Modal from '../components/common/Modal';
import CreateVvnForm from './CreateVvnForm';
// --- 1. Import our new Card component ---
import VvnCard from '../components/vvn/VvnCard';
import { Search, SlidersHorizontal } from 'lucide-react'; // Icons for search and filter

const VesselVisitNotificationPage: React.FC = () => {
    // --- State ---
    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- 2. NEW STATE for filters ---
    const [query, setQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // 

    // --- Data Fetching (Unchanged) ---
    const fetchVvns = async () => {
        try {
            setLoading(true);
            const data = await getAllVvns();
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

    // --- Action Handlers (Unchanged, but we'll use them differently) ---
    const handleCreateSuccess = (newVvn: VesselVisitNotification) => {
        setVvns(prev => [newVvn, ...prev]);
        setSuccessMessage('Notification created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // --- 3. FILTER LOGIC ---
    const filteredVvns = vvns.filter(vvn => {
        const matchesQuery = vvn.vesselImo.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = filterStatus === '' || vvn.status === filterStatus;
        return matchesQuery && matchesStatus;
    });

    // --- 4. Handle Card Selection ---
    // This function will show the approve/reject/submit actions
    // In the future, this could open a details page
    const handleCardSelect = (vvn: VesselVisitNotification) => {
        if (vvn.status === 'InProgress') {
            if (window.confirm('Are you sure you want to submit this notification?')) {
                handleSubmit(vvn.id);
            }
        }
        if (vvn.status === 'Submitted') {
            if (window.confirm('Do you want to Approve or Reject this submission? (OK=Approve, Cancel=Reject)')) {
                handleApprove(vvn.id);
            } else {
                handleReject(vvn.id);
            }
        }
        if (vvn.status === 'Approved' || vvn.status === 'Rejected') {
            alert(`Decision Log:\n${JSON.stringify(vvn.decisionLog, null, 2)}`);
        }
    };

    // --- (These are the original functions your page had, now called by handleCardSelect) ---
    const handleSubmit = async (id: string) => {
        try {
            await submitVvn(id);
            setSuccessMessage('Notification submitted!');
            fetchVvns();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit.');
        }
    };

    const handleApprove = async (id: string) => {
        const officerId = "OFFICER-001"; // Placeholder
        const dockId = window.prompt("Enter Dock ID to assign (e.g., DOCK-A):");
        if (!dockId) return;
        const dto: ApproveVvnDto = { officerId, dockId };
        try {
            await approveVvn(id, dto);
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
        const dto: RejectVvnDto = { officerId, reason };
        try {
            await rejectVvn(id, dto);
            setSuccessMessage('Notification Rejected.');
            fetchVvns();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject.');
        }
    };


    // --- 5. NEW RENDER JSX ---
    return (
        <div className="container mx-auto">
            {/* Page Header (from target image) */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Vessel Visit Notifications</h1>
                <p className="text-gray-600 mt-1">Manage and review incoming vessel visit submissions</p>
            </div>

            {/* Filter and Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by vessel name or IMO..." // 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                    />
                </div>

                {/* Status Filter */}
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

                {/* Create Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary text-lg" // [cite: 545, 589]
                >
                    + Create Visit
                </button>
            </div>

            {/* Success/Error Feedback */}
            {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            {/* --- 6. NEW Card List --- */}
            <div className="space-y-4">
                {loading && (
                    <div className="text-center py-10">Loading notifications...</div>
                )}

                {!loading && filteredVvns.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No notifications found matching your criteria.
                    </div>
                )}

                {!loading && filteredVvns.map(vvn => (
                    <VvnCard
                        key={vvn.id}
                        vvn={vvn}
                        onSelect={handleCardSelect}
                    />
                ))}
            </div>

            {/* Create VVN Modal (Unchanged) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Vessel Visit Notification"
            >
                <CreateVvnForm
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                    dummyRepresentativeId="00000000-0000-0000-0000-000000000001" // [cite: 612]
                />
            </Modal>
        </div>
    );
};

export default VesselVisitNotificationPage;