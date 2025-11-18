// src/presentation/vvn/components/VvnDetailsModal.tsx
import React from 'react';
import type { VesselVisitNotification, DecisionLogEntry, Container, CrewMember } from '../../domain/vvn/vvn.model';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { Ship, Calendar, Anchor, Box, Weight, Users, List, Shield, Check, X } from 'lucide-react';

// --- Helper Components for this modal ---

// A simple key-value display
const DetailItem: React.FC<{ icon: React.ElementType<{ className?: string }>, label: string, value: string | null }> = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {label}
        </div>
        <div className="text-sm font-semibold text-gray-900 mt-1 truncate">
            {value || 'N/A'}
        </div>
    </div>
);

// A title for each section
const SectionTitle: React.FC<{ icon: React.ElementType<{ className?: string }>, title: string }> = ({ icon: Icon, title }) => (
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mt-4 border-t pt-4">
        <Icon className="w-5 h-5 text-maritime-600" />
        {title}
    </h3>
);

// --- Main Modal Component ---

interface VvnDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vvn: VesselVisitNotification | null;
}

const VvnDetailsModal: React.FC<VvnDetailsModalProps> = ({ isOpen, onClose, vvn }) => {
    if (!vvn) return null;

    // Helper to format dates
    const formatDateTime = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return 'Invalid Date'; }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vessel Visit Details">
            <div className="max-h-[70vh] overflow-y-auto space-y-6 p-1">

                {/* 1. Status Banner */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <span className="text-lg font-bold text-gray-800">
                        Vessel: {vvn.vesselImo}
                    </span>
                    <Badge status={vvn.status} />
                </div>

                {/* 2. Visit Details */}
                <SectionTitle icon={Ship} title="Visit Details" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={Ship} label="IMO Number" value={vvn.vesselImo} />
                    <DetailItem icon={Anchor} label="Assigned Dock" value={vvn.assignedDockId} />
                    <DetailItem icon={Calendar} label="Estimated Arrival" value={formatDateTime(vvn.estimatedArrival)} />
                    <DetailItem icon={Calendar} label="Estimated Departure" value={formatDateTime(vvn.estimatedDeparture)} />
                </div>

                {/* 3. Cargo Manifest */}
                <SectionTitle icon={Box} title="Cargo Manifest" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={Weight} label="Total Weight" value={`${vvn.cargo.weight} kg`} />
                    <DetailItem icon={List} label="Cargo Description" value={vvn.cargo.description} />
                </div>
                {vvn.cargo.containers.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Containers</h4>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {vvn.cargo.containers.map((c: Container, i: number) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3 text-sm">{c.containerCode}</td>
                                        <td className="px-4 py-3 text-sm">{c.position}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Crew List */}
                <SectionTitle icon={Users} title="Crew Members" />
                {vvn.crewMembers.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nationality</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {vvn.crewMembers.map((c: CrewMember, i: number) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-sm">{c.name}</td>
                                    <td className="px-4 py-3 text-sm">{c.nationality}</td>
                                    <td className="px-4 py-3 text-sm">{c.isSafetyOfficer ? 'Safety Officer' : 'Crew'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No crew members listed.</p>
                )}

                {/* 5. Decision Log */}
                <SectionTitle icon={Shield} title="Port Authority Log" />
                {vvn.status === 'InProgress' && (
                    <p className="text-sm text-gray-500">This notification has not been submitted yet.</p>
                )}
                {vvn.status === 'Submitted' && (
                    <p className="text-sm text-gray-500 italic">Waiting for Port Authority approval.</p>
                )}
                {(vvn.status === 'Approved' || vvn.status === 'Rejected') && vvn.decisionLog.length > 0 ? (
                    vvn.decisionLog.map((log: DecisionLogEntry) => (
                        <div key={log.id} className={`p-3 rounded-lg border ${
                            log.outcome === 'Approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center gap-2">
                                {log.outcome === 'Approved' ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                                <span className={`font-semibold ${
                                    log.outcome === 'Approved' ? 'text-green-700' : 'text-red-700'
                                }`}>{log.outcome}</span>
                                <span className="text-xs text-gray-500 ml-auto">{formatDateTime(log.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Officer:</span> {log.officerId}
                            </p>
                            {log.reason && (
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Reason:</span> {log.reason}
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    vvn.decisionLog.length === 0 && <p className="text-sm text-gray-500">No decisions have been logged.</p>
                )}
            </div>
        </Modal>
    );
};

export default VvnDetailsModal;
