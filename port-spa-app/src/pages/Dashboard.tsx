import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import StatCard from '../components/common/StatCard';
import { VvnService } from '../app/vvn/vvn.service';
import { vvnApiRepository } from '../infrastructure/repositories/vvn/vvnApi.repository';
import type { VesselVisitNotification } from '../domain/vvn/vvn.model';
import { getAdminStats, type AdminStats } from '../services/apiService';

const vvnService = new VvnService(vvnApiRepository);

interface DashboardStats {
    pendingApprovals: number;
    activeVessels: number;
    dockOccupancy: number;
    weeklySubmissions: number;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { internalRole, citizenId } = useAuth();
    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        pendingApprovals: 0,
        activeVessels: 0,
        dockOccupancy: 0,
        weeklySubmissions: 0,
    });
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

    // Determine which view to show based on role
    const [viewAsRole, setViewAsRole] = useState(internalRole);

    useEffect(() => {
        if (internalRole === 'Administrator') {
            // Default to PortAuthorityOfficer view for admins
            setViewAsRole('PortAuthorityOfficer');
        } else {
            setViewAsRole(internalRole);
        }
    }, [internalRole]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const data = await vvnService.fetchAllVvns();
                setVvns(data);
                calculateStats(data);
                
                // Fetch admin stats if user is administrator
                if (internalRole === 'Administrator') {
                    try {
                        const adminData = await getAdminStats();
                        setAdminStats(adminData);
                    } catch (adminError) {
                        console.error('Failed to fetch admin stats:', adminError);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [internalRole]);

    const calculateStats = (notifications: VesselVisitNotification[]) => {
        const pending = notifications.filter(vvn => vvn.status === 'Submitted').length;
        const approved = notifications.filter(vvn => vvn.status === 'Approved').length;
        
        // Get submission date from the latest entry in decisionLog
        const weeklySubmissions = notifications.filter(vvn => {
            if (vvn.status === 'InProgress') return false; // Not submitted yet
            
            // For submitted/approved/rejected, check if any decision was made in the last week
            const recentDecision = vvn.decisionLog.find(entry => {
                const entryDate = new Date(entry.timestamp);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return entryDate >= weekAgo;
            });
            
            return !!recentDecision;
        }).length;

        // Mock data for demonstration - replace with real API calls
        setStats({
            pendingApprovals: pending,
            activeVessels: approved,
            dockOccupancy: 75, // This would come from a dock/berth API
            weeklySubmissions: weeklySubmissions,
        });
    };

    const handleRoleBadgeClick = (role: 'PortAuthorityOfficer' | 'LogisticsOperator' | 'ShippingAgentRepresentative' | 'Administrator') => {
        if (internalRole === 'Administrator') {
            setViewAsRole(role);
        }
    };

    // Get pending VVNs for the current view
    const getPendingVvns = () => {
        if (viewAsRole === 'ShippingAgentRepresentative') {
            // Show agent's own submitted VVNs waiting for approval
            return vvns.filter(vvn => vvn.status === 'Submitted').slice(0, 3);
        } else {
            // Show all submitted VVNs awaiting officer approval
            return vvns.filter(vvn => vvn.status === 'Submitted').slice(0, 3);
        }
    };

    const getQuickActions = () => {
        if (viewAsRole === 'ShippingAgentRepresentative') {
            return [
                {
                    label: 'Create Visit Notification',
                    onClick: () => navigate('/vessel-visits/new', { state: { representativeCitizenId: citizenId } }),
                    primary: true,
                },
                {
                    label: 'View My Submissions',
                    onClick: () => navigate('/vessel-visits'),
                    primary: false,
                },
                {
                    label: 'View Port Status',
                    onClick: () => navigate('/port-facilities'),
                    primary: false,
                },
            ];
        } else if (viewAsRole === 'LogisticsOperator') {
            return [
                {
                    label: 'Manage Resources',
                    onClick: () => navigate('/resources'),
                    primary: true,
                },
                {
                    label: 'View Port Facilities',
                    onClick: () => navigate('/port-facilities'),
                    primary: false,
                },
                {
                    label: 'View Schedules',
                    onClick: () => alert('Schedules feature coming soon'),
                    primary: false,
                },
            ];
        } else {
            // Officer or Admin view
            return [
                {
                    label: 'Review Submissions',
                    onClick: () => navigate('/vessel-visits'),
                    primary: true,
                },
                {
                    label: 'View Port Status',
                    onClick: () => navigate('/port-facilities'),
                    primary: false,
                },
                {
                    label: 'Generate Reports',
                    onClick: () => alert('Reports feature coming soon'),
                    primary: false,
                },
            ];
        }
    };

    const getDashboardTitle = () => {
        if (viewAsRole === 'ShippingAgentRepresentative') {
            return 'Dashboard';
        } else if (viewAsRole === 'PortAuthorityOfficer') {
            return 'Dashboard';
        } else if (viewAsRole === 'LogisticsOperator') {
            return 'Dashboard';
        } else {
            return 'Dashboard';
        }
    };

    const getDashboardSubtitle = () => {
        if (viewAsRole === 'ShippingAgentRepresentative') {
            return "Welcome back! Here's your overview.";
        } else if (viewAsRole === 'PortAuthorityOfficer') {
            return "Welcome back! Here's your overview.";
        } else if (viewAsRole === 'LogisticsOperator') {
            return "Welcome back! Here's your overview.";
        } else {
            return "Welcome back! Here's your overview.";
        }
    };

    const getRoleBadges = () => {
        const badges = [];
        
        // If user is an administrator, show all roles as clickable badges
        if (internalRole === 'Administrator') {
            badges.push({ 
                label: 'port officer', 
                color: viewAsRole === 'PortAuthorityOfficer' ? '#2596be' : '#2596be80',
                role: 'PortAuthorityOfficer' as const,
                active: viewAsRole === 'PortAuthorityOfficer'
            });
            badges.push({ 
                label: 'logistics operator', 
                color: viewAsRole === 'LogisticsOperator' ? '#2596be' : '#2596be80',
                role: 'LogisticsOperator' as const,
                active: viewAsRole === 'LogisticsOperator'
            });
            badges.push({ 
                label: 'shipping agent', 
                color: viewAsRole === 'ShippingAgentRepresentative' ? '#2596be' : '#2596be80',
                role: 'ShippingAgentRepresentative' as const,
                active: viewAsRole === 'ShippingAgentRepresentative'
            });
            badges.push({ 
                label: 'administrator', 
                color: viewAsRole === 'Administrator' ? '#2596be' : '#2596be80',
                role: 'Administrator' as const,
                active: viewAsRole === 'Administrator'
            });
        } else {
            // For non-admin users, just show their role
            if (internalRole === 'PortAuthorityOfficer') {
                badges.push({ label: 'port officer', color: '#2596be', role: 'PortAuthorityOfficer' as const, active: true });
            }
            if (internalRole === 'LogisticsOperator') {
                badges.push({ label: 'logistics operator', color: '#2596be', role: 'LogisticsOperator' as const, active: true });
            }
            if (internalRole === 'ShippingAgentRepresentative') {
                badges.push({ label: 'shipping agent', color: '#2596be', role: 'ShippingAgentRepresentative' as const, active: true });
            }
        }
        
        return badges;
    };

    const formatTimeAgo = (vvn: VesselVisitNotification) => {
        // Get the most recent decision log entry timestamp
        if (!vvn.decisionLog || vvn.decisionLog.length === 0) {
            return 'Unknown';
        }
        
        const latestEntry = vvn.decisionLog[vvn.decisionLog.length - 1];
        const now = new Date();
        const submitted = new Date(latestEntry.timestamp);
        const diffMs = now.getTime() - submitted.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Just now';
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    const pendingVvns = getPendingVvns();
    const quickActions = getQuickActions();

    if (loading) {
        return (
            <div className="container mx-auto">
                <div className="text-center py-10">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
                    <p className="text-gray-600 mt-1">{getDashboardSubtitle()}</p>
                </div>
            </div>

            {/* Role Badges */}
            <div className="flex gap-2 mb-6">
                {getRoleBadges().map((badge, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleRoleBadgeClick(badge.role)}
                        disabled={internalRole !== 'Administrator'}
                        style={{ backgroundColor: badge.color }}
                        className={`text-white px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            internalRole === 'Administrator'
                                ? 'cursor-pointer hover:opacity-80 hover:scale-105'
                                : 'cursor-default'
                        }`}
                    >
                        {badge.label}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {viewAsRole === 'Administrator' ? (
                    <>
                        <StatCard
                            title="Active Users"
                            value={adminStats?.activeUsers ?? 0}
                            description="Across all roles"
                        />
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="text-sm font-medium text-gray-500">System Status</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <div className="text-3xl font-bold" style={{ color: '#2596be' }}>Operational</div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">All services running</p>
                        </div>
                        <StatCard
                            title="Total Staff Members"
                            value={adminStats?.totalStaffMembers ?? 0}
                            description="Port staff registered"
                        />
                        <StatCard
                            title="Organizations"
                            value={adminStats?.totalOrganizations ?? 0}
                            description="Shipping agent organizations"
                        />
                    </>
                ) : viewAsRole === 'ShippingAgentRepresentative' ? (
                    <>
                        <StatCard
                            title="In Progress"
                            value={vvns.filter(v => v.status === 'InProgress').length}
                            description="Visits you are still drafting."
                        />
                        <StatCard
                            title="Pending Review"
                            value={stats.pendingApprovals}
                            description="Visits awaiting port approval."
                        />
                        <StatCard
                            title="Approved"
                            value={stats.activeVessels}
                            description="Visits approved by the port."
                        />
                        <StatCard
                            title="This Week"
                            value={stats.weeklySubmissions}
                            description="New submissions you made."
                        />
                    </>
                ) : viewAsRole === 'LogisticsOperator' ? (
                    <>
                        <StatCard
                            title="Active Operations"
                            value={stats.activeVessels}
                            description="Vessels currently being serviced"
                        />
                        <StatCard
                            title="Resource Utilization"
                            value={`${stats.dockOccupancy}%`}
                            description="Current resource allocation"
                        />
                        <StatCard
                            title="Scheduled Tasks"
                            value={stats.pendingApprovals}
                            description="Tasks pending execution"
                        />
                        <StatCard
                            title="Completed This Week"
                            value={stats.weeklySubmissions}
                            description="Operations completed"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Pending Approvals"
                            value={stats.pendingApprovals}
                            description="Vessel visits awaiting review"
                        />
                        <StatCard
                            title="Active Vessels"
                            value={stats.activeVessels}
                            description="Currently in port"
                        />
                        <StatCard
                            title="Dock Occupancy"
                            value={`${stats.dockOccupancy}%`}
                            description="Currently assigned"
                        />
                        <StatCard
                            title="This Week"
                            value={stats.weeklySubmissions}
                            description="New submissions received"
                        />
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {viewAsRole === 'Administrator' ? (
                    <>
                        {/* System Monitoring - 2/3 width */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">System Monitoring</h2>
                            <p className="text-gray-600 text-sm mb-6">Recent system activities and alerts</p>

                            <div className="space-y-3">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base">Database backup completed</h3>
                                        <p className="text-sm text-gray-600">30 min ago</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        Success
                                    </span>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base">New user registered</h3>
                                        <p className="text-sm text-gray-600">1 hour ago</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                        Info
                                    </span>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-base">API response time normal</h3>
                                        <p className="text-sm text-gray-600">2 hours ago</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        Success
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Admin Actions - 1/3 width */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Actions</h2>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    style={{ backgroundColor: '#2596be' }}
                                    className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-white hover:opacity-90"
                                >
                                    Manage Users
                                </button>
                                <button
                                    onClick={() => alert('System Settings coming soon')}
                                    className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    System Settings
                                </button>
                                <button
                                    onClick={() => alert('System Logs coming soon')}
                                    className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    View System Logs
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Pending Vessel Visits - 2/3 width */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {viewAsRole === 'ShippingAgentRepresentative' 
                                    ? 'My Pending Submissions' 
                                    : viewAsRole === 'LogisticsOperator'
                                    ? 'Active Operations'
                                    : 'Pending Vessel Visits'}
                            </h2>
                            <p className="text-gray-600 text-sm mb-6">
                                {viewAsRole === 'ShippingAgentRepresentative'
                                    ? 'Your notifications currently under review'
                                    : viewAsRole === 'LogisticsOperator'
                                    ? 'Vessels currently requiring logistics support'
                                    : 'Notifications awaiting your approval'}
                            </p>

                            <div className="space-y-3">
                                {pendingVvns.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {viewAsRole === 'LogisticsOperator' 
                                            ? 'No active operations at the moment.'
                                            : 'No pending visits at the moment.'}
                                    </div>
                                ) : (
                                    pendingVvns.map((vvn) => (
                                        <div
                                            key={vvn.businessId}
                                            className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center hover:bg-blue-100 transition-colors cursor-pointer"
                                            onClick={() => navigate('/vessel-visits')}
                                        >
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    Vessel: {vvn.vesselImo}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {viewAsRole === 'LogisticsOperator' 
                                                        ? `Arrival: ${new Date(vvn.estimatedArrival).toLocaleDateString()}`
                                                        : `Submitted ${formatTimeAgo(vvn)}`}
                                                </p>
                                            </div>
                                            <span 
                                                style={{ backgroundColor: '#2596be' }}
                                                className="text-white px-3 py-1 rounded-full text-sm font-medium"
                                            >
                                                {viewAsRole === 'LogisticsOperator' ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Quick Actions - 1/3 width */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                            <div className="space-y-3">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={action.onClick}
                                        style={action.primary ? { backgroundColor: '#2596be' } : {}}
                                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                            action.primary
                                                ? 'text-white hover:opacity-90'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

