// src/components/common/ConfirmationModal.tsx
import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onConfirm,
                                                                 title,
                                                                 message,
                                                                 confirmText = 'Confirm',
                                                                 isDestructive = false,
                                                             }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} showFooter={false}>
            <div className="flex items-start gap-4">
                <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                    isDestructive ? 'bg-red-100' : 'bg-blue-100'
                } sm:mx-0 sm:h-10 sm:w-10`}>
                    <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <p className="text-sm text-gray-500">{message}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-5 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary w-full sm:w-auto justify-center"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className={`btn w-full sm:w-auto justify-center ${
                        isDestructive
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'btn-primary'
                    }`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;