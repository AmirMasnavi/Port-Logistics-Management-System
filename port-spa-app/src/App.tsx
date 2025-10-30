import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import VesselTypesPage from './pages/VesselTypesPage';

// We can create a simple placeholder for the dashboard page
const DashboardPage = () => <div className="text-xl">Welcome to the Port Authority Dashboard!</div>;

// Placeholder for the page we will build in US 3.1.5
const VesselVisitsPage = () => <div className="text-xl">Vessel Visits Page (Coming Soon!)</div>;

function App() {
    return (
        <BrowserRouter>
            {/* The Layout now wraps all our pages */}
            <Layout>
                {/* Routes define which page component to show based on the URL */}
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/vessel-types" element={<VesselTypesPage />} />
                    <Route path="/vessel-visits" element={<VesselVisitsPage />} />
                    {/* We will add more routes here for Docks, Resources, etc. */}
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;