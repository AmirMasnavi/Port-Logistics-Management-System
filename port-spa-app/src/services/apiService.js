import axios from 'axios';

// Define the base URL of your API.
const API_URL = 'http://localhost:5273/api';

// Create a function to get all vessel types
export const getAllVesselTypes = async () => {
    try {
        // axios.get makes a GET request. The URL is combined with the base URL.
        const response = await axios.get(`${API_URL}/VesselType`);

        // Axios automatically parses the JSON and puts the data in the `data` property.
        return response.data;
    } catch (error) {
        // Axios automatically throws an error for failed requests (like 404 or 500)
        console.error('Error fetching vessel types:', error);
        // You can handle the error here or re-throw it to be handled in the component
        throw error;
    }
};

// Example function for creating a new vessel type (POST request)
export const createVesselType = async (vesselTypeData) => {
    try {
        const response = await axios.post(`${API_URL}/VesselType`, vesselTypeData);
        return response.data;
    } catch (error) {
        console.error('Error creating vessel type:', error);
        throw error;
    }
}