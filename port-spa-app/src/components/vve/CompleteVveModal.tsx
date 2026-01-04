// Complete VVE Modal Component (US 4.1.11)
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { VveWithMetrics } from '../../services/vveService';

interface CompleteVveModalProps {
    vve: VveWithMetrics | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { actualUnberthTime: string; actualPortDepartureTime: string }) => Promise<void>;
    unfinishedOperations?: Array<{ operationId: string; name: string; status: string }>;
}

const CompleteVveModal: React.FC<CompleteVveModalProps> = ({
    vve,
    isOpen,
    onClose,
    onConfirm,
    unfinishedOperations = []
}) => {
    const [actualUnberthTime, setActualUnberthTime] = useState<string>('');
    const [actualPortDepartureTime, setActualPortDepartureTime] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && vve) {
            // Initialize with current time
            const now = new Date();
            const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            setActualUnberthTime(localNow);
            
            // Port departure 30 minutes after unberth by default
            const departure = new Date(now.getTime() + 30 * 60000);
            const localDeparture = new Date(departure.getTime() - departure.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            setActualPortDepartureTime(localDeparture);
            setError(null);
        }
    }, [isOpen, vve]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!actualUnberthTime || !actualPortDepartureTime) {
            setError('Both unberth time and port departure time are required');
            return;
        }

        const unberthDate = new Date(actualUnberthTime);
        const departureDate = new Date(actualPortDepartureTime);

        if (departureDate <= unberthDate) {
            setError('Port departure time must be after unberth time');
            return;
        }

        if (vve) {
            const arrivalDate = new Date(vve.actualArrivalTime);
            if (unberthDate < arrivalDate) {
                setError('Unberth time cannot be before arrival time');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            await onConfirm({
                actualUnberthTime: new Date(actualUnberthTime).toISOString(),
                actualPortDepartureTime: new Date(actualPortDepartureTime).toISOString(),
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to complete VVE');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !vve) return null;

    const hasUnfinishedOperations = unfinishedOperations.length > 0;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Mark VVE as Completed
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* VVE Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            <strong>VVE ID:</strong> {vve.vveId}
                        </p>
                        <p className="text-sm text-gray-700">
                            <strong>Vessel:</strong> {vve.vesselIdentifier}
                        </p>
                        <p className="text-sm text-gray-700">
                            <strong>Arrival:</strong>{' '}
                            {new Date(vve.actualArrivalTime).toLocaleString()}
                        </p>
                    </div>

                    {/* Warning about no operations */}
                    {!hasUnfinishedOperations && (!vve.executedOperations || vve.executedOperations.length === 0) && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-800 mb-2">
                                        No Cargo Operations Recorded
                                    </h3>
                                    <p className="text-sm text-yellow-700">
                                        This VVE has no cargo operations recorded. While technically allowed, 
                                        it's recommended to record at least the main operations before completing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning about unfinished operations */}
                    {hasUnfinishedOperations && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-800 mb-2">
                                        Unfinished Operations Detected
                                    </h3>
                                    <p className="text-sm text-yellow-700 mb-2">
                                        The following operations are not yet completed:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                                        {unfinishedOperations.map((op) => (
                                            <li key={op.operationId}>
                                                {op.name || op.operationId} - <strong>{op.status}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-sm text-yellow-700 mt-2 font-semibold">
                                        All operations must be COMPLETED before you can mark this VVE as completed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="unberthTime"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Actual Unberth Time <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="unberthTime"
                                value={actualUnberthTime}
                                onChange={(e) => setActualUnberthTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={hasUnfinishedOperations}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                <strong>Required:</strong> When the vessel left the berth/dock
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="departurTime"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Actual Port Departure Time <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="departurTime"
                                value={actualPortDepartureTime}
                                onChange={(e) => setActualPortDepartureTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={hasUnfinishedOperations}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                <strong>Required:</strong> When the vessel exited the port
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Info Message */}
                    {!hasUnfinishedOperations && (
                        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-green-700">
                                    <p className="font-semibold mb-1">⚠️ Important - Read Before Proceeding</p>
                                    <p className="mb-2">
                                        Once completed, this VVE will become <strong>read-only</strong>. 
                                        Only administrators will be able to make corrections.
                                    </p>
                                    <p className="text-xs">
                                        This action will be logged with your user ID and timestamp for audit purposes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={isSubmitting || hasUnfinishedOperations}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Mark as Completed
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteVveModal;

