// src/components/common/ConfirmationModal.tsx
import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
import { t } from '../../i18nClient';

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
    // If caller passed a recognisable key we translate it; otherwise we fall back to a sensible default
    const confirmLabel = confirmText === 'Confirm' ? t('Confirm') : t(confirmText);

    // split message into sentences for better hierarchy; fallback to whole message
    const parts = message.split(/(?<=[.?!])\s+/);
    const firstLine = parts[0] ?? '';
    const secondLine = parts.slice(1).join(' ') || '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} showFooter={false}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 py-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isDestructive ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <AlertTriangle className={`h-5 w-5 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
                </div>

                <div className="mt-2 text-center sm:ml-2 sm:mt-0 sm:text-left">
                    <div className="text-sm font-semibold text-gray-900">{firstLine}</div>
                    {secondLine && <div className="text-sm text-slate-500 mt-2">{secondLine}</div>}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 border border-gray-200 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                    {t('button.cancel')}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 ${isDestructive ? 'focus:ring-red-300' : 'focus:ring-blue-300'} ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;