import { useEffect, useState } from 'react';
import { privacyPolicyService, type PrivacyPolicyDto } from '../services/privacyPolicyService';
import ReactMarkdown from 'react-markdown';
import { t } from '../i18nClient';

const PrivacyPolicyPage = () => {
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
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading Privacy Policy...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-t-2xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-bold text-lg">Error Loading Privacy Policy</p>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-b-2xl shadow-lg border-2 border-red-200">
                        <p className="text-gray-700">{error}</p>
                        <button 
                            onClick={loadPolicy}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!policy) {
        return (
            <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-t-2xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-bold text-lg">{t('privacyPolicy.notAvailable') || 'Privacy Policy Not Available'}</p>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-4 rounded-b-2xl shadow-lg border-2 border-yellow-200">
                        <p className="text-gray-700">No privacy policy is currently available.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Hero Header */}
                <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 shadow-2xl">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative px-8 py-10">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-white mb-1">
                                            {policy.title.replace(/v\d+\.\d+/i, `v${policy.version}`)}
                                        </h1>
                                        <p className="text-blue-100 text-sm">Official Document - Legally Binding</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 mt-6">
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="text-white text-sm font-semibold">Version {policy.version}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-white text-sm">
                                                <span className="font-semibold">Effective:</span> {new Date(policy.effectiveDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-white text-sm">
                                                <span className="font-semibold">Updated:</span> {new Date(policy.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-100 mb-8">
                    <div className="p-8 md:p-12">
                        {/* Content with Markdown rendering */}
                        <div className="prose prose-lg max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => (
                                        <h1 className="text-3xl font-bold mt-8 mb-5 text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3" {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800 flex items-center gap-2 border-l-4 border-blue-500 pl-4" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                        <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-700 flex items-center gap-2" {...props} />
                                    ),
                                    p: ({ node, ...props }) => <p className="mb-4 text-gray-700 leading-relaxed text-base" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="space-y-2 mb-6 ml-6 text-gray-700" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="space-y-2 mb-6 ml-6 text-gray-700" {...props} />,
                                    li: ({ node, ...props }) => (
                                        <li className="flex items-start gap-3 group" {...props}>
                                            <span className="inline-block w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 group-hover:scale-125 transition-transform"></span>
                                            <span className="flex-1">{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 bg-yellow-100 px-1 rounded" {...props} />,
                                    a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline font-medium" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-gradient-to-b from-blue-500 to-purple-500 bg-blue-50 pl-6 pr-4 py-4 italic my-6 text-gray-700 rounded-r-lg shadow-md" {...props} />
                                    ),
                                }}
                            >
                                {policy.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Document Information Card */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-blue-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2.5 rounded-xl">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Document Information</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                <span className="text-gray-600 font-medium">Version:</span>
                                <span className="text-gray-900 font-semibold">{policy.version}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                <span className="text-gray-600 font-medium">Created by:</span>
                                <span className="text-gray-900 font-semibold">{policy.createdBy}</span>
                            </div>
                            {policy.changeReason && (
                                <div className="pt-2">
                                    <span className="text-gray-600 font-medium">Change Reason:</span>
                                    <p className="text-gray-900 mt-1 bg-amber-50 p-2 rounded-lg text-xs">{policy.changeReason}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GDPR Notice Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2.5 rounded-xl">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">GDPR Compliance</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            <strong className="text-green-700">🛡️ Fully Compliant:</strong> This Privacy Policy is compliant with the General Data 
                            Protection Regulation (EU Regulation 2016/679). If you have questions about your data rights, 
                            please contact our Data Protection Officer.
                        </p>
                        <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-200">
                            <p className="text-xs text-gray-600">
                                <strong>Your Rights:</strong> Access, Rectification, Erasure, Data Portability, Objection
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={() => window.print()}
                        className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Policy
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
