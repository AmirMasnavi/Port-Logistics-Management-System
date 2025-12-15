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
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                    <h2 className="text-2xl font-bold">
                        {t('privacyPolicy.modal.title') || 'Privacy Policy Update'}
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        {t('privacyPolicy.modal.subtitle') || 'Please review and accept our privacy policy to continue'}
                    </p>
                </div>

                {/* Notice */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 px-6 py-3">
                    <div className="flex items-start">
                        <span className="text-yellow-600 text-xl mr-2">⚠️</span>
                        <div>
                            <p className="text-sm text-yellow-800 font-semibold">
                                {t('privacyPolicy.modal.notice') || 'Action Required'}
                            </p>
                            <p className="text-sm text-yellow-700">
                                {t('privacyPolicy.modal.noticeText') || 'Our Privacy Policy has been updated. You must review and accept it to continue using the system.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policy Content */}
                <div 
                    className="flex-1 overflow-y-auto px-6 py-4"
                    onScroll={handleScroll}
                >
                    <div className="mb-4 text-sm text-gray-600">
                        <div className="flex justify-between items-center">
                            <span>
                                <strong>Version:</strong> {policy.version}
                            </span>
                            <span>
                                <strong>Effective:</strong> {new Date(policy.effectiveDate).toLocaleDateString()}
                            </span>
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

                    {/* Scroll indicator */}
                    {!hasScrolledToBottom && (
                        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-2 text-center">
                            <div className="inline-flex items-center text-sm text-gray-500 animate-bounce">
                                <span>⬇️ Please scroll to read the complete policy</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Footer with Buttons */}
                <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
                    <div className="mb-3">
                        <label className="flex items-start cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasScrolledToBottom}
                                onChange={(e) => setHasScrolledToBottom(e.target.checked)}
                                className="mt-1 mr-3 h-5 w-5 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                                {t('privacyPolicy.modal.confirmation') || 'I have read and understood the Privacy Policy and agree to the processing of my personal data as described.'}
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end">
                        {onDecline && (
                            <button
                                onClick={onDecline}
                                disabled={accepting}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {t('privacyPolicy.modal.decline') || 'Decline & Logout'}
                            </button>
                        )}
                        <button
                            onClick={handleAccept}
                            disabled={!hasScrolledToBottom || accepting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {accepting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {t('privacyPolicy.modal.accepting') || 'Accepting...'}
                                </>
                            ) : (
                                <>
                                    ✓ {t('privacyPolicy.modal.accept') || 'Accept & Continue'}
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        {t('privacyPolicy.modal.gdprNotice') || 'By accepting, you acknowledge your rights under GDPR including access, rectification, and erasure of your data.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
