/**
 * US 4.1.6 - Resource Allocation Metrics Page
 * Shows how long a resource was allocated within a specific period
 */
import React, { useState, useEffect } from 'react';
import { 
    resourceMetricsService,
    type ResourceType,
    type ResourceAllocationSummary,
    type ResourceAllocationBreakdown 
} from '../services/resourceMetricsService';
import { schedulingService } from '../services/schedulingService';

interface ResourceOption {
    id: string;
    name: string;
    type: string;
}

export default function ResourceAllocationMetricsPage() {
    // Form state
    const [resourceType, setResourceType] = useState<ResourceType>('crane');
    const [resourceId, setResourceId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showBreakdown, setShowBreakdown] = useState(false);
    
    // Data state
    const [resources, setResources] = useState<ResourceOption[]>([]);
    const [staff, setStaff] = useState<ResourceOption[]>([]);
    const [docks, setDocks] = useState<ResourceOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingResources, setLoadingResources] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<ResourceAllocationSummary | null>(null);
    const [breakdown, setBreakdown] = useState<ResourceAllocationBreakdown | null>(null);

    // Load available resources on mount
    useEffect(() => {
        const loadResources = async () => {
            try {
                setLoadingResources(true);
                const data = await schedulingService.getResourcesAndStaff();
                
                // Filter resources by type
                const craneResources = data.resources
                    .filter((r: any) => r.type?.toLowerCase() === 'crane')
                    .map((r: any) => ({ id: r.id, name: r.name || r.id, type: 'crane' }));
                
                const dockResources = data.resources
                    .filter((r: any) => r.type?.toLowerCase() === 'dock')
                    .map((r: any) => ({ id: r.id, name: r.name || r.id, type: 'dock' }));
                
                const staffMembers = data.staff
                    .map((s: any) => ({ id: s.id, name: s.name || s.id, type: 'staff' }));

                setResources(craneResources);
                setDocks(dockResources);
                setStaff(staffMembers);
                
            } catch (err) {
                console.error('Failed to load resources:', err);
            } finally {
                setLoadingResources(false);
            }
        };
        
        loadResources();
    }, []);

    // Get current resource options based on selected type
    const getCurrentOptions = (): ResourceOption[] => {
        switch (resourceType) {
            case 'crane':
                return resources;
            case 'dock':
                return docks;
            case 'staff':
                return staff;
            default:
                return [];
        }
    };

    // Reset resource selection when type changes
    useEffect(() => {
        setResourceId('');
        setSummary(null);
        setBreakdown(null);
    }, [resourceType]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSummary(null);
        setBreakdown(null);

        // Validate inputs
        if (!resourceId) {
            setError('Please select a resource');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select start and end dates');
            return;
        }

        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);
        
        if (toDate <= fromDate) {
            setError('End date must be after start date');
            return;
        }

        setLoading(true);

        try {
            const request = {
                resourceType,
                resourceId,
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
            };

            if (showBreakdown) {
                const result = await resourceMetricsService.getResourceAllocationBreakdown(request);
                setBreakdown(result);
                setSummary(result);
            } else {
                const result = await resourceMetricsService.getResourceAllocationSummary(request);
                setSummary(result);
            }
        } catch (err: any) {
            console.error('Failed to fetch metrics:', err);
            setError(err.message || 'Failed to fetch allocation data');
        } finally {
            setLoading(false);
        }
    };

    const formatHours = (hours: number): string => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    Resource Allocation Metrics
                </h1>
                <p className="text-gray-600 mt-1">
                    View how long resources were allocated in saved Operation Plans
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Resource Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resource Type
                        </label>
                        <select
                            value={resourceType}
                            onChange={(e) => setResourceType(e.target.value as ResourceType)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="crane">Crane</option>
                            <option value="dock">Dock</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>

                    {/* Resource Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resource
                        </label>
                        <select
                            value={resourceId}
                            onChange={(e) => setResourceId(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loadingResources}
                        >
                            <option value="">
                                {loadingResources 
                                    ? 'Loading...' 
                                    : 'Select a resource'}
                            </option>
                            {getCurrentOptions().map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name} ({option.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Search Button */}
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading 
                                ? 'Loading...' 
                                : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Show Breakdown Toggle */}
                <div className="mt-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={showBreakdown}
                            onChange={(e) => setShowBreakdown(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                            Show daily breakdown
                        </span>
                    </label>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Summary Results */}
            {summary && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Allocation Summary
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-sm text-blue-600 font-medium">
                                    Resource
                                </div>
                                <div className="text-xl font-bold text-blue-900 mt-1">
                                    {summary.resourceType.charAt(0).toUpperCase() + summary.resourceType.slice(1)}: {summary.resourceId}
                                </div>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-sm text-green-600 font-medium">
                                    Total Allocated Time
                                </div>
                                <div className="text-xl font-bold text-green-900 mt-1">
                                    {formatHours(summary.totalAllocatedHours)}
                                </div>
                                <div className="text-sm text-green-600">
                                    ({summary.totalAllocatedMinutes} minutes)
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-sm text-purple-600 font-medium">
                                    Number of Operations
                                </div>
                                <div className="text-xl font-bold text-purple-900 mt-1">
                                    {summary.numberOfOperations}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 font-medium">
                                    Period
                                </div>
                                <div className="text-sm font-medium text-gray-900 mt-1">
                                    {new Date(summary.period.from).toLocaleDateString()} - {new Date(summary.period.to).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Summary Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Resource
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Period Start
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Period End
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total (min)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total (hours)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Operations
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {summary.resourceType} - {summary.resourceId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(summary.period.from).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(summary.period.to).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {summary.totalAllocatedMinutes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {summary.totalAllocatedHours.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {summary.numberOfOperations}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Breakdown */}
            {breakdown && breakdown.breakdownByDay && breakdown.breakdownByDay.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Daily Breakdown
                        </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Allocated (min)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Allocated (hours)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Operations
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {breakdown.breakdownByDay.map((day, index) => (
                                    <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {new Date(day.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {day.allocatedMinutes}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {day.allocatedHours.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {day.operationCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && !summary && (
                <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-4">
                        Select a resource and date range to view allocation metrics
                    </p>
                </div>
            )}
        </div>
    );
}
