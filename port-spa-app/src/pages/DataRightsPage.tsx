import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dataRightsController } from '../controllers/DataRightsController';
import type {
    DataRightsRequest,
    CreateDataRightsRequest,
    DataRequestType,
    DataRequestStatus
} from '../domain/dataRights';
import { DataRequestType as RequestType, DataRequestStatus as RequestStatus } from '../domain/dataRights';

const DataRightsPage: React.FC = () => {
    const { t } = (useTranslation as unknown as () => { t: (key: string, fallback?: string) => string })();
    const [requests, setRequests] = useState<DataRightsRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequestType, setSelectedRequestType] = useState<DataRequestType | ''>('');
    const [details, setDetails] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showNewRequestForm, setShowNewRequestForm] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await dataRightsController.getMyRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
            setMessage({ type: 'error', text: t('dataRights.errorLoadingRequests') });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedRequestType) {
            setMessage({ type: 'error', text: t('dataRights.selectRequestType') });
            return;
        }

        try {
            setLoading(true);
            const request: CreateDataRightsRequest = {
                requestType: selectedRequestType as DataRequestType,
                details: details || undefined
            };
            
            await dataRightsController.createRequest(request);
            setMessage({ 
                type: 'success', 
                text: t('dataRights.requestSubmittedSuccess')
            });
            
            setSelectedRequestType('');
            setDetails('');
            setShowNewRequestForm(false);
            
            await loadRequests();
        } catch (error: any) {
            console.error('Error submitting request:', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || t('dataRights.errorSubmittingRequest')
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadData = async () => {
        try {
            setLoading(true);
            setMessage({ type: 'success', text: t('dataRights.preparingDownload') });
            
            const blob = await dataRightsController.downloadMyData();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setMessage({ type: 'success', text: t('dataRights.downloadSuccess') });
        } catch (error: any) {
            console.error('Error downloading data:', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || t('dataRights.errorDownloadingData')
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: DataRequestStatus) => {
        switch (status) {
            case RequestStatus.Pending:
                return 'bg-yellow-100 text-yellow-800';
            case RequestStatus.Processed:
                return 'bg-green-100 text-green-800';
            case RequestStatus.Rejected:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRequestTypeLabel = (type: DataRequestType) => {
        switch (type) {
            case RequestType.Access:
                return t('dataRights.requestTypes.access');
            case RequestType.Rectification:
                return t('dataRights.requestTypes.rectification');
            case RequestType.Erasure:
                return t('dataRights.requestTypes.erasure');
            default:
                return type;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('dataRights.title')}
                </h1>
                <p className="text-gray-600">
                    {t('dataRights.description')}
                </p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    <div className="flex items-center">
                        <span className="mr-2">
                            {message.type === 'success' ? '✓' : '⚠'}
                        </span>
                        <p>{message.text}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={handleDownloadData}
                    disabled={loading}
                    className="p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-3xl mb-2">📥</div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                        {t('dataRights.downloadData')}
                    </h3>
                    <p className="text-sm text-blue-700">
                        {t('dataRights.downloadDataDescription')}
                    </p>
                </button>

                <button
                    onClick={() => {
                        setShowNewRequestForm(true);
                        setSelectedRequestType(RequestType.Rectification);
                    }}
                    disabled={loading}
                    className="p-6 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-3xl mb-2">✏️</div>
                    <h3 className="font-semibold text-orange-900 mb-1">
                        {t('dataRights.requestCorrection')}
                    </h3>
                    <p className="text-sm text-orange-700">
                        {t('dataRights.requestCorrectionDescription')}
                    </p>
                </button>

                <button
                    onClick={() => {
                        setShowNewRequestForm(true);
                        setSelectedRequestType(RequestType.Erasure);
                    }}
                    disabled={loading}
                    className="p-6 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-3xl mb-2">🗑️</div>
                    <h3 className="font-semibold text-red-900 mb-1">
                        {t('dataRights.requestDeletion')}
                    </h3>
                    <p className="text-sm text-red-700">
                        {t('dataRights.requestDeletionDescription')}
                    </p>
                </button>
            </div>

            {showNewRequestForm && (
                <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t('dataRights.newRequest')}
                        </h2>
                        <button
                            onClick={() => {
                                setShowNewRequestForm(false);
                                setSelectedRequestType('');
                                setDetails('');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('dataRights.requestType')}
                            </label>
                            <select
                                value={selectedRequestType}
                                onChange={(e) => setSelectedRequestType(e.target.value as DataRequestType)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">{t('dataRights.selectType')}</option>
                                <option value={RequestType.Access}>
                                    {t('dataRights.requestTypes.access')}
                                </option>
                                <option value={RequestType.Rectification}>
                                    {t('dataRights.requestTypes.rectification')}
                                </option>
                                <option value={RequestType.Erasure}>
                                    {t('dataRights.requestTypes.erasure')}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('dataRights.details')}
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t('dataRights.detailsPlaceholder')}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? t('dataRights.submitting') : t('dataRights.submitRequest')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNewRequestForm(false);
                                    setSelectedRequestType('');
                                    setDetails('');
                                }}
                                className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('dataRights.myRequests')}
                </h2>

                {loading && requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {t('common.loading')}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">📋</p>
                        <p>{t('dataRights.noRequests')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {getRequestTypeLabel(request.requestType)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {t('dataRights.requestedOn')}: {new Date(request.requestedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                        {t(`dataRights.status.${request.status.toLowerCase()}`)}
                                    </span>
                                </div>
                                
                                {request.details && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded">
                                        <p className="text-sm text-gray-700">
                                            <strong>{t('dataRights.details')}:</strong> {request.details}
                                        </p>
                                    </div>
                                )}
                                
                                {request.response && (
                                    <div className="mt-2 p-3 bg-blue-50 rounded">
                                        <p className="text-sm text-blue-900">
                                            <strong>{t('dataRights.response')}:</strong> {request.response}
                                        </p>
                                        {request.processedAt && (
                                            <p className="text-xs text-blue-700 mt-1">
                                                {t('dataRights.processedOn')}: {new Date(request.processedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                    ℹ️ {t('dataRights.gdprInfo.title')}
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t('dataRights.gdprInfo.right1')}</li>
                    <li>• {t('dataRights.gdprInfo.right2')}</li>
                    <li>• {t('dataRights.gdprInfo.right3')}</li>
                    <li>• {t('dataRights.gdprInfo.right4')}</li>
                </ul>
            </div>
        </div>
    );
};

export default DataRightsPage;
