// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, inMemoryPersistence, onIdTokenChanged} from "firebase/auth";

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

(async () => {
    try {
        await setPersistence(auth, inMemoryPersistence);
    } catch (err) {
        console.warn("Could not set inMemoryPersistence for Firebase Auth:", err);
    }
    const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes
    let refreshTimer: number | null = null;

    const refreshToken = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            await user.getIdToken(true); // force refresh
            // console.debug("Firebase ID token refreshed");
        } catch (e) {
            console.warn("Failed to refresh Firebase ID token:", e);
        }
    };
    
    
    onIdTokenChanged(auth, (user) => {
        if (user) {
            // Refresh immediately then start periodic refresh
            refreshToken();
            if (refreshTimer !== null) {
                clearInterval(refreshTimer);
            }
            refreshTimer = window.setInterval(refreshToken, REFRESH_INTERVAL);
        } else {
            if (refreshTimer !== null) {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }
        }
    });
})();

export default app;