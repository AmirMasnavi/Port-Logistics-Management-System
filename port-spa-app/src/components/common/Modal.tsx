import React from 'react';

// Define the component's props using a TypeScript interface
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    // If the modal isn't open, render nothing (null)
    if (!isOpen) {
        return null;
    }

    // Render the modal
    return (
        // 1. The semi-transparent backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            {/* 2. The modal content container */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                {/* 3. Modal Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        &times; {/* This is an 'X' symbol */}
                    </button>
                </div>

                {/* 4. Modal Body (where the form will go) */}
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;