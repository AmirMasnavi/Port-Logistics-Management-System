import React, { useState, useEffect } from 'react';
import { Ship, Calendar, Filter, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { vveService, type VveFilters, type VveWithMetrics } from '../services/vveService';
import StatCard from '../components/common/StatCard';

const VesselVisitsExecutionPage: React.FC = () => {
    const [vves, setVves] = useState<VveWithMetrics[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Filter states
    const [statusFilter, setStatusFilter] = useState<'In Progress' | 'Completed' | 'Cancelled' | ''>('');
    const [vesselFilter, setVesselFilter] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    
    // View mode: 'table' or 'timeline'
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

    useEffect(() => {
        // Load VVEs on component mount with default last 30 days
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        const fromDateStr = defaultFromDate.toISOString().split('T')[0];
        const toDateStr = new Date().toISOString().split('T')[0];
        
        setFromDate(fromDateStr);
        setToDate(toDateStr);
        
        // Call search with the date values directly since state updates are async
        loadInitialData(fromDateStr, toDateStr);
    }, []);

    const loadInitialData = async (from: string, to: string) => {
        setLoading(true);
        setError(null);

        try {
            const filters: VveFilters = {
                includeMetrics: true,
                fromDate: from,
                toDate: to,
            };

            const result = await vveService.getAllVves(filters);
            setVves(result);
        } catch (err: any) {
            console.error('Failed to fetch VVEs:', err);
            setError(err.message || 'Failed to fetch vessel visit executions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const filters: VveFilters = {
                includeMetrics: true, // Always include metrics for analysis
            };

            if (statusFilter) filters.status = statusFilter;
            if (vesselFilter) filters.vesselIdentifier = vesselFilter;
            if (fromDate) filters.fromDate = fromDate;
            if (toDate) filters.toDate = toDate;

            console.log('[VVE Search] Filters being sent:', filters);

            const result = await vveService.getAllVves(filters);
            console.log('[VVE Search] Results received:', result.length);
            setVves(result);
        } catch (err: any) {
            console.error('Failed to fetch VVEs:', err);
            setError(err.message || 'Failed to fetch vessel visit executions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (hours: number | null) => {
        if (hours === null) return 'N/A';
        const absHours = Math.abs(hours);
        const h = Math.floor(absHours);
        const m = Math.round((absHours - h) * 60);
        return `${hours < 0 ? '-' : ''}${h}h ${m}m`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'In Progress':
                return <Clock className="w-5 h-5 text-blue-500" />;
            case 'Cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDelayIndicator = (delay: number | null) => {
        if (delay === null) return <Minus className="w-4 h-4 text-gray-400" />;
        if (delay > 1) return <TrendingDown className="w-4 h-4 text-red-500" />; // Late
        if (delay < -1) return <TrendingUp className="w-4 h-4 text-green-500" />; // Early
        return <Minus className="w-4 h-4 text-blue-500" />; // On time
    };

    // Calculate summary statistics
    const stats = {
        total: vves.length,
        completed: vves.filter(v => v.status === 'Completed').length,
        inProgress: vves.filter(v => v.status === 'In Progress').length,
        cancelled: vves.filter(v => v.status === 'Cancelled').length,
        avgTurnaround: vves
            .filter(v => v.metrics?.totalTurnaroundTime !== null)
            .reduce((sum, v) => sum + (v.metrics?.totalTurnaroundTime || 0), 0) / 
            (vves.filter(v => v.metrics?.totalTurnaroundTime !== null).length || 1),
        avgDelay: vves
            .filter(v => v.metrics?.arrivalDelay !== null)
            .reduce((sum, v) => sum + (v.metrics?.arrivalDelay || 0), 0) / 
            (vves.filter(v => v.metrics?.arrivalDelay !== null).length || 1),
    };

    return (
        <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Ship className="w-8 h-8" />
                    Vessel Visit Executions
                </h1>
                <p className="text-gray-600 mt-1">
                    Monitor and analyze vessel visit execution history and performance metrics
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Executions"
                    value={stats.total}
                    description="All vessel visits"
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    description="Successfully completed"
                />
                <StatCard
                    title="In Progress"
                    value={stats.inProgress}
                    description="Currently executing"
                />
                <StatCard
                    title="Avg Turnaround"
                    value={formatDuration(stats.avgTurnaround)}
                    description="Average total time"
                />
            </div>

            {/* Filters Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-between text-left mb-4"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-800">Search & Filter</h3>
                    </div>
                    <span className="text-sm text-gray-500">
                        {showFilters ? 'Hide' : 'Show'} Filters
                    </span>
                </button>

                {showFilters && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Date Range */}
                            <div>
                                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date
                                </label>
                                <input
                                    id="fromDate"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date
                                </label>
                                <input
                                    id="toDate"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="">All Status</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Vessel Filter */}
                            <div>
                                <label htmlFor="vessel" className="block text-sm font-medium text-gray-700 mb-2">
                                    Vessel (IMO/Name)
                                </label>
                                <input
                                    id="vessel"
                                    type="text"
                                    placeholder="Search vessel..."
                                    value={vesselFilter}
                                    onChange={(e) => setVesselFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Filter className="w-5 h-5" />
                                        Search
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setStatusFilter('');
                                    setVesselFilter('');
                                    const defaultFromDate = new Date();
                                    defaultFromDate.setDate(defaultFromDate.getDate() - 30);
                                    setFromDate(defaultFromDate.toISOString().split('T')[0]);
                                    setToDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="btn btn-secondary"
                            >
                                Clear Filters
                            </button>

                            <div className="ml-auto flex gap-2">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 py-2 rounded-lg ${
                                        viewMode === 'table'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Table View
                                </button>
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`px-4 py-2 rounded-lg ${
                                        viewMode === 'timeline'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Timeline View
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && vves.length > 0 && (
                <>
                    {viewMode === 'table' ? (
                        /* Table View */
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Execution History ({vves.length} results)
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                VVE ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vessel
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actual Arrival
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Arrival Delay
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Turnaround Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Operation Delay
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {vves.map((vve) => (
                                            <tr key={vve.vveId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {vve.vveId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <Ship className="w-4 h-4 text-gray-400" />
                                                        {vve.vesselIdentifier}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {vve.vvnData?.assignedDockName || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {formatDateTime(vve.actualArrivalTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {getDelayIndicator(vve.metrics?.arrivalDelay || null)}
                                                        <span className={
                                                            vve.metrics?.arrivalDelay && vve.metrics.arrivalDelay > 1
                                                                ? 'text-red-600 font-medium'
                                                                : vve.metrics?.arrivalDelay && vve.metrics.arrivalDelay < -1
                                                                ? 'text-green-600 font-medium'
                                                                : 'text-gray-700'
                                                        }>
                                                            {formatDuration(vve.metrics?.arrivalDelay || null)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatDuration(vve.metrics?.totalTurnaroundTime || null)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {getDelayIndicator(vve.metrics?.operationDelay || null)}
                                                        <span className={
                                                            vve.metrics?.operationDelay && vve.metrics.operationDelay > 1
                                                                ? 'text-red-600 font-medium'
                                                                : vve.metrics?.operationDelay && vve.metrics.operationDelay < -1
                                                                ? 'text-green-600 font-medium'
                                                                : 'text-gray-700'
                                                        }>
                                                            {formatDuration(vve.metrics?.operationDelay || null)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(vve.status)}
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(vve.status)}`}>
                                                            {vve.status}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Timeline View */
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                Execution Timeline ({vves.length} results)
                            </h2>
                            <div className="space-y-4">
                                {vves.map((vve) => (
                                    <div key={vve.vveId} className="relative pl-8 pb-8 border-l-2 border-gray-300">
                                        {/* Timeline dot */}
                                        <div className="absolute left-0 top-0 -ml-2 flex items-center justify-center w-4 h-4">
                                            <div className={`w-4 h-4 rounded-full ${
                                                vve.status === 'Completed' ? 'bg-green-500' :
                                                vve.status === 'In Progress' ? 'bg-blue-500' :
                                                'bg-red-500'
                                            }`}></div>
                                        </div>

                                        {/* Event card */}
                                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                        <Ship className="w-5 h-5" />
                                                        {vve.vesselIdentifier}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{vve.vveId}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(vve.status)}`}>
                                                    {vve.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Arrival</p>
                                                    <p className="font-medium text-gray-900">{formatDateTime(vve.actualArrivalTime)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Arrival Delay</p>
                                                    <p className="font-medium">{formatDuration(vve.metrics?.arrivalDelay || null)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Turnaround Time</p>
                                                    <p className="font-medium">{formatDuration(vve.metrics?.totalTurnaroundTime || null)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Dock</p>
                                                    <p className="font-medium">{vve.vvnData?.assignedDockName || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* No Results */}
            {!loading && vves.length === 0 && !error && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Executions Found</h3>
                    <p className="text-gray-600">
                        No vessel visit executions match your search criteria. Try adjusting the filters.
                    </p>
                </div>
            )}
        </div>
    );
};

export default VesselVisitsExecutionPage;

