import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white border-t">
            <div className="container flex items-center justify-between h-14 text-sm text-gray-600">
                <div>© {new Date().getFullYear()} Port Authority</div>
                <div className="flex items-center gap-4">
                    <a className="hover:text-maritime-700" href="#">Privacy</a>
                    <a className="hover:text-maritime-700" href="#">Terms</a>
                    <a className="hover:text-maritime-700" href="#">Help</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
