import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {vvnApiRepository} from '../infrastructure/repositories/vvn/vvnApi.repository';
import type {CreateVveDto} from '../infrastructure/repositories/vve/vve.dto';
import type {VesselVisitNotification} from '../domain/vvn/vvn.model';
import {useAuth} from '../auth/AuthProvider';
import {useVveController} from '../controllers/vve/useVveController';
import { Ship, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const CreateVvePage: React.FC = () => {
    const navigate = useNavigate();
    const { internalRole } = useAuth();
    const { createVve, loading, error, successMessage, clearMessages } = useVveController();

    const [vvns, setVvns] = useState<VesselVisitNotification[]>([]);
    const [loadingVvns, setLoadingVvns] = useState(false);

    const [vvnId, setVvnId] = useState<string>('');
    const [vesselIdentifier, setVesselIdentifier] = useState<string>('');
    const [actualArrivalTime, setActualArrivalTime] = useState<string>(() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    });
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchVvns = async () => {
            try {
                setLoadingVvns(true);
                const data = await vvnApiRepository.getAll();
                const approvedVvns = data.filter(v => v.status === 'Approved');
                setVvns(approvedVvns);
            } catch (err: any) {
                console.error('Failed to fetch VVNs', err);
            } finally {
                setLoadingVvns(false);
            }
        };
        fetchVvns();
    }, []);

    useEffect(() => {
        const selected = vvns.find(v => v.businessId === vvnId);
        if (selected) {
            setVesselIdentifier(selected.vesselImo || '');
        }
    }, [vvnId, vvns]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();

        if (!vvnId || !vesselIdentifier || !actualArrivalTime) {
            return;
        }

        try {
            const iso = new Date(actualArrivalTime).toISOString();
            const dto: CreateVveDto = {
                vvnId,
                vesselIdentifier,
                actualArrivalTime: iso,
                notes: notes || undefined,
            };

            const created = await createVve(dto);
            
            if (created) {
                setTimeout(() => navigate('/vessel-visits'), 1500);
            }
        } catch (err: any) {
            console.error('Create VVE failed', err);
        }
    };

    const selectedVvn = vvns.find(v => v.businessId === vvnId);

    return (
        <div className="container mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create Vessel Visit Execution</h1>
                <p className="text-gray-600 mt-1">Record the actual arrival of a vessel at the port</p>
            </div>

            {/* Role Warning */}
            {internalRole !== 'LogisticsOperator' && internalRole !== 'Administrator' && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">
                            This page is intended for Logistics Operators
                        </p>
                    </div>
                </div>
            )}

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-red-900">Error</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-green-900">Success</h3>
                            <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* VVN Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Vessel Visit Notification <span className="text-red-500">*</span>
                        </label>
                        <select 
                            value={vvnId} 
                            onChange={(e) => setVvnId(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            disabled={loadingVvns}
                            required
                        >
                            <option value="">
                                {loadingVvns ? 'Loading approved vessel visits...' : '-- Select a vessel visit notification --'}
                            </option>
                            {vvns.map(v => (
                                <option key={v.businessId} value={v.businessId}>
                                    {v.businessId} | {v.vesselImo} | ETA: {new Date(v.estimatedArrival).toLocaleString('en-CA', { 
                                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                    })}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Only approved vessel visit notifications are available for execution recording
                        </p>
                    </div>

                    {/* VVN Details Display */}
                    {selectedVvn && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-sm font-semibold text-blue-900 mb-3">Selected VVN Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">VVN ID:</span>
                                    <span className="ml-2 font-medium text-gray-900">{selectedVvn.businessId}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Vessel:</span>
                                    <span className="ml-2 font-medium text-gray-900">{selectedVvn.vesselImo}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Estimated Arrival:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {new Date(selectedVvn.estimatedArrival).toLocaleString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Assigned Dock:</span>
                                    <span className="ml-2 font-medium text-gray-900">{selectedVvn.assignedDockName || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vessel Identifier */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Ship className="w-4 h-4 inline mr-1" />
                            Vessel Identifier (IMO) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text"
                            value={vesselIdentifier} 
                            onChange={(e) => setVesselIdentifier(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            placeholder="IMO1234567"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Auto-filled from selected VVN, can be modified if needed
                        </p>
                    </div>

                    {/* Actual Arrival Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Actual Arrival Time <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="datetime-local" 
                            value={actualArrivalTime} 
                            onChange={(e) => setActualArrivalTime(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Record the precise time when the vessel actually arrived at the port
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg resize-none"
                            rows={4}
                            placeholder="Add any relevant observations, delays, or special circumstances..."
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Document any deviations from the planned schedule or special conditions
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => navigate('/vessel-visits')} 
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={loading || loadingVvns || !vvnId}
                        >
                            {loading ? 'Creating...' : 'Create VVE'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Info Panel */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ What is a VVE?</h3>
                <p className="text-sm text-blue-800">
                    A <strong>Vessel Visit Execution (VVE)</strong> records the actual arrival and operations of a vessel, 
                    tracking what really happens versus what was planned in the VVN. Once created, the VVE will be marked 
                    as &quot;In Progress&quot; and can be updated as operations proceed.
                </p>
            </div>
        </div>
    );
};

export default CreateVvePage;

