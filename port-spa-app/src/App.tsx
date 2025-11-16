// port-spa-app/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import VesselTypesPage from './pages/VesselTypesPage';
import VisualizationPage from './pages/VisualizationPage';
import ShippingAgentOrganization from "./pages/ShippingAgentOrganization.tsx";
import {setupApiInterceptor} from "./services/apiService.ts";
import AdminPage from './pages/AdminPage';
import ActivationPage from './pages/ActivationPage';
import VesselVisitsPage from './pages/VesselVisitsPage';
import DockPage from './pages/DockPage';
import RequireAuth from './auth/RequireAuth';
import CreateVvnPage from "./pages/CreateVvnPage.tsx"; // <-- protect routes
import PortFacilitiesPage from './pages/PortFacilitiesPage';

// We can create a simple placeholder for the dashboard page
const DashboardPage = () => <div className="text-xl">Welcome to the Port Authority Dashboard!</div>;

// Placeholder for the page we will build in US 3.1.5
// const VesselVisitsPage = () => <div className="text-xl">Vessel Visits Page (Coming Soon!)</div>;


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
                    {/* Public route (activation) */}
                    <Route path="/activate" element={<ActivationPage />} />

                    {/* Protected routes (require authenticated user with active internal role) */}
                    <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                    <Route path="/vessel-types" element={<RequireAuth><VesselTypesPage /></RequireAuth>} />
                    <Route path="/vessel-visits" element={<RequireAuth><VesselVisitsPage /></RequireAuth>} />
                    <Route path="/docks" element={<RequireAuth><DockPage /></RequireAuth>} />
                    <Route path="/shippingagentorganization" element={<RequireAuth><ShippingAgentOrganization /></RequireAuth>} />
                    <Route path="/port-facilities" element={<RequireAuth><PortFacilitiesPage /></RequireAuth>} />
                    <Route path="/visualization" element={<RequireAuth><VisualizationPage /></RequireAuth>} />
                    <Route path="/admin/users" element={<RequireAuth><AdminPage /></RequireAuth>} />
                    <Route path="/vessel-visits/new" element={<RequireAuth><CreateVvnPage /></RequireAuth>} />
                    <Route path="/vessel-visits/edit/:id" element={<RequireAuth><CreateVvnPage /></RequireAuth>} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;