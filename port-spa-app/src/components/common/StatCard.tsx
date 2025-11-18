// src/components/common/StatCard.tsx
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#2596be' }}>{value}</div>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
    );
};

export default StatCard;