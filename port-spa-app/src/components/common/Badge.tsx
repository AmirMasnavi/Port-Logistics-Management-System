import React from 'react';

interface BadgeProps {
    status: 'InProgress' | 'Submitted' | 'Approved' | 'Rejected';
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
    const statusStyles = {
        InProgress: 'bg-gray-200 text-gray-800',
        Submitted: 'bg-yellow-200 text-yellow-800',
        Approved: 'bg-green-200 text-green-800',
        Rejected: 'bg-red-200 text-red-800',
    };

    return (
        <span
            className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${statusStyles[status]}`}
        >
      {status}
    </span>
    );
};

export default Badge;