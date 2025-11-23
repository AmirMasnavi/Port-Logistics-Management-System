import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { schedulingService } from '../services/schedulingService';
import type { DailyScheduleResponse, SchedulingAlgorithm } from '../types/scheduling.types';
import StatCard from '../components/common/StatCard';

const SchedulingPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0] // Default to today (YYYY-MM-DD)
    );
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<SchedulingAlgorithm>('optimal');
    const [loading, setLoading] = useState(false);
    const [scheduleData, setScheduleData] = useState<DailyScheduleResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSchedule = async () => {
        setLoading(true);
        setError(null);
        setScheduleData(null);

        try {
            const result = await schedulingService.generateDailySchedule(selectedDate, selectedAlgorithm);
            setScheduleData(result);
        } catch (err: any) {
            console.error('Failed to generate schedule:', err);
            setError(err.message || 'Failed to generate schedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const calculateDuration = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const exportToCSV = () => {
        if (!scheduleData || !scheduleData.scheduledTasks.length) return;

        const headers = ['Vessel Visit', 'Dock', 'Resource (Crane)', 'Staff', 'Start Time', 'End Time', 'Duration'];
        const rows = scheduleData.scheduledTasks.map(task => [
            task.vesselVisitBusinessId,
            task.dockName,
            task.resourceKind,
            task.staffShortName,
            formatDateTime(task.startTime),
            formatDateTime(task.endTime),
            calculateDuration(task.startTime, task.endTime),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `schedule_${selectedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Daily Schedule Generator</h1>
                <p className="text-gray-600 mt-1">
                    Generate optimized loading and unloading schedules for vessels arriving at the port
                </p>
            </div>

            {/* Date Selection Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Select Target Date
                </h2>
                <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-md">
                        <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            id="scheduleDate"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Algorithm Selection */}
                    <div>
                        <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-2">
                            Algorithm
                        </label>
                        <select
                            id="algorithm"
                            value={selectedAlgorithm}
                            onChange={(e) => setSelectedAlgorithm(e.target.value as SchedulingAlgorithm)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="optimal">Optimal (Minimize Delays)</option>
                            <option value="heuristic">Heuristic (Fast Approximation)</option>
                            <option value="multicrane">Multi-Crane (Advanced)</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {selectedAlgorithm === 'optimal' && 'Best solution but slower computation'}
                            {selectedAlgorithm === 'heuristic' && 'Fast heuristic approach'}
                            {selectedAlgorithm === 'multicrane' && 'Multiple cranes per operation'}
                        </p>
                    </div>

                    <button
                        onClick={handleGenerateSchedule}
                        disabled={loading || !selectedDate}
                        className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Clock className="w-5 h-5" />
                                Generate Schedule
                            </>
                        )}
                    </button>
                </div>
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
            {scheduleData && (
                <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="Total Operations"
                            value={scheduleData.scheduledTasks.length}
                            description="Scheduled tasks for the day"
                        />
                        <StatCard
                            title="Total Delay"
                            value={scheduleData.totalDelay === 0 
                                ? "0 min (On Time)" 
                                : `${(scheduleData.totalDelay * 60).toFixed(0)} min`}
                            description="Cumulative delay from desired departure times"
                        />
                        <StatCard
                            title="Computation Time"
                            value={`${scheduleData.executionTimeMs.toFixed(0)} ms`}
                            description="Algorithm execution time"
                        />
                        <StatCard
                            title="Warnings"
                            value={scheduleData.warnings.length}
                            description={scheduleData.warnings.length > 0 ? "Issues detected" : "No issues"}
                        />
                    </div>

                    {/* Warnings Section */}
                    {scheduleData.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-800 mb-2">Warnings & Issues</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {scheduleData.warnings.map((warning, index) => (
                                            <li key={index} className="text-yellow-700 text-sm">
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Table */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Schedule for {new Date(selectedDate).toLocaleDateString('en-GB', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric' 
                                })}
                            </h2>
                            {scheduleData.scheduledTasks.length > 0 && (
                                <button
                                    onClick={exportToCSV}
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            )}
                        </div>

                        {scheduleData.scheduledTasks.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-lg font-medium">No operations scheduled</p>
                                <p className="text-sm mt-1">There are no vessel visits requiring scheduling for this date.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vessel Visit
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Resource (Crane)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Staff
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Start Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                End Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {scheduleData.scheduledTasks.map((task, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {task.vesselVisitBusinessId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {task.dockName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {task.resourceKind}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {task.staffShortName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatTime(task.startTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatTime(task.endTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {calculateDuration(task.startTime, task.endTime)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Timeline View - Optional Enhancement */}
                    {scheduleData.scheduledTasks.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Timeline View</h2>
                            <div className="space-y-4">
                                {scheduleData.scheduledTasks
                                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                                    .map((task, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-700">
                                                {formatTime(task.startTime)}
                                            </div>
                                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-900">{task.vesselVisitBusinessId}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="text-gray-700">Dock: {task.dockName}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Crane: {task.resourceKind} | Staff: {task.staffShortName} | Duration: {calculateDuration(task.startTime, task.endTime)}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 text-sm text-gray-500">
                                                → {formatTime(task.endTime)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating Schedule</h3>
                    <p className="text-gray-600">
                        Computing optimal schedule... This may take a few moments.
                    </p>
                </div>
            )}

            {/* Initial State - No Data Yet */}
            {!loading && !scheduleData && !error && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Generate Schedule</h3>
                    <p className="text-gray-600">
                        Select a date above and click "Generate Schedule" to compute the optimal daily schedule.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SchedulingPage;

