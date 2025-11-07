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

    useEffect(() => {
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
                    const data = await getMyRole(); // Call our new API
                    setInternalRole(data.role); // e.g., "Administrator"
                } catch (error: any) {
                    // This happens if the user is 403 Forbidden (not in DB or deactivated)
                    console.error("Internal role check failed:", error.message);
                    setInternalRole(null);
                }
            } else {
                // No Firebase user, so no internal role
                setInternalRole(null);
            }
            setIsInternalLoading(false);
        };

        // Only fetch role *after* Firebase loading is done
        if (!isLoading) {
            setIsInternalLoading(true);
            fetchRole();
        }
    }, [user, isLoading]);

    const logout = async () => {
        await signOut(auth);
        setInternalRole(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        isInternalLoading,
        internalRole,
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