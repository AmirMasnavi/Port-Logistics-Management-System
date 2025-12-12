// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// 1. Define the new props the Footer receives
interface FooterProps {
    isSidebarVisible: boolean;
    isExpanded: boolean;
}

const Footer: React.FC<FooterProps> = ({ isSidebarVisible, isExpanded }) => {
    // Use a lightweight cast to avoid deep generic instantiation from react-i18next types
    const { t } = (useTranslation as unknown as () => { t: (key: string, fallback?: string) => string })();

    // 2. Calculate the dynamic styles (same as header)
    const footerStyle = isSidebarVisible
        ? (isExpanded ? 'md:ml-64 md:w-[calc(100%-16rem)]' : 'md:ml-20 md:w-[calc(100%-5rem)]')
        : 'w-full';

    return (
        // 3. Apply the styles
        <footer className={`fixed bottom-0 right-0 w-full bg-white border-t
                             transition-all duration-300 ease-in-out ${footerStyle}
                             z-40`}
        >
            <div className="container flex items-center justify-between h-14 text-sm text-gray-600 px-4">
                <div>© {new Date().getFullYear()} Port Authority</div>
                <div className="flex items-center gap-4">
                    <Link 
                        to="/privacy-policy" 
                        className="hover:text-blue-700 hover:underline flex items-center gap-1"
                        title={t('footer.privacyPolicy', 'Privacy Policy')}
                    >
                        🛡️ {t('footer.privacy', 'Privacy Policy')}
                    </Link>
                    <a className="hover:text-maritime-700" href="#">
                        {t('footer.terms', 'Terms')}
                    </a>
                    <a className="hover:text-maritime-700" href="#">
                        {t('footer.help', 'Help')}
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;