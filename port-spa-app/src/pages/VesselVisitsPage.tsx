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
import Badge from '../components/common/Badge';


const VesselVisitNotificationPage: React.FC = () => {
    // --- State ---
    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Data Fetching ---
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
    }, []); // Runs once on component mount

    // --- Action Handlers ---

    const handleCreateSuccess = (newVvn: VesselVisitNotification) => {
        setVvns(prev => [newVvn, ...prev]); // Add new VVN to the top of the list
        setSuccessMessage('Notification created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000); // Clear message after 3 seconds
    };

    const handleSubmit = async (id: string) => {
        if (!window.confirm('Are you sure you want to submit this notification?')) return;

        try {
            await submitVvn(id);
            setSuccessMessage('Notification submitted!');
            fetchVvns(); // Re-fetch the list to show the new "Submitted" status
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit.');
        }
    };

    const handleApprove = async (id: string) => {
        // Placeholder for officer ID and dock selection
        const officerId = "OFFICER-001"; // In a real app, this comes from auth
        const dockId = window.prompt("Enter Dock ID to assign (e.g., DOCK-A):"); // Simple prompt [cite: 2014]
        if (!dockId) return;

        const dto: ApproveVvnDto = { officerId, dockId };

        try {
            await approveVvn(id, dto);
            setSuccessMessage('Notification Approved!');
            fetchVvns(); // Re-fetch
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve.');
        }
    };

    const handleReject = async (id: string) => {
        const officerId = "OFFICER-001";
        const reason = window.prompt("Enter reason for rejection:"); // [cite: 2014]
        if (!reason) return;

        const dto: RejectVvnDto = { officerId, reason };

        try {
            await rejectVvn(id, dto);
            setSuccessMessage('Notification Rejected.');
            fetchVvns(); // Re-fetch
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject.');
        }
    };

    // --- Render ---
    return (
        <div className="bg-white shadow-md rounded-lg p-6">

            {/* Page Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-gray-800">Vessel Visit Notifications</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    + Create Visit
                </button>
            </div>

            {/* Success/Error Feedback */}
            {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            {/* Search & Filter Bar [cite: 2017] */}
            <div className="flex mb-4 gap-4">
                <input
                    type="text"
                    placeholder="Search by vessel name or IMO..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                />
                <select className="p-2 border border-gray-300 rounded-lg">
                    <option value="">All Statuses</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel IMO</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Dock</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                        <tr>
                            <td colSpan={5} className="text-center py-4">Loading notifications...</td>
                        </tr>
                    )}
                    {!loading && vvns.map(vvn => (
                        <tr key={vvn.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vvn.vesselImo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(vvn.estimatedArrival).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge status={vvn.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vvn.assignedDockId || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {/* --- DYNAMIC ACTIONS based on status --- */}
                                {/* This part covers the business logic from all VVN user stories */}

                                {vvn.status === 'InProgress' && (
                                    <>
                                        <button onClick={() => alert('Edit page not built yet')} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                                        <button onClick={() => handleSubmit(vvn.id)} className="text-green-600 hover:text-green-800">Submit</button>
                                    </>
                                )}

                                {vvn.status === 'Submitted' && (
                                    <>
                                        <button onClick={() => handleApprove(vvn.id)} className="text-green-600 hover:text-green-800 mr-2">Approve</button>
                                        <button onClick={() => handleReject(vvn.id)} className="text-red-600 hover:text-red-800">Reject</button>
                                    </>
                                )}

                                {/* Example for a 'View' action, could show a DotsIcon */}
                                {(vvn.status === 'Approved' || vvn.status === 'Rejected') && (
                                    <button onClick={() => alert(JSON.stringify(vvn.decisionLog, null, 2))} className="text-gray-500 hover:text-gray-700">View Log</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Create VVN Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Vessel Visit Notification"
            >
                <CreateVvnForm
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                    // This is a placeholder for US 3.2.1 (Auth)
                    // We must pass the active user's ID to the form
                    dummyRepresentativeId="00000000-0000-0000-0000-000000000001" //TODO: Replace with real user ID
                />
            </Modal>
        </div>
    );
};

export default VesselVisitNotificationPage;