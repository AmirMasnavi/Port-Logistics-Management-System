import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VvnService } from '../../../app/vvn/vvn.service';
import { vvnApiRepository } from '../../../infrastructure/repositories/vvn/vvnApi.repository';
import type { VesselVisitNotification } from '../../../domain/vvn/vvn.model';
import type { ApproveVvnDto, RejectVvnDto } from '../../../infrastructure/repositories/vvn/vvn.dto';
import { useAuth } from '../../../auth/AuthProvider';

const vvnService = new VvnService(vvnApiRepository);

export const useVvnListController = () => {
    const navigate = useNavigate();
    const { internalRole, citizenId } = useAuth();

    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [submitModalState, setSubmitModalState] = useState<{ isOpen: boolean; vvnId: string | null }>({
        isOpen: false,
        vvnId: null,
    });
    const [viewModalState, setViewModalState] = useState<{ isOpen: boolean; vvn: VesselVisitNotification | null }>({
        isOpen: false,
        vvn: null,
    });
    const [decisionModalState, setDecisionModalState] = useState<{
        isOpen: boolean;
        vvn: VesselVisitNotification | null;
        action: 'approve' | 'reject' | null;
    }>({
        isOpen: false,
        vvn: null,
        action: null,
    });
    const [reopenModalState, setReopenModalState] = useState<{ isOpen: boolean; vvnId: string | null }>({
        isOpen: false,
        vvnId: null,
    });

    const [viewAsRole, setViewAsRole] = useState(internalRole);

    useEffect(() => {
        if (internalRole === 'Administrator') {
            setViewAsRole('PortAuthorityOfficer');
        } else {
            setViewAsRole(internalRole);
        }
    }, [internalRole]);

    const fetchVvns = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await vvnService.fetchAllVvns();
            setVvns(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch notifications. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVvns();
    }, []);

    const handleSubmit = async () => {
        if (!submitModalState.vvnId) return;
        try {
            await vvnService.submitVvn(submitModalState.vvnId);
            setSuccessMessage('Notification submitted!');
            await fetchVvns();
        } catch (err: any) {
            setError(err.message || 'Failed to submit.');
        } finally {
            setSubmitModalState({ isOpen: false, vvnId: null });
        }
    };

    const executeApprove = async (id: string, dto: ApproveVvnDto) => {
        try {
            await vvnService.approveVvn(id, dto);
            setSuccessMessage('Notification Approved!');
            await fetchVvns();
        } catch (err: any) {
            setError(err.message || 'Failed to approve.');
        } finally {
            setDecisionModalState({ isOpen: false, vvn: null, action: null });
        }
    };

    const executeReject = async (id: string, dto: RejectVvnDto) => {
        try {
            await vvnService.rejectVvn(id, dto);
            setSuccessMessage('Notification Rejected.');
            await fetchVvns();
        } catch (err: any) {
            setError(err.message || 'Failed to reject.');
        } finally {
            setDecisionModalState({ isOpen: false, vvn: null, action: null });
        }
    };

    const executeReopen = async () => {
        if (!reopenModalState.vvnId) return;
        try {
            await vvnService.reopenVvn(reopenModalState.vvnId);
            setSuccessMessage('Notification has been reopened.');
            await fetchVvns();
        } catch (err: any) {
            setError(err.message || 'Failed to reopen.');
        } finally {
            setReopenModalState({ isOpen: false, vvnId: null });
        }
    };

    const handleEdit = (vvn: VesselVisitNotification) => {
        navigate(`/vessel-visits/edit/${vvn.businessId}`);
    };

    const openSubmitModal = (id: string) => setSubmitModalState({ isOpen: true, vvnId: id });
    const openViewDetailsModal = (vvn: VesselVisitNotification) =>
        setViewModalState({ isOpen: true, vvn });
    const openDecisionModal = (vvn: VesselVisitNotification, action: 'approve' | 'reject') =>
        setDecisionModalState({ isOpen: true, vvn, action });
    const openReopenModal = (id: string) => setReopenModalState({ isOpen: true, vvnId: id });

    const closeAllModals = () => {
        setSubmitModalState({ isOpen: false, vvnId: null });
        setViewModalState({ isOpen: false, vvn: null });
        setDecisionModalState({ isOpen: false, vvn: null, action: null });
        setReopenModalState({ isOpen: false, vvnId: null });
    };

    const filteredVvns = useMemo(() => {
        return vvns.filter((vvn) => {
            const matchesQuery = vvn.vesselImo.toLowerCase().includes(query.toLowerCase());
            const matchesStatus = filterStatus === '' || vvn.status === filterStatus;
            return matchesQuery && matchesStatus;
        });
    }, [vvns, query, filterStatus]);

    const agentStats = useMemo(() => {
        if (viewAsRole !== 'ShippingAgentRepresentative') return null;
        return {
            inProgress: vvns.filter((v) => v.status === 'InProgress').length,
            pending: vvns.filter((v) => v.status === 'Submitted').length,
            approved: vvns.filter((v) => v.status === 'Approved').length,
            rejected: vvns.filter((v) => v.status === 'Rejected').length,
        };
    }, [vvns, viewAsRole]);

    const officerStats = useMemo(() => {
        if (viewAsRole !== 'PortAuthorityOfficer' && viewAsRole !== 'Administrator') return null;
        return {
            pending: vvns.filter((v) => v.status === 'Submitted').length,
            approved: vvns.filter((v) => v.status === 'Approved').length,
            rejected: vvns.filter((v) => v.status === 'Rejected').length,
            inProgress: vvns.filter((v) => v.status === 'InProgress').length,
        };
    }, [vvns, viewAsRole]);

    const myRepresentativeCitizenId = citizenId ?? 'AC1234567';

    const handleViewToggle = () => {
        if (viewAsRole === 'PortAuthorityOfficer') {
            setViewAsRole('ShippingAgentRepresentative');
        } else {
            setViewAsRole('PortAuthorityOfficer');
        }
    };

    return {
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
    };
};