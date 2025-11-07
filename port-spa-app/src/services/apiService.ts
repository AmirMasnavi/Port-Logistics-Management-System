// port-spa-app/src/services/apiService.ts
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { VesselType, VesselTypeCreateDto, PortLayout, VesselVisit, Resource } from '../types';

// 1. Crie uma instância central do Axios
const apiClient = axios.create({
    baseURL: 'http://localhost:5273/api',
});

// Helper to get the current user's token
const getAccessToken = (): Promise<string | null> => {
    return new Promise((resolve) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            currentUser.getIdToken().then(resolve);
        } else {
            // Wait for auth state to be initialized
            const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
                unsubscribe(); // Stop listening
                if (user) {
                    user.getIdToken().then(resolve);
                } else {
                    resolve(null); // No user logged in
                }
            });
        }
    });
};

// This function can now be called inside App.tsx or directly here
export const setupApiInterceptor = () => {
    apiClient.interceptors.request.use(async (config) => {
        try {
            const token = await getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error("Could not get access token", e);
        }
        return config;
    });
};
setupApiInterceptor();

// 3. Atualize as suas funções para usarem a instância `apiClient`
export const getAllVesselTypes = async (): Promise<VesselType[]> => {
    try {
        const response = await apiClient.get<VesselType[]>(`/VesselType`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vessel types:', error);
        throw error;
    }
};

export const createVesselType = async (vesselTypeData: VesselTypeCreateDto): Promise<VesselType> => {
    try {
        const response = await apiClient.post<VesselType>(`/VesselType`, vesselTypeData);
        return response.data;
    } catch (error) {
        console.error('Error creating vessel type:', error);
        throw error;
    }
};

export const assignUserRole = async (email: string, role: string) => {
    try {
        const response = await apiClient.post('/admin/assign-role', { email, role });
        return response.data;
    } catch (error) {
        console.error('Error assigning role:', error);
        throw error;
    }
};

export const getMyRole = async (): Promise<{ role: string }> => {
    try {
        // This endpoint requires a valid Firebase token, which our
        // apiClient interceptor automatically adds to the headers.
        const response = await apiClient.get('/auth/my-role');
        return response.data; // Will return { role: "Administrator" }
    } catch (error) {
        console.error('Error fetching user role:', error);
        throw error;
    }
};

export const activateUserAccount = async (token: string) => {
    try {
        // This is an anonymous endpoint, no token is needed
        const response = await apiClient.get(`/auth/activate?token=${token}`);
        return response.data; // Will return { message: "Account activated..." }
    } catch (error) {
        console.error('Error activating account:', error);
        throw error;
    }
};

// --- New functions used by the visualization ---

export const getPortLayout = async (layoutId: string): Promise<PortLayout> => {
    try {
        const response = await apiClient.get<PortLayout>(`/PortLayout/${layoutId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching port layout:', error);
        throw error;
    }
};

// Changed to call the notifications search endpoint with a status filter
export const getApprovedVesselVisits = async (): Promise<VesselVisit[]> => {
    try {
        const response = await apiClient.get<VesselVisit[]>(`/notifications/search?status=Approved`);
        return response.data;
    } catch (error) {
        console.error('Error fetching approved vessel visits:', error);
        throw error;
    }
};

export const getResources = async (): Promise<Resource[]> => {
    try {
        const response = await apiClient.get<Resource[]>(`/Resource`);
        return response.data;
    } catch (error) {
        console.error('Error fetching resources:', error);
        throw error;
    }
};

// Use the vessel controller route that returns vessel by IMO at GET /api/Vessel/{imo}
export const getVesselByImo = async (imo: string): Promise<{ imo: string; name: string; vesselTypeId?: string }> => {
    try {
        const response = await apiClient.get(`/Vessel/${imo}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vessel by IMO:', error);
        throw error;
    }
};

// Use the dock controller route that returns dock by ID at GET /api/Dock/{id}
export const getDockById = async (id: string): Promise<{ id: string; name: string }> => {
    try {
        const response = await apiClient.get(`/Dock/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching dock by ID:', error);
        throw error;
    }
};
