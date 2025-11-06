import React from 'react';
import PortScene from '../components/visualization/PortScene';

const VisualizationPage: React.FC = () => {
    // TypeScript understands the type for the `style` prop (React.CSSProperties)
    const containerStyle: React.CSSProperties = {
        height: 'calc(100vh - 120px)', // Adjusted for title and text
        width: '100%',
        border: '1px solid #ccc',
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>3D Port Visualization</h2>
            <p>Use your mouse to navigate the scene: right-click to pan, scroll to zoom, left-click to rotate.</p>
            <div style={containerStyle}>
                <PortScene />
            </div>
        </div>
    );
};

export default VisualizationPage;