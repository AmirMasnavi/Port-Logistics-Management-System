import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { activateUserAccount } from '../services/apiService';
import { useAuth } from '../auth/AuthProvider'; // 👈 Import Auth Context
import LoginModal from '../components/auth/LoginModal'; // 👈 Import Login Modal
import { auth } from '../firebaseConfig'; // 👈 Import auth to force token refresh

const ActivationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading, refreshRole } = useAuth(); // 👈 ADDED: refreshRole
    const navigate = useNavigate();

    const [message, setMessage] = useState('Verifying session...');
    const [isError, setIsError] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const effectHasRun = useRef(false);
    const token = searchParams.get('token');

    useEffect(() => {
        // 1. Wait for Firebase to finish checking if user is logged in
        if (isLoading) return;

        // 2. If not logged in, prompt user to login
        if (!isAuthenticated) {
            setMessage('Please log in to verify your identity and complete activation.');
            setIsLoginModalOpen(true);
            return;
        }

        // 3. If logged in, AND we haven't tried activating yet, do it.
        if (isAuthenticated && token && !effectHasRun.current && !isActivating) {
            effectHasRun.current = true;
            setIsActivating(true);
            setMessage('Activating your account...');

            const activate = async () => {
                try {
                    // ✅ Wait for Firebase to fully process the auth state
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // ✅ Force refresh the Firebase token
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await currentUser.getIdToken(true);
                        console.log('🔄 Firebase token refreshed before activation');
                    }
                    
                    const result = await activateUserAccount(token);
                    setMessage(result.message);
                    setIsError(false);
                    setIsActivating(false);
                    
                    // 👈 NEW: Refresh the role after successful activation!
                    console.log('✅ Activation successful, refreshing role...');
                    await refreshRole();
                    console.log('✅ Role refreshed, redirecting to dashboard...');
                    
                    // Redirect to dashboard after role is refreshed
                    setTimeout(() => navigate('/'), 1000);
                } catch (err: any) {
                    const errorMessage = err.response?.data?.message || 'Failed to activate account.';
                    console.error('❌ Activation error:', errorMessage);
                    setMessage(errorMessage);
                    setIsError(true);
                    setIsActivating(false);
                }
            };
            activate();
        } else if (!token) {
            setMessage('No activation token found. Please check your link.');
            setIsError(true);
        }

    }, [isAuthenticated, isLoading, token, navigate, isActivating, refreshRole]); // 👈 ADDED: refreshRole dependency

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md max-w-lg w-full text-center">
                <h1 className={`text-2xl font-bold mb-4 ${isError ? 'text-red-600' : 'text-maritime-700'}`}>
                    {isError ? 'Activation Issue' : 'Account Activation'}
                </h1>

                <p className="text-lg text-gray-600 mb-6">{message}</p>

                {/* Show manual login button if they closed the modal but aren't logged in */}
                {!isAuthenticated && !isLoading && (
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="btn btn-primary w-full"
                    >
                        Log In to Activate
                    </button>
                )}

                {/* Allow going home if successful or error */}
                {(isAuthenticated || isError) && !isActivating && (
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-secondary mt-4"
                    >
                        Go to Dashboard
                    </button>
                )}

                {/* The Login Modal */}
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default ActivationPage;