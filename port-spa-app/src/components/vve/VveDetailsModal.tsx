// VVE Details Modal Component
import React, { useEffect, useRef } from 'react';
import type { VesselVisitExecution } from '../../domain/vve/vve.model';
import { X, Ship, Calendar, Clock, User, FileText, Info } from 'lucide-react';

interface VveDetailsModalProps {
    vve: VesselVisitExecution | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Invalid Date';
        return new Date(dateString).toLocaleString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const VveDetailsModal: React.FC<VveDetailsModalProps> = ({ vve, isOpen, onClose }) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKeyDown);
        // autofocus close button for accessibility
        closeButtonRef.current?.focus();

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !vve) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const onOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={onOverlayClick}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            aria-hidden={false}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="vve-details-title"
                aria-describedby="vve-details-desc"
                tabIndex={-1}
                className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 id="vve-details-title" className="text-2xl font-bold text-gray-800">VVE Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div id="vve-details-desc" className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(vve.status)}`}>
                            {vve.status}
                        </span>
                    </div>

                    {/* VVE Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem
                            icon={FileText}
                            label="VVE ID"
                            value={vve.vveId}
                        />
                        <DetailItem
                            icon={FileText}
                            label="VVN Reference"
                            value={vve.vvnId}
                        />
                        <DetailItem
                            icon={Ship}
                            label="Vessel Identifier"
                            value={vve.vesselIdentifier}
                        />
                        <DetailItem
                            icon={User}
                            label="Created By"
                            value={vve.createdBy}
                        />
                    </div>

                    {/* Timing Information */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Timing Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem
                                icon={Calendar}
                                label="Actual Arrival Time"
                                value={formatDateTime(vve.actualArrivalTime)}
                            />
                            <DetailItem
                                icon={Calendar}
                                label="Actual Departure Time"
                                value={formatDateTime(vve.actualDepartureTime)}
                            />
                            <DetailItem
                                icon={Clock}
                                label="Created At"
                                value={formatDateTime(vve.createdAt)}
                            />
                            <DetailItem
                                icon={Clock}
                                label="Last Updated"
                                value={formatDateTime(vve.updatedAt)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    {vve.notes && (
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Notes
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{vve.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper component for detail items
const DetailItem: React.FC<{
    icon: React.ElementType<{ className?: string }>;
    label: string;
    value: string;
}> = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
            <Icon className="w-4 h-4" />
            {label}
        </div>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
);

export default VveDetailsModal;

