import React from 'react';
import { useVvnListController } from './controllers/useVvnListController';
import VvnCard from './components/VvnCard';
import VvnDetailsModal from './components/VvnDetailsModal';
import VvnDecisionModal from './components/VvnDecisionModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import StatCard from '../../components/common/StatCard';
import { Search, SlidersHorizontal, Twitch } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InternalRoleValue } from '../../services/apiService';

// Pure presentation component for the Vessel Visit list page.
const VesselVisitNotificationPage: React.FC = () => {
    const {
        loading,
        error,
        successMessage,
        filteredVvns,
        viewAsRole,
        internalRole,
        agentStats,
        officerStats,
        query,
        setQuery,
        filterStatus,
        setFilterStatus,
        submitModalState,
        viewModalState,
        decisionModalState,
        reopenModalState,
        openSubmitModal,
        openViewDetailsModal,
        openDecisionModal,
        openReopenModal,
        closeAllModals,
        handleSubmit,
        executeApprove,
        executeReject,
        executeReopen,
        handleEdit,
        handleViewToggle,
        myRepresentativeCitizenId,
    } = useVvnListController();

    const pageTitle = internalRole === 'ShippingAgentRepresentative'
        ? 'My Vessel Visit Notifications'
        : 'Vessel Visit Notifications';
    const pageSubtitle = internalRole === 'ShippingAgentRepresentative'
        ? "Manage and submit your organization's vessel visits."
        : 'Manage and review incoming vessel visit submissions';

    return (
        <div className="container mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                    <p className="text-gray-600 mt-1">{pageSubtitle}</p>
                </div>
                {internalRole === 'Administrator' && (
                    <button
                        onClick={handleViewToggle}
                        className="btn btn-secondary text-lg flex items-center justify-center gap-2"
                        title="Switch View"
                    >
                        <Twitch className="w-5 h-5" />
                        {viewAsRole === 'ShippingAgentRepresentative' ? 'View as Officer' : 'View as Agent'}
                    </button>
                )}
            </div>

            {/* Stat Cards */}
            {viewAsRole === 'ShippingAgentRepresentative' && agentStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="In Progress"
                        value={agentStats.inProgress}
                        description="Visits you are still drafting."
                    />
                    <StatCard
                        title="Pending Review"
                        value={agentStats.pending}
                        description="Visits awaiting port approval."
                    />
                    <StatCard
                        title="Approved"
                        value={agentStats.approved}
                        description="Visits approved by the port."
                    />
                    <StatCard
                        title="Rejected"
                        value={agentStats.rejected}
                        description="Visits that need correction."
                    />
                </div>
            )}
            {(viewAsRole === 'PortAuthorityOfficer' || viewAsRole === 'Administrator') && officerStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Pending Review"
                        value={officerStats.pending}
                        description="Visits awaiting your decision."
                    />
                    <StatCard
                        title="Total Approved"
                        value={officerStats.approved}
                        description="Visits currently approved."
                    />
                    <StatCard
                        title="Total Rejected"
                        value={officerStats.rejected}
                        description="Visits that were rejected."
                    />
                    <StatCard
                        title="In Progress"
                        value={officerStats.inProgress}
                        description="Visits being drafted by agents."
                    />
                </div>
            )}

            {/* Filter and Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                {viewAsRole === 'ShippingAgentRepresentative' && (
                    <Link
                        to="/vessel-visits/new"
                        state={{ representativeCitizenId: myRepresentativeCitizenId }}
                        className="btn btn-primary text-lg"
                    >
                        + Create Visit
                    </Link>
                )}
            </div>

            {/* Feedback Messages */}
            {successMessage && (
                <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-4">{successMessage}</div>
            )}
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4">{error}</div>}

            {/* VVN Card List */}
            <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading notifications...</div>}
                {!loading && filteredVvns.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No notifications found matching your criteria.
                    </div>
                )}
                {!loading &&
                    filteredVvns.map((vvn) => (
                        <VvnCard
                            key={vvn.businessId}
                            vvn={vvn}
                            internalRole={viewAsRole as InternalRoleValue | null}
                            onApprove={() => openDecisionModal(vvn, 'approve')}
                            onReject={() => openDecisionModal(vvn, 'reject')}
                            onReopen={() => openReopenModal(vvn.businessId)}
                            onSubmit={() => openSubmitModal(vvn.businessId)}
                            onEdit={() => handleEdit(vvn)}
                            onViewDetails={() => openViewDetailsModal(vvn)}
                        />
                    ))}
            </div>

            {/* All Modals */}
            <ConfirmationModal
                isOpen={submitModalState.isOpen}
                onClose={closeAllModals}
                onConfirm={handleSubmit}
                title="Submit Notification"
                message="Are you sure you want to submit this notification for review? You will not be able to edit it after submission."
                confirmText="Submit"
            />
            <ConfirmationModal
                isOpen={reopenModalState.isOpen}
                onClose={closeAllModals}
                onConfirm={executeReopen}
                title="Reopen Notification"
                message="Are you sure you want to reopen this notification? This will move it back to 'In Progress' for the agent to edit."
                confirmText="Reopen"
            />
            <VvnDetailsModal
                isOpen={viewModalState.isOpen}
                onClose={closeAllModals}
                vvn={viewModalState.vvn}
            />
            <VvnDecisionModal
                isOpen={decisionModalState.isOpen}
                onClose={closeAllModals}
                vvn={decisionModalState.vvn}
                action={decisionModalState.action}
                onConfirmApprove={executeApprove}
                onConfirmReject={executeReject}
            />
        </div>
    );
};

export default VesselVisitNotificationPage;