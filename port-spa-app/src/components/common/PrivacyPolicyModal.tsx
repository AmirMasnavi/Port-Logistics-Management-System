import { useState } from 'react';
import { privacyPolicyService, type PrivacyPolicyDto } from '../../services/privacyPolicyService';
import ReactMarkdown from 'react-markdown';
import { t } from '../../i18nClient';

interface PrivacyPolicyModalProps {
    policy: PrivacyPolicyDto;
    onAccept: () => void;
    onDecline?: () => void;
}

const PrivacyPolicyModal = ({ policy, onAccept, onDecline }: PrivacyPolicyModalProps) => {
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
        if (isAtBottom && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAccept = async () => {
        try {
            setAccepting(true);
            setError(null);

            await privacyPolicyService.acknowledgePolicy({
                policyId: policy.id,
                policyVersion: policy.version
            });

            onAccept();
        } catch (err: any) {
            console.error('Error acknowledging policy:', err);
            setError(err.response?.data?.message || 'Failed to acknowledge privacy policy');
            setAccepting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 overflow-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
            <div 
                className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border-2 border-blue-200 overflow-hidden"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                {/* Header com Gradiente */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white px-8 py-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-lg">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-1">
                                {t('privacyPolicy.modal.title') || 'Privacy Policy Update'}
                            </h2>
                            <p className="text-blue-100 text-sm">
                                {t('privacyPolicy.modal.subtitle') || 'Please review and accept our privacy policy to continue'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notice com Design Atrativo */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 px-6 py-4 shadow-inner">
                    <div className="flex items-start gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-amber-900 font-bold mb-1">
                                {t('privacyPolicy.modal.notice') || 'Action Required'}
                            </p>
                            <p className="text-sm text-amber-800">
                                {t('privacyPolicy.modal.noticeText') || 'Our Privacy Policy has been updated. You must review and accept it to continue using the system.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policy Content */}
                <div 
                    className="flex-1 overflow-y-auto px-6 py-5 bg-white"
                    onScroll={handleScroll}
                >
                    <div className="mb-5 flex flex-wrap gap-3">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-semibold text-sm">Version {policy.version}</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold text-sm">Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-3 text-gray-800" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-gray-800" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-2 mb-2 text-gray-700" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-3 text-gray-700 text-sm" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 ml-2 text-gray-700 text-sm" {...props} />,
                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                            }}
                        >
                            {policy.content}
                        </ReactMarkdown>
                    </div>

                    {/* Scroll indicator - Mais Atrativo */}
                    {!hasScrolledToBottom && (
                        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full shadow-lg animate-bounce">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                <span className="text-sm font-semibold">Please scroll to read the complete policy</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message - Design Melhorado */}
                {error && (
                    <div className="mx-6 mb-4">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Footer with Buttons - Design Moderno */}
                <div className="border-t-2 border-blue-100 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-5">
                    <div className="mb-4">
                        <label className="flex items-start cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={hasScrolledToBottom}
                                    onChange={(e) => setHasScrolledToBottom(e.target.checked)}
                                    className="h-6 w-6 text-blue-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                            <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                                {t('privacyPolicy.modal.confirmation') || 'I have read and understood the Privacy Policy and agree to the processing of my personal data as described.'}
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end">
                        {onDecline && (
                            <button
                                onClick={onDecline}
                                disabled={accepting}
                                className="group px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {t('privacyPolicy.modal.decline') || 'Decline & Logout'}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={handleAccept}
                            disabled={!hasScrolledToBottom || accepting}
                            className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            {accepting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    {t('privacyPolicy.modal.accepting') || 'Accepting...'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t('privacyPolicy.modal.accept') || 'Accept & Continue'}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-3">
                        <p className="text-xs text-green-800 text-center flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {t('privacyPolicy.modal.gdprNotice') || 'By accepting, you acknowledge your rights under GDPR including access, rectification, and erasure of your data.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
