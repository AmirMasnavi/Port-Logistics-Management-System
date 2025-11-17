// This file NOW ONLY contains the central axios instance and its interceptors.
// All other API calls will be moved to their own repository files.

import axios, {type AxiosResponse, type InternalAxiosRequestConfig} from 'axios';
import { auth } from '../../firebaseConfig';
import {onAuthStateChanged, signOut, type User} from 'firebase/auth';

// 1. Create a central instance of Axios
export const apiClient = axios.create({
    baseURL: 'http://localhost:5273/api',
    timeout: 15000,
});

// (All the interceptor logic stays here: getAccessToken, isRefreshing, queuedRequests, initializeApi)
// ...
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
// ... (isRefreshing, refreshPromise, queuedRequests, processQueue) ...
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const queuedRequests: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
    while (queuedRequests.length) {
        const cb = queuedRequests.shift();
        if (cb) cb(token);
    }
};


export const initializeApi = () => {
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

    apiClient.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: any) => {
            const originalRequest = (error?.config ?? {}) as any;
            const status = error?.response?.status;

            if (status === 401 && !originalRequest._retry) {
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
                    processQueue(freshToken);
                    if (!originalRequest.headers) originalRequest.headers = {};
                    (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${freshToken}`;
                    return apiClient(originalRequest);
                }

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