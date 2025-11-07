import React, { useState, useEffect } from 'react';
import { getAllShippingAgentOrganizations } from '../services/apiService';

interface ShippingAgentOrganization {
    id: string;
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
    representativeName?: string;
    representativeCitizenId?: string;
    [key: string]: any;
}

interface Representative {
    id: string; // unique id for table row (could be orgId + citizenId)
    name: string;
    citizenId: string;
    organizationName?: string;
    organizationId?: string;
    email?: string;
    phone?: string;
}

// Simple actions icon to align with VesselTypesPage style
const DotsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
);

const ShippingAgentOrganization: React.FC = () => {
    const [orgs, setOrgs] = useState<ShippingAgentOrganization[]>([]);
    const [reps, setReps] = useState<Representative[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'organizations' | 'representatives'>('organizations');
    const [query, setQuery] = useState('');

    const buildRepresentatives = (array: ShippingAgentOrganization[]): Representative[] =>
        array
            .filter((o) => (o.representativeName || o.representativeCitizenId))
            .map((o) => ({
                id: `${o.id}::${o.representativeCitizenId ?? o.representativeName ?? ''}`,
                name: o.representativeName ?? '-',
                citizenId: o.representativeCitizenId ?? '-',
                organizationName: o.name,
                organizationId: o.id,
                email: o.email,
                phone: o.phone,
            }));

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllShippingAgentOrganizations();
            const array = Array.isArray(data) ? data : [];
            setOrgs(array);
            setReps(buildRepresentatives(array));
        } catch (err) {
            setError('Failed to fetch data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refresh when switching tabs to ensure up-to-date view
    useEffect(() => {
        fetchOrgs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    // Client-side filtering similar to VesselTypesPage search bar usage
    const normalized = (v?: string) => (v ?? '').toString().toLowerCase();
    const filteredOrgs = orgs.filter(o => {
        const q = normalized(query);
        return (
            normalized(o.name).includes(q) ||
            normalized(o.address).includes(q) ||
            normalized(o.email).includes(q) ||
            normalized(o.phone).includes(q) ||
            normalized(o.representativeName).includes(q) ||
            normalized(o.representativeCitizenId).includes(q)
        );
    });

    const filteredReps = reps.filter(r => {
        const q = normalized(query);
        return (
            normalized(r.name).includes(q) ||
            normalized(r.citizenId).includes(q) ||
            normalized(r.organizationName).includes(q) ||
            normalized(r.organizationId).includes(q) ||
            normalized(r.email).includes(q) ||
            normalized(r.phone).includes(q)
        );
    });

    return (
        <div className="container mt-6">
            <div className="panel">
                {/* Header with tabs */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Shipping Agents</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView('organizations')}
                            className={`px-3 py-1 rounded ${view === 'organizations' ? 'bg-maritime-100 text-maritime-800' : 'bg-white text-gray-700 hover:bg-maritime-50'}`}
                        >
                            Organizations
                        </button>
                        <button
                            onClick={() => setView('representatives')}
                            className={`px-3 py-1 rounded ${view === 'representatives' ? 'bg-maritime-100 text-maritime-800' : 'bg-white text-gray-700 hover:bg-maritime-50'}`}
                        >
                            Representatives
                        </button>
                    </div>
                </div>

                {/* Search bar like VesselTypesPage */}
                <div className="flex mb-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={view === 'organizations' ? 'Search by name, address, contact, representative...' : 'Search by name, citizen ID, organization, contact...'}
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
                    />
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-maritime-100">
                            {view === 'organizations' ? (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Representative</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Citizen ID</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-maritime-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Citizen ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Organization</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-maritime-700 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-maritime-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && (
                                <tr>
                                    <td colSpan={view === 'organizations' ? 6 : 5} className="text-center py-4">Loading...</td>
                                </tr>
                            )}
                            {error && (
                                <tr>
                                    <td colSpan={view === 'organizations' ? 6 : 5} className="text-center py-4 text-red-600">{error}</td>
                                </tr>
                            )}
                            {!loading && !error && view === 'organizations' && (
                                filteredOrgs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">No organizations found.</td>
                                    </tr>
                                ) : (
                                    filteredOrgs.map(org => (
                                        <tr key={org.id} className="hover:bg-maritime-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name ?? org.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.address ?? '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.phone ? `${org.phone}${org.email ? ' • ' + org.email : ''}` : (org.email ?? '-')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.representativeName ?? '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{org.representativeCitizenId ?? '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-gray-400 hover:text-gray-600"><DotsIcon /></button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                            {!loading && !error && view === 'representatives' && (
                                filteredReps.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4">No representatives found.</td>
                                    </tr>
                                ) : (
                                    filteredReps.map(rep => (
                                        <tr key={rep.id} className="hover:bg-maritime-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.citizenId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.organizationName ?? rep.organizationId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rep.phone ? `${rep.phone}${rep.email ? ' • ' + rep.email : ''}` : (rep.email ?? '-')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-gray-400 hover:text-gray-600"><DotsIcon /></button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShippingAgentOrganization;

