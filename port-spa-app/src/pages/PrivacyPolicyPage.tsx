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

                
                
                {/* GDPR Rights for Non-System Users - US 4.5.4 */}
                <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-white rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200 mb-8">
                    <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">How to Exercise Your Data Rights</h2>
                                <p className="text-blue-100 text-sm mt-1">For individuals without system accounts</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <div className="prose prose-lg max-w-none">
                            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                                If you are <strong className="text-purple-700">not a registered user</strong> of the Port Management System but believe 
                                your personal data is being processed by our organization (e.g., as a vessel crew member, contractor, 
                                visitor, or service provider), you have the right to exercise your GDPR rights.
                            </p>

                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 rounded-lg mb-8 shadow-md">
                                <div className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <p className="font-bold text-amber-900 mb-1">⚠️ Important Notice</p>
                                        <p className="text-amber-800 text-sm">
                                            If you already have a system account, please <strong>log in</strong> and use the built-in 
                                            <a href="/data-rights" className="text-blue-600 hover:text-blue-800 underline font-semibold ml-1">Data Rights Request Portal</a> instead.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-6 flex items-center gap-3">
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">1</span>
                                Your GDPR Rights
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4 mb-8">
                                <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Right to Access</h4>
                                            <p className="text-sm text-gray-600">Request a copy of your personal data we hold</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-green-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Right to Rectification</h4>
                                            <p className="text-sm text-gray-600">Request correction of inaccurate data</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-red-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Right to Erasure</h4>
                                            <p className="text-sm text-gray-600">Request deletion of your personal data</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-purple-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Right to Data Portability</h4>
                                            <p className="text-sm text-gray-600">Receive your data in a machine-readable format</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-orange-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-orange-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Right to Object</h4>
                                            <p className="text-sm text-gray-600">Object to certain types of data processing</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-indigo-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Right to Restrict Processing</h4>
                                            <p className="text-sm text-gray-600">Request limitation of data processing activities</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-6 flex items-center gap-3">
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">2</span>
                                How to Submit a Request
                            </h3>

                            <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-2xl p-8 shadow-lg mb-6">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Option 1: Email Request (Recommended)
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                                        <p className="text-gray-700">
                                            Send an email to: <strong className="text-blue-700 bg-blue-100 px-2 py-1 rounded font-mono">dpo@blueport.com</strong>
                                            <span className="block text-sm text-gray-600 mt-1">(Data Protection Officer - DPO)</span>
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                                        <p className="text-gray-700">
                                            Subject line: <strong className="text-blue-700">"GDPR Data Rights Request - [Your Right]"</strong>
                                            <span className="block text-sm text-gray-600 mt-1">Example: "GDPR Data Rights Request - Right to Access"</span>
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                                        <div className="flex-1">
                                            <p className="text-gray-700 mb-2">Include in your email:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                                                <li>Your full name</li>
                                                <li>Contact information (email address, phone number)</li>
                                                <li>Details about your interaction with our port (e.g., vessel name, visit date, role)</li>
                                                <li>The specific right you wish to exercise</li>
                                                <li>Any additional context that helps us locate your data</li>
                                                <li><strong>Proof of identity</strong> (scanned ID or passport - for verification purposes)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-300 rounded-2xl p-8 shadow-lg mb-6">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                    </svg>
                                    Option 2: Postal Mail
                                </h4>
                                <div className="space-y-3">
                                    <p className="text-gray-700">Send a written request to:</p>
                                    <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                                        <p className="font-mono text-sm text-gray-800 leading-relaxed">
                                            <strong>Data Protection Officer</strong><br/>
                                            BluePort - Port Management System<br/>
                                            Rua Dr. António Bernardino de Almeida, 431<br/>
                                            4200-072 Porto, Portugal
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">
                                        ⚠️ Postal requests may take longer to process. Include all information mentioned in Option 1.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-2xl p-8 shadow-lg mb-6">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Option 3: In-Person Visit
                                </h4>
                                <div className="space-y-3">
                                    <p className="text-gray-700">Visit our Port Authority Office during business hours:</p>
                                    <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-800">
                                            <strong>📍 Location:</strong> Port Authority Building, Reception Desk<br/>
                                            <strong>🕐 Hours:</strong> Monday to Friday, 9:00 AM - 5:00 PM<br/>
                                            <strong>📋 Bring:</strong> Valid government-issued ID for verification
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-6 flex items-center gap-3">
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">3</span>
                                What Happens Next?
                            </h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-4 bg-white border-l-4 border-blue-500 p-5 rounded-lg shadow-md">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Acknowledgment</p>
                                        <p className="text-sm text-gray-600">We will acknowledge receipt of your request within <strong>5 business days</strong></p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 bg-white border-l-4 border-green-500 p-5 rounded-lg shadow-md">
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Identity Verification</p>
                                        <p className="text-sm text-gray-600">We may request additional information to verify your identity (required by GDPR for data protection)</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 bg-white border-l-4 border-purple-500 p-5 rounded-lg shadow-md">
                                    <div className="bg-purple-100 p-2 rounded-full">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Processing Time</p>
                                        <p className="text-sm text-gray-600">We will respond to your request within <strong>1 month (30 days)</strong> as required by GDPR. In complex cases, this may be extended to 3 months with notification.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 bg-white border-l-4 border-orange-500 p-5 rounded-lg shadow-md">
                                    <div className="bg-orange-100 p-2 rounded-full">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Free of Charge</p>
                                        <p className="text-sm text-gray-600">All requests are processed <strong>free of charge</strong> unless the request is manifestly unfounded or excessive</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
                                <h4 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Right to Lodge a Complaint
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    If you are unsatisfied with how we handle your data rights request, you have the right to lodge 
                                    a complaint with the Portuguese Data Protection Authority (CNPD - Comissão Nacional de Proteção de Dados):
                                </p>
                                <div className="mt-3 bg-white border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-800">
                                        <strong>🏛️ CNPD</strong><br/>
                                        Website: <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">www.cnpd.pt</a><br/>
                                        Phone: +351 21 392 84 00<br/>
                                        Address: Av. D. Carlos I, 134, 1º, 1200-651 Lisboa, Portugal
                                    </p>
                                </div>
                            </div>
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
