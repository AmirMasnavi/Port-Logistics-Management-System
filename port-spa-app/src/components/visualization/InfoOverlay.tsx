import React from 'react';

interface InfoOverlayProps {
    isVisible: boolean;
    elementType: 'vessel' | 'dock' | 'yard' | 'building' | 'resource' | null;
    elementData: any;
    userRole: string | null;
}

export const InfoOverlay: React.FC<InfoOverlayProps> = ({
    isVisible,
    elementType,
    elementData,
    userRole
}) => {
    // Debug logging
    console.log('🎨 InfoOverlay render:', { isVisible, elementType, hasData: !!elementData, userRole });
    console.log('🎨 InfoOverlay elementData:', elementData);
    
    if (!isVisible) {
        console.log('🎨 InfoOverlay: Not visible (isVisible=false)');
        return null;
    }
    
    if (!elementType) {
        console.log('🎨 InfoOverlay: No element type');
        return null;
    }
    
    if (!elementData) {
        console.log('🎨 InfoOverlay: No element data - showing loading state');
        // Show loading state instead of returning null
        return (
            <div 
                className="absolute top-20 left-6 z-10 backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/85 border border-gray-200 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out pointer-events-none"
                style={{ 
                    maxWidth: '320px',
                    minWidth: '280px'
                }}
            >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Loading Information...
                        </h3>
                        <span className="text-xs text-blue-100">Press 'i' to toggle</span>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-600">Fetching {elementType} details...</p>
                </div>
            </div>
        );
    }
    
    console.log('🎨 InfoOverlay: Rendering with data:', elementData);

    // Check if user has privileged access (Port Authority or Logistics Operator)
    const hasRestrictedAccess = 
        userRole === 'PortAuthorityOfficer' || 
        userRole === 'LogisticsOperator' ||
        userRole === 'Administrator';

    const renderGeneralInfo = () => {
        switch (elementType) {
            case 'vessel':
                return (
                    <>
                        <InfoRow label="Name" value={elementData.name || 'Unknown'} />
                        <InfoRow label="IMO" value={elementData.imo || 'N/A'} />
                        <InfoRow label="Type" value="Vessel" />
                        {elementData.vesselType && (
                            <InfoRow label="Vessel Type" value={elementData.vesselType.name || 'N/A'} />
                        )}
                    </>
                );
            case 'dock':
                return (
                    <>
                        <InfoRow label="Name" value={elementData.name || 'Unknown'} />
                        <InfoRow label="Type" value="Dock" />
                        <InfoRow label="Location Zone" value={elementData.locationZone || 'N/A'} />
                        <InfoRow label="Location Section" value={elementData.locationSection || 'N/A'} />
                    </>
                );
            case 'yard':
                return (
                    <>
                        <InfoRow label="Name" value={elementData.name || elementData.code || 'Unknown'} />
                        <InfoRow label="Type" value="Storage Area - Yard" />
                        <InfoRow label="Code" value={elementData.code || 'N/A'} />
                    </>
                );
            case 'building':
                return (
                    <>
                        <InfoRow label="Name" value={elementData.name || elementData.code || 'Unknown'} />
                        <InfoRow label="Type" value="Storage Area - Warehouse" />
                        <InfoRow label="Code" value={elementData.code || 'N/A'} />
                    </>
                );
            case 'resource':
                return (
                    <>
                        <InfoRow label="Code" value={elementData.code || 'Unknown'} />
                        <InfoRow label="Type" value={elementData.kind || 'Resource'} />
                        <InfoRow label="Assigned Area" value={elementData.assignedArea || 'N/A'} />
                    </>
                );
            default:
                return <InfoRow label="Type" value="Unknown" />;
        }
    };

    const renderRestrictedInfo = () => {
        if (!hasRestrictedAccess) {
            return null;
        }

        switch (elementType) {
            case 'vessel':
                return (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Restricted Information
                        </div>
                        {elementData.vesselVisit && (
                            <>
                                <InfoRow label="Status" value={elementData.vesselVisit.status || 'N/A'} />
                                <InfoRow label="ETA" value={elementData.vesselVisit.estimatedArrival || elementData.vesselVisit.arrivalDate || 'N/A'} />
                                <InfoRow label="ETD" value={elementData.vesselVisit.estimatedDeparture || elementData.vesselVisit.departureDate || 'N/A'} />
                                <InfoRow label="Assigned Dock" value={elementData.vesselVisit.assignedDockName || 'N/A'} />
                                {elementData.vesselVisit.operations && (
                                    <InfoRow 
                                        label="Ongoing Operations" 
                                        value={`${elementData.vesselVisit.operations.length} operation(s)`} 
                                    />
                                )}
                            </>
                        )}
                    </div>
                );
            case 'dock':
                return (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Restricted Information
                        </div>
                        <InfoRow label="Status" value={elementData.status || (elementData.isOccupied ? 'Occupied' : 'Available')} />
                        <InfoRow label="Length" value={elementData.lengthInMeters ? `${elementData.lengthInMeters}m` : 'N/A'} />
                        <InfoRow label="Depth" value={elementData.depthInMeters ? `${elementData.depthInMeters}m` : 'N/A'} />
                        {elementData.currentVessel && (
                            <InfoRow label="Current Vessel" value={elementData.currentVessel.name || 'N/A'} />
                        )}
                    </div>
                );
            case 'yard':
            case 'building':
                return (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Restricted Information
                        </div>
                        <InfoRow label="Status" value={elementData.status || 'Active'} />
                        {elementData.capacity !== undefined && (
                            <InfoRow label="Capacity" value={`${elementData.currentOccupancy || 0}/${elementData.capacity} TEU`} />
                        )}
                    </div>
                );
            case 'resource':
                return (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Restricted Information
                        </div>
                        <InfoRow label="Status" value={elementData.status || (elementData.isActive ? 'Active' : 'Inactive')} />
                        {elementData.currentOperation && (
                            <InfoRow label="Current Operation" value={elementData.currentOperation} />
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div 
            className="absolute top-20 left-6 z-10 backdrop-blur-xl bg-gradient-to-br from-white/95 to-white/85 border border-gray-200 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out pointer-events-none"
            style={{ 
                maxWidth: '320px',
                minWidth: '280px'
            }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Element Information
                    </h3>
                    <span className="text-xs text-blue-100">Press 'i' to toggle</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* General Information */}
                <div className="space-y-2">
                    {renderGeneralInfo()}
                </div>

                {/* Restricted Information */}
                {renderRestrictedInfo()}

                {/* Role indicator */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>Your Role: {userRole || 'Guest'}</span>
                        {hasRestrictedAccess && (
                            <span className="flex items-center gap-1 text-blue-600">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Full Access
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-start gap-3 text-sm">
        <span className="font-medium text-gray-600 whitespace-nowrap">{label}:</span>
        <span className="text-gray-900 text-right break-words">{value}</span>
    </div>
);
