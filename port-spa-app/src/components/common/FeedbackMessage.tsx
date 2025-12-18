import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface FeedbackMessageProps {
    type: 'success' | 'error' | 'warning';
    message: string;
    onClose?: () => void;
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ type, message, onClose }) => {
    const styles = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            icon: <AlertCircle className="w-5 h-5 text-amber-500" />
        }
    };

    const style = styles[type];

    return (
        <div className={`${style.bg} border ${style.border} rounded-lg p-4 mb-6 flex items-start gap-3 animate-fade-in shadow-sm`}>
            <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
            <div className={`flex-1 text-sm font-medium ${style.text} whitespace-pre-line`}>
                {message}
            </div>
            {onClose && (
                <button 
                    onClick={onClose}
                    className={`flex-shrink-0 ml-2 ${style.text} opacity-60 hover:opacity-100 transition-opacity`}
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default FeedbackMessage;

