import React from 'react';
import logoUrl from '../../assets/logo.png';

const BrandLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex items-center justify-center ${className}`} aria-hidden>
        <img src={logoUrl} alt="Port Authority logo" className="w-8 h-8 object-contain rounded-md" />
    </div>
);

export default BrandLogo;
