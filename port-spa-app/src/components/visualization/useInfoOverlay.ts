import { useState, useEffect, useCallback } from 'react';
import { getVesselByImo, getDockById, getAllVesselVisitsForVisualization } from '../../services/apiService';
import { StorageAreaService } from '../../app/storageArea/storageArea.service';
import { storageAreaApiRepository } from '../../infrastructure/repositories/storageArea/storageAreaApi.repository';
import { ResourceService } from '../../app/resource/resource.service';
import { resourceApiRepository } from '../../infrastructure/repositories/resource/resourceApi.repository';

const storageAreaService = new StorageAreaService(storageAreaApiRepository);
const resourceService = new ResourceService(resourceApiRepository);

interface SelectedElementInfo {
    type: 'vessel' | 'dock' | 'yard' | 'building' | 'resource' | null;
    id: string;
    name?: string;
}

export const useInfoOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
    const [elementData, setElementData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Keyboard listener for 'i' key
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            console.log('🔑 Key pressed:', event.key);
            if (event.key === 'i' || event.key === 'I') {
                console.log('🔑 "i" key detected! selectedElement:', selectedElement);
                // Only toggle if an element is selected
                if (selectedElement) {
                    setIsVisible(prev => {
                        const newValue = !prev;
                        console.log('🔑 Toggling visibility from', prev, 'to', newValue);
                        return newValue;
                    });
                } else {
                    console.log('🔑 ⚠️ No element selected, cannot show info overlay');
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedElement]);

    // Fetch element details when selected element changes
    useEffect(() => {
        if (!selectedElement) {
            setElementData(null);
            setIsVisible(false);
            return;
        }

        const fetchElementDetails = async () => {
            setIsLoading(true);
            try {
                console.log(`📡 Fetching details for ${selectedElement.type}:`, selectedElement.id);
                
                let data: any = null;

                switch (selectedElement.type) {
                    case 'vessel': {
                        console.log('🚢 ========== VESSEL INFO FETCH START ==========');
                        console.log('🚢 Selected vessel ID:', selectedElement.id);
                        console.log('🚢 Selected vessel name:', selectedElement.name);
                        
                        // Fetch vessel details and its visit information
                        console.log('🚢 Calling getAllVesselVisitsForVisualization()...');
                        const vesselVisits = await getAllVesselVisitsForVisualization();
                        console.log('🚢 ✅ All vessel visits fetched:', vesselVisits.length);
                        console.log('🚢 Vessel visits data:', vesselVisits);
                        
                        // Try to find by ID first
                        console.log('🚢 Searching for vessel visit with ID:', selectedElement.id);
                        let vesselVisit = vesselVisits.find((v: any) => {
                            console.log(`🚢   Comparing ${v.id} === ${selectedElement.id}:`, v.id === selectedElement.id);
                            return v.id === selectedElement.id;
                        });
                        
                        // If not found by ID (which is undefined), try to find by IMO from element name or other properties
                        if (!vesselVisit && selectedElement.id) {
                            console.log('🚢 ID search failed, trying to find by IMO from selectedElement...');
                            // The selectedElement.id might actually be the IMO
                            vesselVisit = vesselVisits.find((v: any) => v.vesselImo === selectedElement.id);
                            console.log('🚢 IMO search result:', vesselVisit);
                        }
                        
                        console.log('🚢 Found vessel visit:', vesselVisit);
                        
                        if (vesselVisit?.vesselImo) {
                            console.log('🚢 ✅ vesselImo found:', vesselVisit.vesselImo);
                            console.log('🚢 Fetching vessel details for IMO:', vesselVisit.vesselImo);
                            const vesselDetails = await getVesselByImo(vesselVisit.vesselImo);
                            console.log('🚢 ✅ Vessel details fetched:', vesselDetails);
                            
                            data = {
                                ...vesselDetails,
                                vesselVisit: vesselVisit,
                                imo: vesselVisit.vesselImo
                            };
                            console.log('🚢 ✅ Final vessel data prepared:', data);
                        } else {
                            console.warn('🚢 ⚠️ Could not find vessel visit or vesselImo is missing');
                            console.warn('🚢 vesselVisit found:', !!vesselVisit);
                            console.warn('🚢 vesselImo:', vesselVisit?.vesselImo);
                            
                            // Fallback: try to use whatever data we have
                            if (vesselVisit) {
                                console.log('🚢 Using fallback data with vessel visit info');
                                data = {
                                    name: selectedElement.name || 'Unknown Vessel',
                                    imo: vesselVisit.vesselImo || 'N/A',
                                    vesselVisit: vesselVisit
                                };
                            } else {
                                console.error('🚢 ❌ No vessel visit found at all! Using minimal fallback');
                                // Last resort: try to fetch vessel by the element name (might be IMO)
                                if (selectedElement.id) {
                                    try {
                                        console.log('🚢 Last resort: trying to fetch vessel by potential IMO:', selectedElement.id);
                                        const vesselDetails = await getVesselByImo(selectedElement.id);
                                        data = {
                                            ...vesselDetails,
                                            name: vesselDetails.name || selectedElement.name || 'Unknown Vessel',
                                            imo: selectedElement.id,
                                            vesselVisit: null
                                        };
                                        console.log('🚢 ✅ Fetched vessel data directly by IMO:', data);
                                    } catch (error) {
                                        console.error('🚢 ❌ Failed to fetch by IMO:', error);
                                        data = {
                                            name: selectedElement.name || 'Unknown Vessel',
                                            imo: selectedElement.id || 'N/A',
                                            type: 'Vessel'
                                        };
                                    }
                                } else {
                                    data = {
                                        name: selectedElement.name || 'Unknown Vessel',
                                        imo: 'N/A',
                                        type: 'Vessel'
                                    };
                                }
                            }
                        }
                        console.log('🚢 ========== VESSEL INFO FETCH END ==========');
                        break;
                    }
                    
                    case 'dock': {
                        // Fetch dock details
                        data = await getDockById(selectedElement.id);
                        
                        // Check if dock is occupied by finding vessel visits
                        const vesselVisits = await getAllVesselVisitsForVisualization();
                        const vesselAtDock = vesselVisits.find((v: any) => v.assignedDockId === selectedElement.id);
                        
                        if (vesselAtDock?.vesselImo) {
                            data.currentVessel = await getVesselByImo(vesselAtDock.vesselImo);
                            data.isOccupied = true;
                        } else {
                            data.isOccupied = false;
                        }
                        break;
                    }
                    
                    case 'yard':
                    case 'building': {
                        // Fetch storage area details - suppress errors since backend has issues
                        const baseCode = selectedElement.id.replace(/-[1-4]$/, '');
                        
                        try {
                            const storageAreas = await storageAreaService.fetchAllStorageAreas();
                            const storageArea = storageAreas.find(
                                sa => sa.code === selectedElement.id || 
                                      sa.code === baseCode
                            );
                            
                            if (storageArea) {
                                data = {
                                    ...storageArea,
                                    name: storageArea.code,
                                    status: 'Active'
                                };
                            } else {
                                data = {
                                    code: baseCode,
                                    name: selectedElement.name || baseCode,
                                    type: selectedElement.type === 'yard' ? 'Yard' : 'Warehouse',
                                    status: 'Active'
                                };
                            }
                        } catch (error) {
                            // Silently use fallback data - backend storage area endpoint has issues
                            data = {
                                code: baseCode,
                                name: selectedElement.name || baseCode,
                                type: selectedElement.type === 'yard' ? 'Yard' : 'Warehouse',
                                status: 'Active'
                            };
                        }
                        break;
                    }
                    
                    case 'resource': {
                        // Fetch resource details
                        try {
                            const resources = await resourceService.fetchAllResources();
                            const resource = resources.find(r => 
                                r.code === selectedElement.id || 
                                r.code === selectedElement.id.split('@')[0]
                            );
                            
                            if (resource) {
                                data = {
                                    ...resource,
                                    isActive: true,
                                    status: 'Operational'
                                };
                            } else {
                                data = {
                                    code: selectedElement.id,
                                    kind: 'Resource',
                                    assignedArea: 'N/A',
                                    status: 'Unknown'
                                };
                            }
                        } catch (error) {
                            data = {
                                code: selectedElement.id,
                                kind: 'Resource',
                                assignedArea: 'N/A',
                                status: 'Unknown'
                            };
                        }
                        break;
                    }
                }

                console.log('✅ Setting element data:', data);
                setElementData(data);
                console.log('✅ Element data set successfully');
            } catch (error) {
                console.error('❌ Error fetching element details:', error);
                // Set fallback data
                setElementData({
                    name: selectedElement.name || selectedElement.id,
                    type: selectedElement.type,
                    id: selectedElement.id
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchElementDetails();
    }, [selectedElement]);

    const selectElement = useCallback((elementInfo: SelectedElementInfo) => {
        console.log('🎯 Element selected:', elementInfo);
        setSelectedElement(elementInfo);
        // Don't auto-show overlay, wait for user to press 'i'
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedElement(null);
        setElementData(null);
        setIsVisible(false);
    }, []);

    return {
        isVisible,
        selectedElement,
        elementData,
        isLoading,
        selectElement,
        clearSelection,
        toggleVisibility: () => setIsVisible(prev => !prev)
    };
};
