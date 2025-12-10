import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, RefreshCw, Download, Settings, Save, ChevronDown, ChevronUp, Eye, Ship } from 'lucide-react';
import { schedulingService } from '../services/schedulingService';
import type { DailyScheduleResponse, SchedulingAlgorithm, GeneticAlgorithmParams, CraneMode } from '../types/scheduling.types';
import type { CreateOperationPlanRequest } from '../services/schedulingService';
import StatCard from '../components/common/StatCard';

const SchedulingPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0] // Default to today (YYYY-MM-DD)
    );
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<SchedulingAlgorithm>('optimal');
    const [loading, setLoading] = useState(false);
    const [scheduleData, setScheduleData] = useState<DailyScheduleResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [planSaved, setPlanSaved] = useState(false);
    
    // UI State
    const [showDetailsView, setShowDetailsView] = useState(false);
    const [showWarnings, setShowWarnings] = useState(true);
    
    // Genetic Algorithm Parameters
    const [showGeneticParams, setShowGeneticParams] = useState(false);
    const [populationSize, setPopulationSize] = useState<number>(50);
    const [generations, setGenerations] = useState<number>(100);
    const [mutationRate, setMutationRate] = useState<number>(0.2);
    const [desiredTimeSeconds, setDesiredTimeSeconds] = useState<number>(5);
    const [craneMode, setCraneMode] = useState<CraneMode>('single');

    const handleGenerateSchedule = async () => {
        setLoading(true);
        setError(null);
        setScheduleData(null);
        setPlanSaved(false); // Reset saved state
        setSaveStatus('idle');

        try {
            let geneticParams: GeneticAlgorithmParams | undefined = undefined;
            
            if (selectedAlgorithm === 'genetic') {
                geneticParams = {
                    populationSize,
                    generations,
                    mutationRate,
                    desiredTimeSeconds,
                    craneMode
                };
            }
            
            const result = await schedulingService.generateDailySchedule(
                selectedDate, 
                selectedAlgorithm,
                geneticParams
            );
            setScheduleData(result);
        } catch (err: any) {
            console.error('Failed to generate schedule:', err);
            setError(err.message || 'Failed to generate schedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!scheduleData || !selectedDate || planSaved) return; // Prevent multiple saves

        setSaveStatus('saving');
        try {
            const planRequest: CreateOperationPlanRequest = {
                date: selectedDate,
                algorithm: selectedAlgorithm,
                geneticParams: selectedAlgorithm === 'genetic' ? {
                    populationSize,
                    generations,
                    mutationRate,
                    desiredTimeSeconds,
                    craneMode
                } : undefined,
                totalDelay: scheduleData.totalDelay,
                executionTimeMs: scheduleData.executionTimeMs,
                scheduledTasks: scheduleData.scheduledTasks.map(t => ({
                    vesselVisitId: t.vesselVisitId,
                    vesselImo: t.vesselImo,
                    vesselVisitBusinessId: t.vesselVisitBusinessId,
                    dockName: t.dockName,
                    resourceKind: t.resourceKind,
                    resourceId: t.resourceId,
                    staffShortName: t.staffShortName,
                    staffId: t.staffId,
                    startTime: t.startTime,
                    endTime: t.endTime
                }))
            };

            await schedulingService.saveOperationPlan(planRequest);
            setSaveStatus('success');
            setPlanSaved(true); // Mark as saved
            
            // Keep success message visible (don't auto-dismiss)
        } catch (error: any) {
            console.error('Failed to save plan:', error);
            setSaveStatus('error');
            
            // Reset error message after 5 seconds
            setTimeout(() => {
                setSaveStatus('idle');
            }, 5000);
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
    
    // Format date and time together for better clarity when operations span multiple days
    const formatDateAndTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
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
        
        // If duration is more than 24 hours, show days as well
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days}d ${remainingHours}h ${minutes}m`;
        }
        
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
        link.setAttribute('download', `schedule_${selectedDate}_${selectedAlgorithm}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Group tasks by dock for better visualization
    const groupTasksByDock = () => {
        if (!scheduleData) return {};
        
        const grouped: { [dockName: string]: typeof scheduleData.scheduledTasks } = {};
        
        scheduleData.scheduledTasks.forEach(task => {
            if (!grouped[task.dockName]) {
                grouped[task.dockName] = [];
            }
            grouped[task.dockName].push(task);
        });
        
        // Sort tasks within each dock by start time
        Object.keys(grouped).forEach(dock => {
            grouped[dock].sort((a, b) => 
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
        });
        
        return grouped;
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

            {/* Date and Algorithm Selection Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Target Date
                        </label>
                        <input
                            id="scheduleDate"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                    </div>

                    <div className="flex-1">
                        <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduling Algorithm
                        </label>
                        <select
                            id="algorithm"
                            value={selectedAlgorithm}
                            onChange={(e) => {
                                const algo = e.target.value as SchedulingAlgorithm;
                                setSelectedAlgorithm(algo);
                                setShowGeneticParams(algo === 'genetic');
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg"
                        >
                            <option value="optimal">Optimal (Minimize Delays)</option>
                            <option value="heuristic">Heuristic (Fast Approximation)</option>
                            <option value="multicrane">Multi-Crane (Advanced)</option>
                            <option value="genetic">Genetic Algorithm (AI-Based)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleGenerateSchedule}
                        disabled={loading || !selectedDate}
                        className="btn btn-primary text-lg px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

                {/* Genetic Algorithm Parameters Panel */}
                {selectedAlgorithm === 'genetic' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => setShowGeneticParams(!showGeneticParams)}
                            className="w-full flex items-center justify-between text-left mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-700" />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Genetic Algorithm Parameters
                                </h3>
                            </div>
                            {showGeneticParams ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>

                        {showGeneticParams && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                                {/* ...existing genetic params inputs... */}
                                <div>
                                    <label htmlFor="populationSize" className="block text-sm font-medium text-gray-700 mb-2">
                                        Population Size
                                    </label>
                                    <input
                                        id="populationSize"
                                        type="number"
                                        min="10"
                                        max="500"
                                        value={populationSize}
                                        onChange={(e) => setPopulationSize(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Number of solutions in each generation (10-500)</p>
                                </div>

                                {/* Generations */}
                                <div>
                                    <label htmlFor="generations" className="block text-sm font-medium text-gray-700 mb-2">
                                        Generations
                                    </label>
                                    <input
                                        id="generations"
                                        type="number"
                                        min="10"
                                        max="1000"
                                        value={generations}
                                        onChange={(e) => setGenerations(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Number of evolution iterations (10-1000)</p>
                                </div>

                                {/* Mutation Rate */}
                                <div>
                                    <label htmlFor="mutationRate" className="block text-sm font-medium text-gray-700 mb-2">
                                        Mutation Rate
                                    </label>
                                    <input
                                        id="mutationRate"
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={mutationRate}
                                        onChange={(e) => setMutationRate(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Probability of random changes (0.0-1.0)</p>
                                </div>

                                {/* Desired Time */}
                                <div>
                                    <label htmlFor="desiredTime" className="block text-sm font-medium text-gray-700 mb-2">
                                        Desired Time (seconds)
                                    </label>
                                    <input
                                        id="desiredTime"
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={desiredTimeSeconds}
                                        onChange={(e) => setDesiredTimeSeconds(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Maximum computation time (1-60 seconds)</p>
                                </div>

                                {/* Crane Mode */}
                                <div>
                                    <label htmlFor="craneMode" className="block text-sm font-medium text-gray-700 mb-2">
                                        Crane Mode
                                    </label>
                                    <select
                                        id="craneMode"
                                        value={craneMode}
                                        onChange={(e) => setCraneMode(e.target.value as CraneMode)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="single">Single Crane per Vessel</option>
                                        <option value="multiple">Multiple Cranes per Vessel</option>
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Crane allocation strategy per dock</p>
                                </div>

                                {/* Preset Configurations */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quick Presets
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setPopulationSize(30);
                                                setGenerations(50);
                                                setMutationRate(0.3);
                                                setDesiredTimeSeconds(3);
                                            }}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                        >
                                            Fast
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPopulationSize(50);
                                                setGenerations(100);
                                                setMutationRate(0.2);
                                                setDesiredTimeSeconds(5);
                                            }}
                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                        >
                                            Balanced
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPopulationSize(100);
                                                setGenerations(200);
                                                setMutationRate(0.15);
                                                setDesiredTimeSeconds(10);
                                            }}
                                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                        >
                                            Quality
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Pre-configured parameter sets</p>
                                </div>
                            </div>
                        )}
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
            {scheduleData && (
                <>
                    {/* Success Message (if saved) */}
                    {saveStatus === 'success' && planSaved && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-green-800 font-medium">Plan saved successfully!</p>
                                <p className="text-green-700 text-sm">The operation plan has been saved to the OEM system and is now available in the history.</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {saveStatus === 'error' && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-red-800 font-medium">Failed to save plan</p>
                                <p className="text-red-700 text-sm">Please check your connection and try again.</p>
                            </div>
                        </div>
                    )}

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
                            description="Cumulative delay from desired times"
                        />
                        <StatCard
                            title="Computation Time"
                            value={`${scheduleData.executionTimeMs.toFixed(0)} ms`}
                            description={`Algorithm: ${selectedAlgorithm}`}
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
                            <button
                                onClick={() => setShowWarnings(!showWarnings)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                                    <h3 className="font-semibold text-yellow-800">
                                        {scheduleData.warnings.length} Warning{scheduleData.warnings.length > 1 ? 's' : ''} Detected
                                    </h3>
                                </div>
                                {showWarnings ? (
                                    <ChevronUp className="w-5 h-5 text-yellow-600" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-yellow-600" />
                                )}
                            </button>
                            {showWarnings && (
                                <ul className="mt-3 ml-7 space-y-1">
                                    {scheduleData.warnings.map((warning, index) => (
                                        <li key={index} className="text-yellow-700 text-sm">
                                            • {warning}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Main Schedule Summary */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Schedule Summary for {new Date(selectedDate).toLocaleDateString('en-GB', { 
                                        day: '2-digit', 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    {scheduleData.scheduledTasks.length} operations scheduled
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {scheduleData.scheduledTasks.length > 0 && (
                                    <button
                                        onClick={exportToCSV}
                                        className="btn btn-secondary flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                )}
                                {!planSaved && scheduleData.scheduledTasks.length > 0 && (
                                    <button
                                        onClick={handleSavePlan}
                                        disabled={saveStatus === 'saving'}
                                        className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saveStatus === 'saving' ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save Plan
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {scheduleData.scheduledTasks.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Ship className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-lg font-medium">No operations scheduled</p>
                                <p className="text-sm mt-1">There are no vessel visits requiring scheduling for this date.</p>
                            </div>
                        ) : (
                            <>
                                {/* Per-Dock Schedule View */}
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Operations by Dock</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {Object.entries(groupTasksByDock()).map(([dockName, tasks]) => (
                                            <div key={dockName} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                                    {dockName}
                                                    <span className="ml-2 text-sm text-gray-500">({tasks.length} ops)</span>
                                                </h4>
                                                <div className="space-y-2">
                                                    {tasks.map((task, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded border border-gray-200 hover:shadow-sm transition-shadow">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-medium text-gray-900">{task.vesselVisitBusinessId}</span>
                                                                <span className="text-xs text-gray-500">{calculateDuration(task.startTime, task.endTime)}</span>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                <div>{formatTime(task.startTime)} → {formatTime(task.endTime)}</div>
                                                                <div className="text-xs mt-1 text-gray-500">
                                                                    {task.resourceKind} • {task.staffShortName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Detailed View Toggle */}
                                <div className="border-t border-gray-200">
                                    <button
                                        onClick={() => setShowDetailsView(!showDetailsView)}
                                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-5 h-5 text-gray-600" />
                                            <span className="font-medium text-gray-700">
                                                {showDetailsView ? 'Hide' : 'View'} Detailed Schedule & Timeline
                                            </span>
                                        </div>
                                        {showDetailsView ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </button>

                                    {showDetailsView && (
                                        <div className="border-t border-gray-200">
                                            {/* Complete Schedule Table */}
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Complete Schedule Details</h3>
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
                                                                    Resource
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
                                                            {scheduleData.scheduledTasks
                                                                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                                                                .map((task, index) => (
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
                                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                                        {formatDateAndTime(task.startTime)}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                                        {formatDateAndTime(task.endTime)}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                        {calculateDuration(task.startTime, task.endTime)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Timeline View */}
                                            <div className="p-6 border-t border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline View</h3>
                                                <div className="space-y-3">
                                                    {scheduleData.scheduledTasks
                                                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                                                        .map((task, index) => (
                                                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-700">
                                                                    {formatTime(task.startTime)}
                                                                </div>
                                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-gray-900">{task.vesselVisitBusinessId}</span>
                                                                        <span className="text-gray-400">→</span>
                                                                        <span className="text-gray-700">{task.dockName}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        {task.resourceKind} • {task.staffShortName} • {calculateDuration(task.startTime, task.endTime)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-shrink-0 text-sm text-gray-500">
                                                                    {formatTime(task.endTime)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
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

