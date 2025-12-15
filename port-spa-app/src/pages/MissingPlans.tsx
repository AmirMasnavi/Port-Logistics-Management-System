import React, { useState } from 'react';
import { Calendar, AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { schedulingService } from '../services/schedulingService';
import type { SchedulingAlgorithm, GeneticAlgorithmParams, CraneMode, VesselVisitNotification, ExistingPlanSummary } from '../types/scheduling.types';
import StatCard from '../components/common/StatCard';

const MissingPlans: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<SchedulingAlgorithm>('automatic');
    const [loading, setLoading] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [missingVVNs, setMissingVVNs] = useState<VesselVisitNotification[]>([]);
    const [existingPlans, setExistingPlans] = useState<ExistingPlanSummary[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Genetic Algorithm Parameters (used when regenerating with genetic algorithm)
    const [populationSize] = useState<number>(50);
    const [generations] = useState<number>(100);
    const [mutationRate] = useState<number>(0.2);
    const [desiredTimeSeconds] = useState<number>(5);
    const [craneMode] = useState<CraneMode>('single');

    const handleCheckMissingPlans = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setMissingVVNs([]);
        setExistingPlans([]);

        try {
            const result = await schedulingService.getMissingPlans(selectedDate);
            setMissingVVNs(result.missingVVNs);
            setExistingPlans(result.existingPlans);
        } catch (err: any) {
            console.error('Failed to check missing plans:', err);
            setError(err.message || 'Failed to check missing plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegeneratePlans = async () => {
        setShowConfirmDialog(false);
        setRegenerating(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Step 1: Delete existing plans for the date if any
            if (existingPlans.length > 0) {
                const deletedCount = await schedulingService.deletePlansByDate(selectedDate);
                console.log(`Deleted ${deletedCount} existing plans`);
            }

            // Step 2: Generate new schedule
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
            
            const scheduleResult = await schedulingService.generateDailySchedule(
                selectedDate,
                selectedAlgorithm,
                geneticParams
            );

            // Step 3: Save the new plan
            await schedulingService.saveOperationPlan({
                date: selectedDate,
                algorithm: selectedAlgorithm,
                geneticParams: selectedAlgorithm === 'genetic' ? geneticParams : undefined,
                totalDelay: scheduleResult.totalDelay,
                executionTimeMs: scheduleResult.executionTimeMs,
                scheduledTasks: scheduleResult.scheduledTasks
            });

            setSuccessMessage(
                `Successfully regenerated operation plan for ${selectedDate}. ` +
                `${scheduleResult.scheduledTasks.length} tasks scheduled with ` +
                `${(scheduleResult.totalDelay * 60).toFixed(0)} min total delay.`
            );

            // Refresh the missing plans list
            await handleCheckMissingPlans();
        } catch (err: any) {
            console.error('Failed to regenerate plans:', err);
            setError(err.message || 'Failed to regenerate plans. Please try again.');
        } finally {
            setRegenerating(false);
        }
    };

    const formatDateTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Missing Operation Plans</h1>
                <p className="text-gray-600 mt-1">
                    Identify Vessel Visit Notifications without operation plans and regenerate them
                </p>
            </div>

            {/* Date and Algorithm Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="checkDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Target Date
                        </label>
                        <input
                            id="checkDate"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                    </div>

                    <div className="flex-1">
                        <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduling Algorithm (for regeneration)
                        </label>
                        <select
                            id="algorithm"
                            value={selectedAlgorithm}
                            onChange={(e) => setSelectedAlgorithm(e.target.value as SchedulingAlgorithm)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg"
                        >
                            <option value="automatic">Automatic Selection (Smart)</option>
                            <option value="optimal">Optimal (Minimize Delays)</option>
                            <option value="heuristic">Heuristic (Fast Approximation)</option>
                            <option value="multicrane">Multi-Crane (Advanced)</option>
                            <option value="genetic">Genetic Algorithm (AI-Based)</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCheckMissingPlans}
                        disabled={loading || !selectedDate}
                        className="btn btn-primary text-lg px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-5 h-5" />
                                Check Missing Plans
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                    <XCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-green-800">Success</h3>
                        <p className="text-green-700 text-sm mt-1">{successMessage}</p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && (missingVVNs.length > 0 || existingPlans.length > 0) && (
                <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            title="Missing Plans"
                            value={missingVVNs.length}
                            description={missingVVNs.length === 0 ? "All VVNs have plans" : "VVNs without operation plans"}
                        />
                        <StatCard
                            title="Existing Plans"
                            value={existingPlans.length}
                            description="Operation plans already created"
                        />
                        <StatCard
                            title="Total VVNs"
                            value={missingVVNs.length + existingPlans.reduce((sum, plan) => sum + plan.scheduledTasksCount, 0)}
                            description="Vessel visits for this date"
                        />
                    </div>

                    {/* Missing VVNs Table */}
                    {missingVVNs.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                        Vessel Visits Missing Operation Plans
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {missingVVNs.length} vessel visit{missingVVNs.length > 1 ? 's' : ''} require{missingVVNs.length === 1 ? 's' : ''} planning
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowConfirmDialog(true)}
                                    disabled={regenerating}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    {regenerating ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Regenerate All Plans
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Business ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vessel IMO
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estimated Arrival
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estimated Departure
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assigned Dock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {missingVVNs.map((vvn) => (
                                            <tr key={vvn.id} className="hover:bg-yellow-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {vvn.businessId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {vvn.vesselImo}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {formatDateTime(vvn.estimatedArrival)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {formatDateTime(vvn.estimatedDeparture)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {vvn.assignedDockName || 'Not Assigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        {vvn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* No Missing Plans Message */}
                    {missingVVNs.length === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mb-6">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                            <h3 className="text-lg font-semibold text-green-800 mb-2">All VVNs Have Operation Plans</h3>
                            <p className="text-green-700">
                                All vessel visits for {new Date(selectedDate).toLocaleDateString('en-GB', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric' 
                                })} have operation plans assigned.
                            </p>
                        </div>
                    )}

                    {/* Existing Plans Summary */}
                    {existingPlans.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    Existing Operation Plans
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    {existingPlans.length} plan{existingPlans.length > 1 ? 's' : ''} already created for this date
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {existingPlans.map((plan) => (
                                        <div key={plan.planId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="font-semibold text-gray-800 mb-2">{plan.planId}</div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>Algorithm: <span className="font-medium">{plan.algorithm}</span></div>
                                                <div>Tasks: <span className="font-medium">{plan.scheduledTasksCount}</span></div>
                                                <div className="text-xs text-gray-500">
                                                    Created: {new Date(plan.createdAt).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Initial State */}
            {!loading && missingVVNs.length === 0 && existingPlans.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Check Missing Plans</h3>
                    <p className="text-gray-600">
                        Select a date and click "Check Missing Plans" to identify VVNs without operation plans.
                    </p>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                Confirm Plan Regeneration
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                This action will regenerate all operation plans for <strong>{new Date(selectedDate).toLocaleDateString('en-GB', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric' 
                                })}</strong>.
                            </p>
                            {existingPlans.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-yellow-800">Warning</p>
                                            <p className="text-yellow-700 text-sm mt-1">
                                                This will <strong>overwrite {existingPlans.length} existing plan{existingPlans.length > 1 ? 's' : ''}</strong> for this date. 
                                                All previous schedules will be permanently deleted.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <p className="text-gray-600 text-sm">
                                The system will use the <strong>{selectedAlgorithm}</strong> algorithm to create a new schedule for all pending vessel visits.
                            </p>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegeneratePlans}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Regenerate Plans
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissingPlans;

