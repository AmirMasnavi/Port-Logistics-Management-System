import axios from 'axios';
import type {VesselType} from '../types'; 


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