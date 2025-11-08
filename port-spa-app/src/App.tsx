// port-spa-app/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import VesselTypesPage from './pages/VesselTypesPage';
import VisualizationPage from './pages/VisualizationPage';
import ShippingAgentOrganization from "./pages/ShippingAgentOrganization.tsx";
import {setupApiInterceptor} from "./services/apiService.ts";
import AdminPage from './pages/AdminPage';
import ActivationPage from './pages/ActivationPage';

// We can create a simple placeholder for the dashboard page
const DashboardPage = () => <div className="text-xl">Welcome to the Port Authority Dashboard!</div>;

// Placeholder for the page we will build in US 3.1.5
const VesselVisitsPage = () => <div className="text-xl">Vessel Visits Page (Coming Soon!)</div>;

const PortFacilitiesPage = () => <div className="text-xl">Port Facilities Page (Coming Soon!)</div>;

function App() {
    // All the auth logic is removed from here.
    // It's now handled by AuthProvider (in main.tsx) and apiService.ts.

    // We just need to make sure the interceptor is called once
    setupApiInterceptor();

    return (
        <BrowserRouter>
            {/* The Layout now wraps all our pages */}
            <Layout>
                {/* Routes define which page component to show based on the URL */}
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/vessel-types" element={<VesselTypesPage />} />
                    <Route path="/vessel-visits" element={<VesselVisitsPage />} />
                    <Route path="/shippingagentorganization" element={<ShippingAgentOrganization />} />
                    {/* We will add more routes here for Docks, Resources, etc. */}
                    <Route path="/port-facilities" element={<PortFacilitiesPage />} />

                    {/* Route for the 3D Visualization Page */}
                    <Route path="/visualization" element={<VisualizationPage />} />
                    <Route path="/admin/users" element={<AdminPage />} />
                    <Route path="/activate" element={<ActivationPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;