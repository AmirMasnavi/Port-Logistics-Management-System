// // src/pages/VesselVisitNotificationPage.tsx
// import React, { useState, useEffect, useMemo } from 'react';
// // --- !! THIS IS THE MAIN CHANGE !! ---
// // We import our new service, not the old apiService
// import vvnService from '../app/vvn/vvn.service';
// // ---
// import type { InternalRoleValue } from '../services/apiService'; // Keep this for role names
// import type { VesselVisitNotification, ApproveVvnDto, RejectVvnDto } from '../domain/vvn/vvn.types'; // Import from domain
// import VvnCard from '../components/vvn/VvnCard';
// import StatCard from '../components/common/StatCard';
// import { Search, SlidersHorizontal, Twitch } from 'lucide-react';
// import { useAuth } from '../auth/AuthProvider';
// import {Link, useNavigate} from "react-router-dom";
// import ConfirmationModal from "../components/common/ConfirmationModal.tsx";
// import VvnDetailsModal from '../components/vvn/VvnDetailsModal';
// import VvnDecisionModal from '../components/vvn/VvnDecisionModal';
//
// const VesselVisitNotificationPage: React.FC = () => {
//     // ... (All your state [loading, error, vvns, etc.] stays exactly the same) ...
//     const { internalRole } = useAuth();
//     const navigate = useNavigate();
//     const [viewAsRole, setViewAsRole] = useState(internalRole);
//     // ... (rest of state)
//     const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [successMessage, setSuccessMessage] = useState<string | null>(null);
//     const [query, setQuery] = useState('');
//     const [filterStatus, setFilterStatus] = useState('');
//     const [submitModalState, setSubmitModalState] = useState<{ isOpen: boolean; vvnId: string | null }>({ isOpen: false, vvnId: null });
//     const [viewModalState, setViewModalState] = useState<{ isOpen: boolean; vvn: VesselVisitNotification | null }>({ isOpen: false, vvn: null });
//     const [decisionModalState, setDecisionModalState] = useState<{ isOpen: boolean; vvn: VesselVisitNotification | null, action: 'approve' | 'reject' | null }>({ isOpen: false, vvn: null, action: null });
//     const [reopenModalState, setReopenModalState] = useState<{ isOpen: boolean; vvnId: string | null }>({ isOpen: false, vvnId: null });
//
//     useEffect(() => {
//         if (internalRole === 'Administrator') {
//             setViewAsRole('PortAuthorityOfficer');
//         } else {
//             setViewAsRole(internalRole);
//         }
//     }, [internalRole]);
//
//     // --- Data Fetching (UPDATED) ---
//     const fetchVvns = async () => {
//         try {
//             setLoading(true);
//             // --- !! THIS IS THE CHANGE !! ---
//             const data = await vvnService.fetchAllVvns(); // Use the service
//             // ---
//             setVvns(data);
//             setError(null);
//         } catch (err) {
//             setError('Failed to fetch notifications. Please try again later.');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     useEffect(() => {
//         fetchVvns();
//     }, []);
//
//     // --- Action Handlers (UPDATED) ---
//
//     const handleSubmit = async () => {
//         if (!submitModalState.vvnId) return;
//         try {
//             // --- !! THIS IS THE CHANGE !! ---
//             await vvnService.submitVvn(submitModalState.vvnId); // Use the service
//             // ---
//             setSuccessMessage('Notification submitted!');
//             fetchVvns();
//         } catch (err: any) {
//             setError(err.message || 'Failed to submit.'); // Use err.message from service
//         } finally {
//             setSubmitModalState({ isOpen: false, vvnId: null });
//         }
//     };
//
//     const executeApprove = async (id: string, dto: ApproveVvnDto) => {
//         try {
//             // --- !! THIS IS THE CHANGE !! ---
//             await vvnService.approveVvn(id, dto); // Use the service
//             // ---
//             setSuccessMessage('Notification Approved!');
//             fetchVvns();
//         } catch (err: any) {
//             setError(err.message || 'Failed to approve.'); // Use err.message
//         } finally {
//             setDecisionModalState({ isOpen: false, vvn: null, action: null });
//         }
//     };
//
//     const executeReject = async (id: string, dto: RejectVvnDto) => {
//         try {
//             // --- !! THIS IS THE CHANGE !! ---
//             await vvnService.rejectVvn(id, dto); // Use the service
//             // ---
//             setSuccessMessage('Notification Rejected.');
//             fetchVvns();
//         } catch (err: any) {
//             setError(err.message || 'Failed to reject.'); // Use err.message
//         } finally {
//             setDecisionModalState({ isOpen: false, vvn: null, action: null });
//         }
//     };
//
//     const openReopenModal = (id: string) => {
//         setReopenModalState({ isOpen: true, vvnId: id });
//     };
//
//     const executeReopen = async () => {
//         if (!reopenModalState.vvnId) return;
//         try {
//             // --- !! THIS IS THE CHANGE !! ---
//             await vvnService.reopenVvn(reopenModalState.vvnId); // Use the service
//             // ---
//             setSuccessMessage('Notification has been reopened.');
//             fetchVvns();
//         } catch (err: any) {
//             setError(err.message || 'Failed to reopen.'); // Use err.message
//         } finally {
//             setReopenModalState({ isOpen: false, vvnId: null });
//         }
//     };
//
//     // ... (The rest of your file, handleEdit, handleViewDetails, openSubmitModal, useMemo filters, etc. remains 100% the same) ...
//     const handleEdit = (vvn: VesselVisitNotification) => {
//         navigate(`/vessel-visits/edit/${vvn.businessId}`);
//     };
//
//     const handleViewDetails = (vvn: VesselVisitNotification) => {
//         setViewModalState({ isOpen: true, vvn: vvn });
//     };
//
//     const openSubmitModal = (id: string) => {
//         setSubmitModalState({ isOpen: true, vvnId: id });
//     };
//
//     const filteredVvns = useMemo(() => {
//         return vvns.filter(vvn => {
//             const matchesQuery = vvn.vesselImo.toLowerCase().includes(query.toLowerCase());
//             const matchesStatus = filterStatus === '' || vvn.status === filterStatus;
//             return matchesQuery && matchesStatus;
//         });
//     }, [vvns, query, filterStatus]);
//
//     const agentStats = useMemo(() => {
//         if (viewAsRole !== 'ShippingAgentRepresentative') return null;
//         return {
//             inProgress: vvns.filter(v => v.status === 'InProgress').length,
//             pending: vvns.filter(v => v.status === 'Submitted').length,
//             approved: vvns.filter(v => v.status === 'Approved').length,
//             rejected: vvns.filter(v => v.status === 'Rejected').length,
//         };
//     }, [vvns, viewAsRole]);
//
//     const officerStats = useMemo(() => {
//         if (viewAsRole !== 'PortAuthorityOfficer' && viewAsRole !== 'Administrator') return null;
//         return {
//             pending: vvns.filter(v => v.status === 'Submitted').length,
//             approved: vvns.filter(v => v.status === 'Approved').length,
//             rejected: vvns.filter(v => v.status === 'Rejected').length,
//             inProgress: vvns.filter(v => v.status === 'InProgress').length,
//         };
//     }, [vvns, viewAsRole]);
//
//     const pageTitle = internalRole === 'ShippingAgentRepresentative'
//         ? "My Vessel Visit Notifications"
//         : "Vessel Visit Notifications";
//
//     const pageSubtitle = internalRole === 'ShippingAgentRepresentative'
//         ? "Manage and submit your organization's vessel visits."
//         : "Manage and review incoming vessel visit submissions";
//
//     const myRepresentativeCitizenId = "AC1234567"
//
//     const handleViewToggle = () => {
//         if (viewAsRole === 'PortAuthorityOfficer') {
//             setViewAsRole('ShippingAgentRepresentative');
//         } else {
//             setViewAsRole('PortAuthorityOfficer');
//         }
//     };
//
//     // --- RENDER JSX (No changes needed here) ---
//     return (
//         <div className="container mx-auto">
//             {/* ... (header) ... */}
//             <div className="flex justify-between items-center mb-6">
//                 <div>
//                     <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
//                     <p className="text-gray-600 mt-1">{pageSubtitle}</p>
//                 </div>
//                 {internalRole === 'Administrator' && (
//                     <button
//                         onClick={handleViewToggle}
//                         className="btn btn-secondary text-lg flex items-center justify-center gap-2"
//                         title="Switch View"
//                     >
//                         <Twitch className="w-5 h-5" />
//                         {viewAsRole === 'ShippingAgentRepresentative' ? 'View as Officer' : 'View as Agent'}
//                     </button>
//                 )}
//             </div>
//
//             {/* ... (stat cards) ... */}
//             {viewAsRole === 'ShippingAgentRepresentative' && agentStats && (
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//                     <StatCard title="In Progress" value={agentStats.inProgress} description="Visits you are still drafting." />
//                     <StatCard title="Pending Review" value={agentStats.pending} description="Visits awaiting port approval." />
//                     <StatCard title="Approved" value={agentStats.approved} description="Visits approved by the port." />
//                     <StatCard title="Rejected" value={agentStats.rejected} description="Visits that need correction." />
//                 </div>
//             )}
//             {(viewAsRole === 'PortAuthorityOfficer' || viewAsRole === 'Administrator') && officerStats && (
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//                     <StatCard title="Pending Review" value={officerStats.pending} description="Visits awaiting your decision." />
//                     <StatCard title="Total Approved" value={officerStats.approved} description="Visits currently approved." />
//                     <StatCard title="Total Rejected" value={officerStats.rejected} description="Visits that were rejected." />
//                     <StatCard title="In Progress" value={officerStats.inProgress} description="Visits being drafted by agents." />
//                 </div>
//             )}
//
//             {/* ... (filter bar) ... */}
//             <div className="flex flex-col md:flex-row gap-4 mb-6">
//                 <div className="relative flex-grow">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                         <Search className="w-5 h-5 text-gray-400" />
//                     </div>
//                     <input
//                         type="text"
//                         placeholder="Search by vessel name or IMO..."
//                         value={query}
//                         onChange={(e) => setQuery(e.target.value)}
//                         className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
//                     />
//                 </div>
//                 <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                         <SlidersHorizontal className="w-5 h-5 text-gray-400" />
//                     </div>
//                     <select
//                         value={filterStatus}
//                         onChange={(e) => setFilterStatus(e.target.value)}
//                         className="w-full md:w-auto pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg appearance-none"
//                     >
//                         <option value="">All Statuses</option>
//                         <option value="InProgress">In Progress</option>
//                         <option value="Submitted">Submitted</option>
//                         <option value="Approved">Approved</option>
//                         <option value="Rejected">Rejected</option>
//                     </select>
//                 </div>
//                 {viewAsRole === 'ShippingAgentRepresentative' && (
//                     <Link
//                         to="/vessel-visits/new"
//                         state={{ representativeCitizenId: myRepresentativeCitizenId }}
//                         className="btn btn-primary text-lg"
//                     >
//                         + Create Visit
//                     </Link>
//                 )}
//             </div>
//
//             {/* ... (feedback messages) ... */}
//             {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>}
//             {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}
//
//             {/* ... (card list) ... */}
//             <div className="space-y-4">
//                 {loading && <div className="text-center py-10">Loading notifications...</div>}
//                 {!loading && filteredVvns.length === 0 && (
//                     <div className="text-center py-10 text-gray-500">
//                         No notifications found matching your criteria.
//                     </div>
//                 )}
//                 {!loading && filteredVvns.map(vvn => (
//                     <VvnCard
//                         key={vvn.businessId}
//                         vvn={vvn}
//                         internalRole={viewAsRole as InternalRoleValue | null}
//                         onApprove={() => setDecisionModalState({ isOpen: true, vvn: vvn, action: 'approve' })}
//                         onReject={() => setDecisionModalState({ isOpen: true, vvn: vvn, action: 'reject' })}
//                         onReopen={() => openReopenModal(vvn.businessId)}
//                         onSubmit={() => openSubmitModal(vvn.businessId)}
//                         onEdit={() => handleEdit(vvn)}
//                         onViewDetails={() => handleViewDetails(vvn)}
//                     />
//                 ))}
//             </div>
//
//             {/* ... (All Modals: Confirmation, Details, Decision) ... */}
//             <ConfirmationModal
//                 isOpen={submitModalState.isOpen}
//                 onClose={() => setSubmitModalState({ isOpen: false, vvnId: null })}
//                 onConfirm={handleSubmit}
//                 title="Submit Notification"
//                 message="Are you sure you want to submit this notification for review? You will not be able to edit it after submission."
//                 confirmText="Submit"
//             />
//             <ConfirmationModal
//                 isOpen={reopenModalState.isOpen}
//                 onClose={() => setReopenModalState({ isOpen: false, vvnId: null })}
//                 onConfirm={executeReopen}
//                 title="Reopen Notification"
//                 message="Are you sure you want to reopen this notification? This will move it back to 'In Progress' for the agent to edit."
//                 confirmText="Reopen"
//             />
//             <VvnDetailsModal
//                 isOpen={viewModalState.isOpen}
//                 onClose={() => setViewModalState({ isOpen: false, vvn: null })}
//                 vvn={viewModalState.vvn}
//             />
//             <VvnDecisionModal
//                 isOpen={decisionModalState.isOpen}
//                 onClose={() => setDecisionModalState({ isOpen: false, vvn: null, action: null })}
//                 vvn={decisionModalState.vvn}
//                 action={decisionModalState.action}
//                 onConfirmApprove={executeApprove}
//                 onConfirmReject={executeReject}
//             />
//         </div>
//     );
// };
//
// export default VesselVisitNotificationPage;