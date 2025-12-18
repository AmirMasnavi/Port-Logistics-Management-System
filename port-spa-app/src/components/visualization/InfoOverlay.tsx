import React, { useState, useRef, useEffect } from 'react';

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
    // Draggable state
    const [position, setPosition] = useState({ x: 24, y: 80 }); // Initial position (left-6 = 24px, top-20 = 80px)
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const overlayRef = useRef<HTMLDivElement>(null);

    // Handle drag start
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    // Handle dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

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
                ref={overlayRef}
                onMouseDown={handleMouseDown}
                className="absolute z-10 backdrop-blur-xl bg-gradient-to-br from-white/98 to-blue-50/95 border-2 border-blue-200/50 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out"
                style={{ 
                    maxWidth: '380px',
                    minWidth: '320px',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'auto',
                    pointerEvents: 'auto',
                    animation: 'slideInInfo 0.3s ease-out'
                }}
            >
                <div className="drag-handle bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 px-5 py-4 cursor-grab active:cursor-grabbing select-none relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/25 p-2 rounded-lg backdrop-blur-sm shadow-lg animate-pulse">
                                <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base tracking-wide">Loading Information...</h3>
                                <span className="text-white/70 text-xs">Please wait</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                                Fetching {elementType || 'element'} details...
                            </p>
                        </div>
                    </div>
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

        let content = null;
        
        switch (elementType) {
            case 'vessel':
                content = elementData.vesselVisit && (
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
                );
                break;
            case 'dock':
                content = (
                    <>
                        <InfoRow label="Status" value={elementData.status || (elementData.isOccupied ? 'Occupied' : 'Available')} />
                        <InfoRow label="Length" value={elementData.lengthInMeters ? `${elementData.lengthInMeters}m` : 'N/A'} />
                        <InfoRow label="Depth" value={elementData.depthInMeters ? `${elementData.depthInMeters}m` : 'N/A'} />
                        {elementData.currentVessel && (
                            <InfoRow label="Current Vessel" value={elementData.currentVessel.name || 'N/A'} />
                        )}
                    </>
                );
                break;
            case 'yard':
            case 'building':
                content = (
                    <>
                        <InfoRow label="Status" value={elementData.status || 'Active'} />
                        {elementData.capacity !== undefined && (
                            <InfoRow label="Capacity" value={`${elementData.currentOccupancy || 0}/${elementData.capacity} TEU`} />
                        )}
                    </>
                );
                break;
            case 'resource':
                content = (
                    <>
                        <InfoRow label="Status" value={elementData.status || (elementData.isActive ? 'Active' : 'Inactive')} />
                        {elementData.currentOperation && (
                            <InfoRow label="Current Operation" value={elementData.currentOperation} />
                        )}
                    </>
                );
                break;
            default:
                return null;
        }

        if (!content) {
            return null;
        }

        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-sm rounded-xl p-4 shadow-md border-2 border-amber-200/60">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 rounded-lg shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h4 className="text-amber-900 font-semibold text-sm flex items-center gap-1.5">
                        Restricted Information
                        <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">Privileged</span>
                    </h4>
                </div>
                <div className="space-y-2.5">
                    {content}
                </div>
            </div>
        );
    };

    // Get element type icon and color
    const getElementIcon = () => {
        switch (elementType) {
            case 'vessel':
                return {
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
                    gradient: 'from-blue-500 to-cyan-500',
                    bgGradient: 'from-blue-600 via-blue-700 to-cyan-600'
                };
            case 'dock':
                return {
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                    gradient: 'from-purple-500 to-pink-500',
                    bgGradient: 'from-purple-600 via-purple-700 to-pink-600'
                };
            case 'yard':
                return {
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
                    gradient: 'from-green-500 to-emerald-500',
                    bgGradient: 'from-green-600 via-green-700 to-emerald-600'
                };
            case 'building':
                return {
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                    gradient: 'from-orange-500 to-red-500',
                    bgGradient: 'from-orange-600 via-orange-700 to-red-600'
                };
            case 'resource':
                return {
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
                    gradient: 'from-indigo-500 to-purple-500',
                    bgGradient: 'from-indigo-600 via-indigo-700 to-purple-600'
                };
            default:
                return {
                    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                    gradient: 'from-gray-500 to-gray-600',
                    bgGradient: 'from-gray-600 via-gray-700 to-gray-800'
                };
        }
    };

    const elementStyle = getElementIcon();

    return (
        <div 
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            className="absolute z-10 backdrop-blur-xl bg-gradient-to-br from-white/98 to-blue-50/95 border-2 border-blue-200/50 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-3xl"
            style={{ 
                maxWidth: '380px',
                minWidth: '320px',
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'auto',
                pointerEvents: 'auto',
                animation: 'slideInInfo 0.3s ease-out'
            }}
        >
            {/* Header - Draggable Handle com Gradiente Dinâmico */}
            <div className={`drag-handle bg-gradient-to-r ${elementStyle.bgGradient} px-5 py-4 cursor-grab active:cursor-grabbing select-none relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`bg-white/25 p-2 rounded-lg backdrop-blur-sm shadow-lg`}>
                            {elementStyle.icon}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base tracking-wide">Element Information</h3>
                            <span className="text-white/70 text-xs capitalize">{elementType}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                            <kbd className="text-white text-xs font-mono font-bold">i</kbd>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content com Cards */}
            <div className="p-5 space-y-4">
                {/* General Information Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`bg-gradient-to-r ${elementStyle.gradient} p-1.5 rounded-lg`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="text-gray-800 font-semibold text-sm">General Information</h4>
                    </div>
                    <div className="space-y-2.5">
                        {renderGeneralInfo()}
                    </div>
                </div>

                {/* Restricted Information Card */}
                {renderRestrictedInfo()}

                {/* Role indicator Card */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3.5 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-lg">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">Your Role:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{userRole || 'Guest'}</span>
                            {hasRestrictedAccess && (
                                <span className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
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
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center gap-3 text-sm group hover:bg-blue-50/50 px-2 py-1.5 rounded-lg transition-all duration-200">
        <span className="font-semibold text-gray-700 whitespace-nowrap flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 group-hover:scale-125 transition-transform"></span>
            {label}:
        </span>
        <span className="text-gray-900 font-medium text-right break-words bg-white/60 px-2 py-0.5 rounded group-hover:bg-white/80 transition-colors">
            {value}
        </span>
    </div>
);
