import React, { useState, useEffect } from 'react';
import { getAllDocks } from '../services/apiService';
import type { Dock } from '../domain/types';
// --- 1. Import our new components ---
import Modal from '../components/common/Modal';
import CreateDockForm from './CreateDockForm';
import { t } from '../i18nClient';

// A simple icon component for the actions menu
const DotsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const DocksPage: React.FC = () => {
    const [docks, setDocks] = useState<Dock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- 2. Add state to control the modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const data = await getAllDocks();
            setDocks(data);
        } catch (err) {
            setError(t('errors.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    // --- 3. Handle successful creation ---
    const handleSuccess = (newDock: Dock) => {
        // Add the new type to our list to refresh the UI
        setDocks(prev => [newDock, ...prev]);
    };

    // Tailwind classes for styling inspired by your mock-up
    return (
        <div className="container mt-6">
            <div className="panel">

                {/* 1. Page Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">{t('nav.docks')}</h1>
                    {/* --- 4. Wire up the button --- */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary"
                    >
                        + {t('button.createDock')}
                    </button>
                </div>

                {/* 2. Search & Filter Bar */}
                <div className="flex mb-4">
                    <input
                        type="text"
                        placeholder={t('search.placeholder')}
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                    />
                </div>

                {/* 3. Data Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-maritime-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('table.name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('dock.location')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('dock.length')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('dock.depth')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('dock.maxDraft')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('dock.stsCranes')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">{t('dock.allowedTypes')}</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading && (
                            <tr>
                                <td colSpan={8} className="text-center py-4">{t('common.loading')}</td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-red-600">{error}</td>
                            </tr>
                        )}
                        {!loading && !error && docks.map(dock => (
                            <tr key={dock.id} className="hover:bg-maritime-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dock.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{`${dock.locationZone} / ${dock.locationSection}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dock.lengthInMeters}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dock.depthInMeters}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dock.maxDraftInMeters}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dock.numberOfSTSCranes}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {(dock.allowedVesselTypeIds ?? []).join(', ') || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-gray-600" aria-label={t('table.actions')} title={t('table.actions')}>
                                        <DotsIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* --- 5. Render the Modal --- */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('dock.createModal')}>
                     <CreateDockForm onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
                 </Modal>
            </div>
        </div>
    );
};

export default DocksPage;
