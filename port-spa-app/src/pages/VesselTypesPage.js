// port-spa-app/src/pages/VesselTypesPage.js
import React, { useState, useEffect } from 'react';
import { getAllVesselTypes } from '../services/apiService';

const VesselTypesPage = () => {
    const [vesselTypes, setVesselTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div style={{
            maxWidth: '800px',
            margin: '40px auto',
            padding: '24px',
            background: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Vessel Types</h1>
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {!loading && !error && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {vesselTypes.map(type => (
                        <li key={type.id} style={{
                            background: '#fff',
                            marginBottom: '12px',
                            padding: '16px',
                            borderRadius: '6px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                        }}>
                            <strong>{type.name}</strong>
                            <div style={{ color: '#555', marginTop: '4px' }}>{type.description}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default VesselTypesPage;