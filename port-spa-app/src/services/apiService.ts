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
    Dock, DockCreateDto,
    StorageArea, StorageAreaCreateDto
} from '../domain/types';

// --- New: internal role constants used by the SPA ---
export const InternalRole = {
    Administrator: 'Administrator',
    LogisticsOperator: 'LogisticsOperator',
    PortAuthorityOfficer: 'PortAuthorityOfficer',
    ShippingAgentRep: 'ShippingAgentRepresentative',
} as const;

export type InternalRoleValue = typeof InternalRole[keyof typeof InternalRole];

// 1. Create a central instance of Axios
const apiClient = axios.create({
    baseURL: (import.meta.env.REACT_APP_API_URL as string | undefined) ?? (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5273/api',
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

export const getAllDocks = async (): Promise<Dock[]> => {
    try {
        const response = await apiClient.get<Dock[]>(`/Dock`);
        return response.data;
    } catch (error) {
        console.error('Error fetching dock:', error);
        throw error;
    }
};

export const createDock = async (dockData: DockCreateDto): Promise<Dock> => {
    try {
        const response = await apiClient.post<Dock>(`/Dock`, dockData);
        return response.data;
    } catch (error) {
        console.error('Error creating dock:', error);
        throw error;
    }
};

// --- Storage Areas (Port Facilities) ---
export const getAllStorageAreas = async (): Promise<StorageArea[]> => {
    try {
        const response = await apiClient.get<StorageArea[]>(`/StorageArea`);
        return response.data;
    } catch (error) {
        console.error('Error fetching storage areas:', error);
        throw error;
    }
};

export const createStorageArea = async (data: StorageAreaCreateDto): Promise<StorageArea> => {
    try {
        const response = await apiClient.post<StorageArea>(`/StorageArea`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating storage area:', error);
        throw error;
    }
}



export const getAllShippingAgentOrganizations = async (): Promise<any[]> => {
    try {
        // Prefer the plural route used by the controllers/tests
        const response = await apiClient.get<any[]>(`/ShippingAgentOrganizations`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching shipping agent organizations (plural):', error?.message ?? error);
        // Fallback: try a singular variant in case the backend exposes the route with a slightly different name
        try {
            const fallbackResp = await apiClient.get<any[]>(`/ShippingAgentOrganization`);
            console.warn('Fetched shipping agent organizations using singular fallback route.');
            return fallbackResp.data;
        } catch (fallbackError) {
            console.error('Error fetching shipping agent organizations (singular fallback):', fallbackError);
            throw error; // rethrow original to preserve behaviour
        }
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

// PUT /api/ShippingAgentRepresentatives/{citizenId} - update representative by citizenId
export const updateShippingAgentRepresentativeByCitizenId = async (citizenId: string, dto: any): Promise<{ status: number; data: any }> => {
    try {
        const encoded = encodeURIComponent(citizenId);
        const response = await apiClient.put(`/ShippingAgentRepresentatives/${encoded}`, dto);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        console.error(`Error updating shipping agent representative ${citizenId}:`, error);
        throw error;
    }
}

// NEW: Delete representative by CitizenId (controller exposes DELETE /api/ShippingAgentRepresentatives/{citizenId})
export const deleteShippingAgentRepresentativeByCitizenId = async (citizenId: string): Promise<{ status: number; data: any }> => {
    try {
        // Citizen IDs may contain characters that need encoding
        const encoded = encodeURIComponent(citizenId);
        const response = await apiClient.delete(`/ShippingAgentRepresentatives/${encoded}`);
        // Return status/data so the UI can inspect server messages
        return { status: response.status, data: response.data };
    } catch (error: any) {
        console.error(`Error deleting shipping agent representative ${citizenId}:`, error);
        throw error;
    }
 }

// GET /api/ShippingAgentRepresentatives/{id} - fetch a single representative by GUID id
export const getShippingAgentRepresentativeById = async (id: string): Promise<any> => {
    try {
        const response = await apiClient.get(`/ShippingAgentRepresentatives/${encodeURIComponent(id)}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching shipping agent representative ${id}:`, error);
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

// --- Test helper: set to one of the keys below to simulate backend responses during development.
// Possible values: 'administrator', 'logistics', 'port', 'shipping', 'none', 'inactive', 'forbidden'
// Set to null to call the real backend endpoint.
export const TEST_ROLE_SCENARIO: string | null = null;

export const getMyRole = async (): Promise<{ role: string }> => {
    // If a test scenario is configured, return a mocked response for quick local testing
    if (TEST_ROLE_SCENARIO) {
        await new Promise((r) => setTimeout(r, 200)); // simulate latency
        switch (TEST_ROLE_SCENARIO) {
            case 'administrator':
                return { role: InternalRole.Administrator } as any;
            case 'logistics':
                return { role: InternalRole.LogisticsOperator } as any;
            case 'port':
                return { role: InternalRole.PortAuthorityOfficer } as any;
            case 'shipping':
                return { role: InternalRole.ShippingAgentRep } as any;
            case 'none':
                return { role: (null as unknown) as string };
            case 'inactive':
                // Simulate backend that returns role but also indicates inactive via another endpoint/flag.
                // The AuthProvider checks for `data.active === false`; since our mock shape is simple,
                // we throw an object that mimics an inactive response when consumed by AuthProvider.
                return { role: InternalRole.LogisticsOperator } as any;
            case 'forbidden':
                const err: any = new Error('Forbidden');
                err.response = { status: 403 };
                throw err;
            default:
                return { role: (null as unknown) as string };
        }
    }

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
        // ✅ This endpoint NOW REQUIRES authentication (Firebase token is attached by interceptor)
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
