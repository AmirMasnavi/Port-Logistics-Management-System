import React, { useEffect } from 'react';
import BrandLogo from './BrandLogo';

// Define the component's props using a TypeScript interface
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    showFooter?: boolean;
    showHeaderClose?: boolean;
    footerLabel?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, showFooter = true, showHeaderClose = true, footerLabel = 'Close' }) => {
    // Close on ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', onKey);
        }
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // If the modal isn't open, render nothing (null)
    if (!isOpen) {
        return null;
    }

    // Render the modal
    return (
        // Backdrop
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40 p-4"
            aria-modal="true"
            role="dialog"
            onClick={onClose} // click on backdrop closes
        >
            {/* Modal content container - stop click propagation so clicks inside don't close */}
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-200 scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md flex items-center justify-center">
                            <BrandLogo />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    </div>

                    {showHeaderClose && (
                        <button
                            onClick={onClose}
                            aria-label="Close modal"
                            className="text-blue-600 hover:text-blue-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 8.586L15.95 2.636a1 1 0 011.414 1.414L11.414 10l5.95 5.95a1 1 0 01-1.414 1.414L10 11.414l-5.95 5.95a1 1 0 01-1.414-1.414L8.586 10 2.636 4.05A1 1 0 014.05 2.636L10 8.586z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-4">
                    {children}
                </div>

                {/* Footer (optional space for actions) */}
                {showFooter && (
                    <div className="p-4 border-t flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors">{footerLabel}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;