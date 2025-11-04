// port-spa-app/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react'; // Importe o provider
import App from './App';
import './index.css';
import './i18n'; // initialize i18n

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');

createRoot(container).render(
    <React.StrictMode>
        <Auth0Provider
            domain="dev-0uq1szwd0irgwj6z.us.auth0.com" 
            clientId="eo8mPC3PZpVE9j5XohbGO2G1AGbsqTLo" 
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: "https://port-api.app.com", 
            }}
        >
            <App />
        </Auth0Provider>
    </React.StrictMode>
);