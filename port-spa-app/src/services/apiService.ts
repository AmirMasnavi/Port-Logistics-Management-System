import axios from 'axios';
import type {VesselType, VesselTypeCreateDto} from '../types'; 


const API_URL = 'http://localhost:5273/api';

// The function now specifies it returns a Promise of a VesselType array
export const getAllVesselTypes = async (): Promise<VesselType[]> => {
    try {
        const response = await axios.get<VesselType[]>(`${API_URL}/VesselType`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vessel types:', error);
        throw error;
    }
};

    // It takes the DTO as an argument and returns the newly created VesselType
    export const createVesselType = async (vesselTypeData: VesselTypeCreateDto): Promise<VesselType> => {
        try {
            // Send a POST request to the /VesselType endpoint with the new data
            const response = await axios.post<VesselType>(`${API_URL}/VesselType`, vesselTypeData);
            return response.data;
        } catch (error) {
            console.error('Error creating vessel type:', error);
            throw error;
        }
        
};