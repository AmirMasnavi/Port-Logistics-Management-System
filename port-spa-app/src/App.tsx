// port-spa-app/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import VesselTypesPage from './pages/VesselTypesPage';
import VesselsPage from './pages/VesselsPage';
import VisualizationPage from './pages/VisualizationPage';
import ShippingAgentOrganization from "./pages/ShippingAgentOrganization.tsx";
import {setupApiInterceptor} from "./services/apiService.ts";
import AdminPage from './pages/AdminPage';
import ActivationPage from './pages/ActivationPage';
import VesselVisitsPage from './pages/VesselVisitsPage';
import CreateVvnPage from "./pages/CreateVvnPage.tsx";
import DockPage from './pages/DockPage';
import RequireAuth from './auth/RequireAuth';
import PortFacilitiesPage from './pages/PortFacilitiesPage';
import RoleProtectedRoute from './auth/RoleProtectedRoute'; // Our new component to check the user's role
import ResourcePage from './pages/ResourcePage';


// --- Centralized Permission Sets ---
import {
    canManagePort,
    canViewPlanning,
    isAdmin,
    canManageVVN, // Ensure this is exported from permissions.ts
    canViewVisualization
} from './auth/permissions';
import Dashboard from './pages/Dashboard';


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
                   

                    {/* --- Protected Route Group --- */}
                    {/* All routes inside this group first check if the user is authenticated.
                        The <RequireAuth> component acts as a gatekeeper. If the user is not
                        logged in, it will likely redirect them to the login page. */}

                    <Route element={<RequireAuth />}>

                        {/* --- Routes accessible to ALL authenticated users --- */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/vessel-visits" element={<VesselVisitsPage />} />

                        {/* --- Role-Protected Routes for Visualization --- */}
                        <Route element={<RoleProtectedRoute allowedRoles={canViewVisualization} />}>
                            <Route path="/visualization" element={<VisualizationPage />} />
                        </Route>

                        {/* --- Role-Protected Routes for Port Managers (Admin, Officer) --- */}
                        <Route element={<RoleProtectedRoute allowedRoles={canManagePort} />}>
                            <Route path="/vessel-types" element={<VesselTypesPage />} />
                            <Route path="/vessels" element={<VesselsPage />} />
                            <Route path="/shippingagentorganization" element={<ShippingAgentOrganization />} />
                        </Route>

                        {/* --- Role-Protected Routes for Planners (Admin, Officer, Logistics) --- */}
                        <Route element={<RoleProtectedRoute allowedRoles={canViewPlanning} />}>
                            <Route path="/port-facilities" element={<PortFacilitiesPage />} />
                            {/* Assuming Docks fall under the same planning permissions */}
                            <Route path="/docks" element={<DockPage />} /> 
                            <Route path="/resources" element={<ResourcePage />} />
                        </Route>

                        {/* --- Role-Protected Routes for VVN Management (Admin, Agent) --- */}
                        <Route element={<RoleProtectedRoute allowedRoles={canManageVVN} />}>
                            <Route path="/vessel-visits/new" element={<CreateVvnPage />} /> 
                            <Route path="/vessel-visits/edit/:id" element={<CreateVvnPage />} /> 
                            {/* NOTE: Your current implementation uses a Modal, not a separate page.
                                 If you switch to separate pages, you can uncomment these routes. */}
                        </Route>
                        
                        {/* --- Role-Protected Routes for Administrators ONLY --- */}
                        <Route element={<RoleProtectedRoute allowedRoles={isAdmin} />}>
                            <Route path="/admin/users" element={<AdminPage />} />
                        </Route>
                    </Route>
                </Routes>
            </Layout>
        </BrowserRouter>
    );    
}

export default App;