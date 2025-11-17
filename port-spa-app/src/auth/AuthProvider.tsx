/* eslint-disable react-refresh/only-export-components */
// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // We created this in the previous step
import { getMyRole } from '../services/apiService';

// Define the shape of our authentication context
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInternalLoading: boolean;
    internalRole: string | null;
    citizenId: string | null;
    roleStatus: 'unknown' | 'active' | 'inactive' | 'none';
    accessDeniedReason: string | null;
    logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInternalLoading, setIsInternalLoading] = useState(true);
    const [internalRole, setInternalRole] = useState<string | null>(null);
    const [citizenId, setCitizenId] = useState<string | null>(null);
    const [roleStatus, setRoleStatus] = useState<'unknown' | 'active' | 'inactive' | 'none'>('unknown');
    const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);

    useEffect(() => {
        // ✅ Track Firebase authentication state
        // (onAuthStateChanged listens for login/logout and sets user state)
        // This is the core of Firebase auth: it listens for changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchRole = async () => {
            if (user) {
                try {
                    // ✅ Call getMyRole() after Firebase authentication is confirmed
                    const data: any = await getMyRole(); // Call our new API

                    // Normalize response
                    const { role, citizenId: repCitizenId, active } = data ?? {};

                    // If backend returns { role: null | '' } -> deny access
                    if (!data || !role) {
                        setInternalRole(null);
                        setCitizenId(repCitizenId ?? null);                // <-- set ID even when no role (if provided)
                        setRoleStatus('none');
                        setAccessDeniedReason('Nenhuma role atribuída. Contacte o administrador.');
                    } else if (active === false) {
                        // If backend provides an "active" flag and it's false -> inactive
                        setInternalRole(role);
                        setCitizenId(repCitizenId ?? null);                // <-- set ID for inactive case
                        setRoleStatus('inactive');
                        setAccessDeniedReason('A sua role está inativa. Contacte o administrador.');
                    } else {
                        // role válida e ativa
                        setInternalRole(role);
                        setCitizenId(repCitizenId ?? null);                // <-- set ID for active case
                        setRoleStatus('active');
                        setAccessDeniedReason(null);
                    }
                } catch (error: any) {
                    console.error('Internal role check failed:', error?.message ?? error);

                    // Default deny case
                    setInternalRole(null);
                    setCitizenId(null);                                     // <-- ensure ID cleared on error
                    setRoleStatus('none');
                    setAccessDeniedReason('Erro ao verificar role interna.');

                    // If backend returned 403 (forbidden) treat as access denied and force logout
                    const status = (error?.response as any)?.status ?? (error?.status ?? null);
                    if (status === 403) {
                        try {
                            await logout();
                        } catch (e) {
                            console.error('Logout after 403 failed', e);
                        }
                        // Redirect to login (keeps UX consistent)
                        window.location.href = '/login';
                    }
                }
            } else {
                // No Firebase user, so no internal role
                setInternalRole(null);
                setCitizenId(null);                                         // <-- ensure ID cleared when no user
                setRoleStatus('none');
                setAccessDeniedReason(null);
            }
            // ✅ Expose isInternalLoading to block UI until role is resolved
            setIsInternalLoading(false);
        };

        // Only fetch role *after* Firebase loading is done
        if (!isLoading) {
            setIsInternalLoading(true);
            void fetchRole();
        }
    }, [user, isLoading]);

    // 🔄 Refresh automático do token a cada 50 minutos
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        // ✅ Periodic silent token refresh to avoid session expiration
        const setupTokenRefresh = (user: User) => {
            interval = setInterval(() => {
                user.getIdToken(true).catch((err) => {
                    console.error('Error when forcing token refresh:', err);
                });
            }, 50 * 60 * 1000); // 50 minutos
        };

        if (user) {
            setupTokenRefresh(user);
        }

        return () => {
            if (interval !== undefined) clearInterval(interval);
        };
    }, [user]);

    // ✅ Ensure logout clears both Firebase session and internal role state        
    const logout = async () => {
        await signOut(auth);
        setInternalRole(null);
        setCitizenId(null); // <-- Clear ID on logout
        setRoleStatus('none');
        setAccessDeniedReason(null);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        isInternalLoading, // exposed to consumers
        internalRole,      // exposed to consumers
        citizenId,         // <-- expose the citizenId
        roleStatus,
        accessDeniedReason,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

// Create the custom hook to easily access the context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};