// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (from Step 1)
const firebaseConfig = {
    apiKey: "AIzaSyBBEca-t-cn7ldAaF3nTRoJh3SMF9GeSxM",
    authDomain: "blueport-508e6.firebaseapp.com",
    projectId: "blueport-508e6",
    storageBucket: "blueport-508e6.firebasestorage.app",
    messagingSenderId: "915540943489",
    appId: "1:915540943489:web:cf319166efe0e712cf2380",
    measurementId: "G-FRCQDMP501"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth instance
export const auth = getAuth(app);

export const getAuthToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
        // forceRefresh: true garante que obtemos um token válido mesmo que esteja prestes a expirar
        return await user.getIdToken(true);
    }
    return null;
};

export default app;