import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-sm p-4">
            {/* We can add user info or auth buttons here later (for US 3.2.1) */}
            <h1 className="text-xl font-semibold text-gray-700">Port Operations Dashboard</h1>
        </header>
    );
};

export default Header;