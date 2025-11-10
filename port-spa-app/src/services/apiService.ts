// port-spa-app/src/services/apiService.ts
import axios, {type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import { auth } from '../firebaseConfig';
import {onAuthStateChanged, signOut, type User} from 'firebase/auth';
import type {
    VesselType,
    VesselTypeCreateDto,
    PortLayout,
    VesselVisit,
    Resource,
    VesselVisitNotification, CreateVvnDto, ApproveVvnDto, RejectVvnDto
} from '../types';

// 1. Create a central instance of Axios
const apiClient = axios.create({
    baseURL: 'http://localhost:5273/api',
    timeout: 15000,
});

// Helper para obter o token do utilizador atual (usa SDK do Firebase)
const getAccessToken = (): Promise<string | null> => {
    return new Promise((resolve) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            currentUser.getIdToken().then(resolve).catch(() => resolve(null));
        } else {
            const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
                unsubscribe();
                if (user) {
                    user.getIdToken().then(resolve).catch(() => resolve(null));
                } else {
                    resolve(null);
                }
            });
        }
    });
};
// Topic: Axios response interceptor handling 401, performing silent token refresh and retry (with queue)
// Mechanism to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const queuedRequests: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
    while (queuedRequests.length) {
        const cb = queuedRequests.shift();
        if (cb) cb(token);
    }
};


// Initialise interceptors: request (attach token) and response (refresh on 401 + retry)
export const initializeApi = () => {
    // Request interceptor: uses the internal type for compatibility with Axios
    apiClient.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            try {
                const token = await getAccessToken();
                if (token) {
                    if (!config.headers) config.headers = {} as any;
                    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                }
            } catch (e) {
                console.error('Unable to obtain access token', e);
            }
            return config;
        },
        (error: any) => Promise.reject(error)
    );

    // Response interceptor: attempts to refresh on 401 and re-executes the request once
    apiClient.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: any) => {
            const originalRequest = (error?.config ?? {}) as any;
            const status = error?.response?.status;

            if (status === 401 && !originalRequest._retry) {
                // If a refresh is already in progress, queue the request.
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        queuedRequests.push(async (token) => {
                            if (token) {
                                originalRequest.headers = originalRequest.headers || {};
                                (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                                try {
                                    const res = await apiClient(originalRequest);
                                    resolve(res);
                                } catch (err) {
                                    reject(err);
                                }
                            } else {
                                reject(error);
                            }
                        });
                    });
                }
                // Start a refresh
                originalRequest._retry = true;
                isRefreshing = true;
                refreshPromise = (async () => {
                    try {
                        const user = auth.currentUser;
                        if (!user) return null;
                        const freshToken = await user.getIdToken(true);
                        return freshToken;
                    } catch (refreshError) {
                        console.error('Refresh de token falhou', refreshError);
                        return null;
                    }
                })();
                const freshToken = await refreshPromise;
                isRefreshing = false;
                refreshPromise = null;

                if (freshToken) {
                    // Process queue with new token and re-execute the original request
                    processQueue(freshToken);
                    if (!originalRequest.headers) originalRequest.headers = {};
                    (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${freshToken}`;
                    return apiClient(originalRequest);
                }

                // Topic: Sign-out and redirect to /login when token refresh fails.
                // If the refresh fails, it signs you out and redirects you to the login page.
                processQueue(null);
                try {
                    await signOut(auth);
                } catch (signOutErr) {
                    console.error('Failure to sign out', signOutErr);
                }
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }
    );
};           
            
export { apiClient };

export const setupApiInterceptor = initializeApi;
              

// 3. Update your functions to use the `apiClient` instance.
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



export const getAllShippingAgentOrganizations = async (): Promise<any[]> => {
    try {
        // Server tests use /api/ShippingAgentOrganizations (plural). baseURL already has /api.
        const response = await apiClient.get<any[]>(`/ShippingAgentOrganizations`);
        return response.data;
    } catch (error) {
        console.error('Error fetching shipping agent organizations:', error);
        throw error;
    }
}

export const getAllShippingAgentRepresentatives = async (): Promise<any[]> => {
    try {
        // Server tests use /api/ShippingAgentRepresentatives (plural)
        const response = await apiClient.get<any[]>(`/ShippingAgentRepresentatives`);
        return response.data;
    } catch (error) {
        console.error('Error fetching shipping agent representatives:', error);
        throw error;
    }
}

// POST /api/ShippingAgentOrganizations - cria uma organização com representante inicial
export const createShippingAgentOrganization = async (dto: any): Promise<any> => {
    try {
        const response = await apiClient.post<any>(`/ShippingAgentOrganizations`, dto);
        return response.data;
    } catch (error) {
        console.error('Error creating shipping agent organization:', error);
        throw error;
    }
}

// POST /api/ShippingAgentRepresentatives - cria um representante ligado por nome de organização
export const createShippingAgentRepresentative = async (dto: any): Promise<any> => {
    try {
        const response = await apiClient.post<any>(`/ShippingAgentRepresentatives`, dto);
        return response.data;
    } catch (error) {
        console.error('Error creating shipping agent representative:', error);
        throw error;
    }
}

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

// --- Vessel Visit Notification Service (FIXED) ---

// GET /api/notifications/search
export const getAllVvns = async (): Promise<VesselVisitNotification[]> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        const response = await apiClient.get<VesselVisitNotification[]>('/notifications/search');
        return response.data;
    } catch (error) {
        console.error('Error fetching VVNs:', error);
        throw error;
    }
};

// GET /api/notifications/{id}
export const getVvnById = async (id: string): Promise<VesselVisitNotification> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        const response = await apiClient.get<VesselVisitNotification>(`/notifications/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching VVN ${id}:`, error);
        throw error;
    }
};

// POST /api/notifications
export const createVvn = async (dto: CreateVvnDto): Promise<VesselVisitNotification> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        const response = await apiClient.post<VesselVisitNotification>('/notifications', dto);
        return response.data;
    } catch (error) {
        console.error('Error creating VVN:', error);
        throw error;
    }
};

// PUT /api/notifications/{id}
export const updateVvn = async (id: string, dto: CreateVvnDto): Promise<VesselVisitNotification> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        const response = await apiClient.put<VesselVisitNotification>(`/notifications/${id}`, dto);
        return response.data;
    } catch (error) {
        console.error(`Error updating VVN ${id}:`, error);
        throw error;
    }
};

// PATCH /api/notifications/{id}/submit
export const submitVvn = async (id: string): Promise<void> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        await apiClient.patch(`/notifications/${id}/submit`);
    } catch (error) {
        console.error(`Error submitting VVN ${id}:`, error);
        throw error;
    }
};

// PATCH /api/notifications/{id}/approve
export const approveVvn = async (id: string, dto: ApproveVvnDto): Promise<void> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        await apiClient.patch(`/notifications/${id}/approve`, dto);
    } catch (error) {
        console.error(`Error approving VVN ${id}:`, error);
        throw error;
    }
};

// PATCH /api/notifications/{id}/reject
export const rejectVvn = async (id: string, dto: RejectVvnDto): Promise<void> => {
    try {
        // --- FIX: Used apiClient and correct endpoint ---
        await apiClient.patch(`/notifications/${id}/reject`, dto);
    } catch (error) {
        console.error(`Error rejecting VVN ${id}:`, error);
        throw error;
    }
};