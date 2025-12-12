import { useEffect, useState } from 'react';
import { privacyPolicyService, PrivacyPolicyDto } from '../services/privacyPolicyService';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage = () => {
    const { t } = useTranslation();
    const [policy, setPolicy] = useState<PrivacyPolicyDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPolicy();
    }, []);

    const loadPolicy = async () => {
        try {
            setLoading(true);
            console.log('🔍 [PrivacyPolicy] Loading policy from API...');
            const currentPolicy = await privacyPolicyService.getCurrentPolicy();
            console.log('✅ [PrivacyPolicy] Policy received:', currentPolicy);
            setPolicy(currentPolicy);
        } catch (err: any) {
            console.error('❌ [PrivacyPolicy] Error loading privacy policy:', err);
            console.error('❌ [PrivacyPolicy] Error details:', {
                message: err.message,
                response: err.response,
                status: err.response?.status
            });
            setError(err.message || 'Failed to load privacy policy');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!policy) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p>{t('privacyPolicy.notAvailable', 'Privacy Policy is not available at this time.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white shadow-lg rounded-lg p-8">
                {/* Header */}
                <div className="border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {policy.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                            <span className="font-semibold">Version:</span> {policy.version}
                        </div>
                        <div>
                            <span className="font-semibold">Effective Date:</span>{' '}
                            {new Date(policy.effectiveDate).toLocaleDateString()}
                        </div>
                        <div>
                            <span className="font-semibold">Last Updated:</span>{' '}
                            {new Date(policy.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Content with Markdown rendering */}
                <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-800" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-800" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 ml-4 text-gray-700" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 ml-4 text-gray-700" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                            a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                            blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600" {...props} />
                            ),
                        }}
                    >
                        {policy.content}
                    </ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t text-sm text-gray-600">
                    <p className="mb-2">
                        <strong>Document Information:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Policy ID: {policy.id}</li>
                        <li>Version: {policy.version}</li>
                        <li>Created by: {policy.createdBy}</li>
                        {policy.changeReason && <li>Change Reason: {policy.changeReason}</li>}
                    </ul>
                </div>

                {/* GDPR Notice */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-800">
                        <strong>🛡️ GDPR Compliance:</strong> This Privacy Policy is compliant with the General Data 
                        Protection Regulation (EU Regulation 2016/679). If you have questions about your data rights, 
                        please contact our Data Protection Officer.
                    </p>
                </div>

                {/* Print Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => window.print()}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        🖨️ Print Policy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
