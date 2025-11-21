import axios, {type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import { auth } from '../firebaseConfig';
import {onAuthStateChanged, signOut, type User} from 'firebase/auth';

// Imports de tipos (Domain & DTOs)
import type {
    VesselType,
    VesselTypeCreateDto,
    PortLayout,
    VesselVisit,
    Dock,
    DockCreateDto,
} from '../domain/types';


// --- Internal Role Constants ---
export const InternalRole = {
    Administrator: 'Administrator',
    LogisticsOperator: 'LogisticsOperator',
    PortAuthorityOfficer: 'PortAuthorityOfficer',
    ShippingAgentRep: 'ShippingAgentRepresentative',
} as const;

export type InternalRoleValue = typeof InternalRole[keyof typeof InternalRole];

// --- 1. Configuração Central do Axios ---

// Determina a URL base. 
// 1. Tenta VITE_API_BASE_URL (definido no .env)
// 2. Fallback para localhost:5273 (padrão .NET)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5273/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // Aumentado para 30s para evitar timeouts em redes lentas ou debug
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- 2. Auth Helpers & Interceptores ---

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

// Variáveis para gestão de Refresh Token
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
type QueuedCallback = (token: string | null) => void;
const queuedRequests: QueuedCallback[] = [];

const processQueue = (token: string | null) => {
    while (queuedRequests.length) {
        const cb = queuedRequests.shift();
        if (cb) {
            try { cb(token); } catch (e) { /* swallow per-request callback errors */ }
        }
    }
};

let interceptorsInitialized = false;

export const initializeApi = () => {
    if (interceptorsInitialized) return;
    interceptorsInitialized = true;
    // Request Interceptor: Adiciona o Token Bearer
    apiClient.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            try {
                const token = await getAccessToken();
                if (token) {
                    if (!config.headers) config.headers = {} as any;
                    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
                }
            } catch (e) {
                // Não bloquear a request se não for possível obter token
                console.error('Unable to obtain access token', e);
            }
            return config;
        },
        (error: any) => Promise.reject(error)
    );

    // Response Interceptor: Lida com 401 (Refresh Token)
    apiClient.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: any) => {
            const originalRequest = (error?.config ?? {}) as any;
            const status = error?.response?.status;

            // Se der erro de rede/timeout, lança logo para ser apanhado pelo catch do componente
            if (!error.response) {
                return Promise.reject(error);
            }

            // Apenas tratar 401 uma vez por request
            if (status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                if (isRefreshing) {
                    // Se já estamos a renovar, enfileira esta request e espera
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
                // Inicia refresh
                isRefreshing = true;

                refreshPromise = (async () => {
                    try {
                        const user = auth.currentUser;
                        if (!user) return null;
                        // Força o refresh do token no Firebase
                        const freshToken = await user.getIdToken(true); // força refresh
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
                    // Re-executa requests enfileiradas
                    processQueue(freshToken);
                    if (!originalRequest.headers) originalRequest.headers = {};
                    (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${freshToken}`;
                    try {
                        return apiClient(originalRequest);
                    } catch (err) {
                        return Promise.reject(err);
                    }
                }

                // Se não foi possível obter token novo -> limpa sessão e redireciona
                processQueue(null);
                try {
                    await signOut(auth);
                } catch (signOutErr) {
                    console.error('Failure to sign out', signOutErr);
                }
                // Navegar para login (page reload intencional)
                window.location.href = '/login';
                return Promise.reject(error);
            }
            // Para outros status, deixa o componente lidar (401 não tratado aqui já foi tratado)
            return Promise.reject(error);
        }
    );
};
export { apiClient };
export const setupApiInterceptor = initializeApi;

// --- 3. API Calls (Endpoints) ---

// Vessel Types
export const getAllVesselTypes = async (): Promise<VesselType[]> => {
    const response = await apiClient.get<VesselType[]>(`/VesselType`);
    return response.data;
};

export const createVesselType = async (vesselTypeData: VesselTypeCreateDto): Promise<VesselType> => {
    const response = await apiClient.post<VesselType>(`/VesselType`, vesselTypeData);
    return response.data;
};

// Docks
export const getAllDocks = async (): Promise<Dock[]> => {
    const response = await apiClient.get<Dock[]>(`/Dock`);
    return response.data;
};

export const createDock = async (dockData: DockCreateDto): Promise<Dock> => {
    const response = await apiClient.post<Dock>(`/Dock`, dockData);
    return response.data;
};

// Shipping Agents
export const getAllShippingAgentOrganizations = async (): Promise<any[]> => {
    try {
        const response = await apiClient.get<any[]>(`/ShippingAgentOrganizations`);
        return response.data;
    } catch (error: any) {
        // Fallback para singular caso o backend tenha mudado
        try {
            const fallbackResp = await apiClient.get<any[]>(`/ShippingAgentOrganization`);
            return fallbackResp.data;
        } catch {
            throw error;
        }
    }
};

export const getAllShippingAgentRepresentatives = async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/ShippingAgentRepresentatives`);
    return response.data;
};

export const createShippingAgentOrganization = async (dto: any): Promise<any> => {
    const response = await apiClient.post<any>(`/ShippingAgentOrganizations`, dto);
    return response.data;
};

export const createShippingAgentRepresentative = async (dto: any): Promise<any> => {
    const response = await apiClient.post<any>(`/ShippingAgentRepresentatives`, dto);
    return response.data;
};

// Representative Management
export const updateShippingAgentRepresentativeByCitizenId = async (citizenId: string, dto: any) => {
    const encoded = encodeURIComponent(citizenId);
    const response = await apiClient.put(`/ShippingAgentRepresentatives/${encoded}`, dto);
    return { status: response.status, data: response.data };
};

export const deleteShippingAgentRepresentativeByCitizenId = async (citizenId: string) => {
    const encoded = encodeURIComponent(citizenId);
    const response = await apiClient.delete(`/ShippingAgentRepresentatives/${encoded}`);
    return { status: response.status, data: response.data };
};

export const getShippingAgentRepresentativeById = async (id: string) => {
    const response = await apiClient.get(`/ShippingAgentRepresentatives/${encodeURIComponent(id)}`);
    return response.data;
};

// Admin
export const assignUserRole = async (email: string, role: string) => {
    const response = await apiClient.post('/admin/assign-role', { email, role });
    return response.data;
};

// Role Management & Activation
export const TEST_ROLE_SCENARIO: string | null = null;

export const getMyRole = async (): Promise<{ role: string }> => {
    if (TEST_ROLE_SCENARIO) {
        // Mock logic for dev testing
        await new Promise((r) => setTimeout(r, 200));
        switch (TEST_ROLE_SCENARIO) {
            case 'administrator': return { role: InternalRole.Administrator } as any;
            case 'logistics': return { role: InternalRole.LogisticsOperator } as any;
            case 'port': return { role: InternalRole.PortAuthorityOfficer } as any;
            case 'shipping': return { role: InternalRole.ShippingAgentRep } as any;
            case 'forbidden':
                const err: any = new Error('Forbidden');
                err.response = { status: 403 };
                throw err;
            default: return { role: (null as unknown) as string };
        }
    }

    const response = await apiClient.get('/auth/my-role');
    return response.data;
};

export const activateUserAccount = async (token: string) => {
    const response = await apiClient.get(`/auth/activate?token=${token}`);
    return response.data;
};

// Visualization & Resources
export const getPortLayout = async (layoutId: string): Promise<PortLayout> => {
    const response = await apiClient.get<PortLayout>(`/PortLayout/${layoutId}`);
    return response.data;
};

export const getApprovedVesselVisits = async (): Promise<VesselVisit[]> => {
    const response = await apiClient.get<VesselVisit[]>(`/notifications/search?status=Approved`);
    return response.data;
};


export const getVesselByImo = async (imo: string) => {
    const response = await apiClient.get(`/Vessel/${imo}`);
    return response.data;
};

export const getDockById = async (id: string) => {
    const response = await apiClient.get(`/Dock/${id}`);
    return response.data;
};

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    deactivatedUsers: number;
    totalStaffMembers: number;
    totalOrganizations: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/admin/stats');
    return response.data;
};