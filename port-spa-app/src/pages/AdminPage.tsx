import React, { useState } from 'react';
import { assignUserRole } from '../services/apiService';

const AdminPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('LogisticsOperator');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const result = await assignUserRole(email, role);
            setMessage(`Success! User ${result.email} invited as ${result.role}. Status: ${result.status}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign role.');
        }
    };

    return (
        <div className="panel">
            <h1 className="text-2xl font-semibold mb-4">User Role Management</h1>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium">User Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 p-2 w-full border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Assign Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 p-2 w-full border rounded-lg"
                    >
                        <option value="LogisticsOperator">Logistics Operator</option>
                        <option value="PortAuthorityOfficer">Port Authority Officer</option>
                        <option value="ShippingAgentRepresentative">Shipping Agent Rep</option>
                        <option value="Administrator">Administrator</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary">Invite / Update User</button>

                {message && <div className="text-green-600">{message}</div>}
                {error && <div className="text-red-600">{error}</div>}
            </form>
        </div>
    );
};

export default AdminPage;