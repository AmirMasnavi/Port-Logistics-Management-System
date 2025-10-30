import React, { useState, useEffect } from 'react';
import { getAllVesselTypes } from '../services/apiService';
import type {VesselType} from '../types'; // Import the type
// Import the type

const VesselTypesPage: React.FC = () => {
    // State is now strongly-typed
    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllVesselTypes();
                setVesselTypes(data);
            } catch (err) {
                setError('Failed to fetch data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Using Tailwind classes for styling
    return (
        <div className="max-w-3xl mx-auto my-10 p-6 bg-gray-50 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-center mb-6">Vessel Types</h1>
            {loading && <div className="text-center">Loading...</div>}
            {error && <div className="text-center text-red-600">{error}</div>}
            {!loading && !error && (
                <ul className="list-none p-0">
                    {vesselTypes.map(type => (
                        <li key={type.id} className="bg-white mb-3 p-4 rounded-md shadow-sm border border-gray-200">
                            <strong className="text-lg text-blue-700">{type.name}</strong>
                            <div className="text-gray-600 mt-1">{type.description}</div>
                            <div className="text-sm text-gray-500 mt-2">
                                Capacity: {type.capacity} TEUs | Dims: {type.maxRows}r x {type.maxBays}b x {type.maxTiers}t
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default VesselTypesPage;