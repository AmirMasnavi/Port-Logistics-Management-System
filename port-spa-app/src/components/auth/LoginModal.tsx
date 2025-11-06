// src/components/auth/LoginModal.tsx
import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import Modal from '../common/Modal'; // Assuming Modal.tsx is in components/common

// --- 1. ADD THIS SVG ICON COMPONENT ---
// This is a simple SVG for the Google "G" logo.
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);
// ----------------------------------------

const googleProvider = new GoogleAuthProvider();

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null); // For success messages
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setMessage(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setIsSubmitting(false);
            onClose(); // Close modal on success
        } catch (err: any) {
            setError('Failed to login. Please check your email and password.');
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true);
        setError(null);
        setMessage(null);
        try {
            await signInWithPopup(auth, googleProvider);
            setIsSubmitting(false);
            onClose(); // Close modal on success
        } catch (err: any) {
            setError('Failed to sign in with Google. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address above to reset your password.');
            return;
        }
        setError(null);
        setMessage(null);
        setIsSubmitting(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent. Please check your inbox.');
        } catch (err: any) {
            setError('Failed to send reset email. Please check the email address.');
        }
        setIsSubmitting(false);
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Login">
            {/* --- Messages --- */}
            {error && (
                <div className="text-red-600 bg-red-100 p-3 rounded mb-4">
                    {error}
                </div>
            )}
            {message && (
                <div className="text-blue-600 bg-blue-100 p-3 rounded mb-4">
                    {message}
                </div>
            )}

            {/* --- Email/Password Form --- */}
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                        aria-label="Email"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        required
                        aria-label="Password"
                    />
                </div>

                <div className="flex justify-between items-center pt-2">
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isSubmitting}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                        Forgot Password?
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                    >
                        {isSubmitting ? '...' : 'Login'}
                    </button>
                </div>
            </form>

            {/* --- Divider --- */}
            <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* --- 2. UPDATE THE GOOGLE BUTTON --- */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
                <GoogleIcon /> {/* <-- Use the SVG component here */}
                Sign in with Google
            </button>
        </Modal>
    );
};

export default LoginModal;