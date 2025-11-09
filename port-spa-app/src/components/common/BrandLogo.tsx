// src/components/common/BrandLogo.tsx
import React from 'react';
import logoUrl from '../../assets/logo.png';

// We updated the props to just showText, like in our previous step
interface BrandLogoProps {
    showText?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ showText = false }) => (
    <div className="flex items-center gap-3">

        {/* --- THIS IS THE UPDATED PART --- */}
        {/* 1. Removed 'shadow-md' */}
        {/* 2. Increased size from 'w-10 h-10' to 'w-12 h-12' (48px) */}
        <div
            aria-hidden
            // className="flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center bg-maritime-500 text-white font-bold"
        >
            {/* 3. Increased image size from 'w-8 h-8' to 'w-10 h-10' (40px) */}
            <img src={logoUrl} alt="Port Authority logo" className="w-20 h-20 object-contain rounded-md" />
        </div>

        {/* This part for showing text is unchanged */}
        {showText && (
            <div className="overflow-hidden whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-800">Port Authority</div>
                <div className="text-xs text-gray-500">Harbour dashboard</div>
            </div>
        )}
    </div>
);

export default BrandLogo;