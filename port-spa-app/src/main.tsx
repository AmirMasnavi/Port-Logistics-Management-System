// port-spa-app/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { AuthProvider } from './auth/AuthProvider'; // <-- IMPORT OUR NEW PROVIDER
import { initializeApi } from './services/apiService';


// Calling initializeApi early ensures that the interceptor is ready.
initializeApi();

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');

createRoot(container).render(
    <React.StrictMode>
        {/* Wrap the entire App in the AuthProvider */}
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);