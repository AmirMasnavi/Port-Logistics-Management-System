// src/components/auth/ProfileModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import Modal from '../common/Modal';
import { updateProfile } from 'firebase/auth';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    // Set state from the currently logged-in user
    const [displayName, setDisplayName] = useState(user?.displayName ?? '');
    // --- 'photoURL' state removed ---

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // --- Call updateProfile without photoURL ---
            await updateProfile(user, {
                displayName: displayName,
            });

            setIsSubmitting(false);
            setSuccess('Profile updated successfully! It may take a moment to refresh.');

            setTimeout(() => {
                onClose();
                // We can force a reload to make the header update the name
                window.location.reload();
            }, 1500);

        } catch (err: any) {
            setError('Failed to update profile. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* --- Messages --- */}
                {error && (
                    <div className="text-red-600 bg-red-100 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="text-green-600 bg-green-100 p-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {/* --- Form Fields --- */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={user?.email ?? ''}
                        disabled // Email is not editable
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-lg"
                        placeholder="Your full name"
                    />
                </div>

                {/* --- "Photo URL" input field REMOVED --- */}

                {/* --- Actions --- */}
                <div className="flex justify-end space-x-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProfileModal;