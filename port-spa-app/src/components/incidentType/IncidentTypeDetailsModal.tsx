// File: port-spa-app/src/components/incidentType/IncidentTypeDetailsModal.tsx

import React, { useEffect, useRef } from 'react';
import type { IncidentType } from '../../domain/incidentType/incidentType.model';
import { X, Tag, Layers, FileText, User, Calendar, Info } from 'lucide-react';

interface IncidentTypeDetailsModalProps {
    incidentType: IncidentType | null;
    isOpen: boolean;
    onClose: () => void;
}

/* ---------------- Helpers ---------------- */

const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const getSeverityColor = (severity?: string): string => {
    switch (severity) {
        case 'Critical':
            return 'bg-red-100 text-red-800';
        case 'Major':
            return 'bg-amber-100 text-amber-800';
        default:
            return 'bg-emerald-100 text-emerald-800';
    }
};

/* ---------------- Detail Item Component ---------------- */

const DetailItem: React.FC<{
    icon: React.ElementType<{ size?: number }>;
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
}> = ({ icon: Icon, label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-lg bg-gray-50">
                <Icon size={20} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="mt-1 text-base text-gray-900 break-words">{value || '—'}</p>
            </div>
        </div>
    </div>
);

/* ---------------- Main Modal Component ---------------- */

const IncidentTypeDetailsModal: React.FC<IncidentTypeDetailsModalProps> = ({
                                                                               incidentType,
                                                                               isOpen,
                                                                               onClose,
                                                                           }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Handle Escape key and initial focus
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        closeButtonRef.current?.focus();

        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent rendering if closed or no data
    if (!isOpen || !incidentType) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-type-details-title"
        >
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3
                            id="incident-type-details-title"
                            className="text-2xl font-bold text-gray-900"
                        >
                            {incidentType.code} — {incidentType.name}
                        </h3>
                        {incidentType.parentName && (
                            <p className="mt-2 text-sm text-gray-600">
                                Parent: <span className="font-medium">{incidentType.parentName}</span>
                            </p>
                        )}
                    </div>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Severity */}
                    <DetailItem
                        icon={Tag}
                        label="Severity"
                        value={
                            <span
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getSeverityColor(
                                    incidentType.severity
                                )}`}
                            >
                                <Tag size={16} />
                                {incidentType.severity}
                            </span>
                        }
                    />

                    {/* Parent */}
                    <DetailItem
                        icon={Layers}
                        label="Parent Type"
                        value={incidentType.parentName || incidentType.parentId || '—'}
                    />

                    {/* Description - Full Width */}
                    <DetailItem
                        icon={FileText}
                        label="Description"
                        value={incidentType.description || '—'}
                        fullWidth
                    />

                    {/* Created By */}
                    <DetailItem
                        icon={User}
                        label="Created By"
                        value={incidentType.createdBy || '—'}
                    />

                    {/* Created At */}
                    <DetailItem
                        icon={Calendar}
                        label="Created At"
                        value={formatDateTime(incidentType.createdAt)}
                    />

                    {/* Updated At */}
                    <DetailItem
                        icon={Info}
                        label="Last Updated"
                        value={formatDateTime(incidentType.updatedAt)}
                    />
                </div>
            </div>
        </div>
    );
};

export default IncidentTypeDetailsModal;