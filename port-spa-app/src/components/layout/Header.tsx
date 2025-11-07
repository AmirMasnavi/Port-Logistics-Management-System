// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../auth/AuthProvider'; // <-- IMPORT OUR NEW HOOK
import { useTranslation } from 'react-i18next';
import LoginModal from '../auth/LoginModal'; // <-- IMPORT THE LOGIN MODAL

// Import flags (Vite + TS friendly)
import gbFlag from '../../assets/gb.png';
import ptFlag from '../../assets/pt.png';

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    // ... (This component is unchanged)
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link
            to={to}
            className={`px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-maritime-100 text-maritime-800' : 'text-gray-700 hover:bg-maritime-50'}`}
        >
            {label}
        </Link>
    );
};

const LanguageSelector: React.FC = () => {
    // ... (This component is unchanged)
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState<string>(i18n.language?.startsWith('pt') ? 'pt' : 'en');

    useEffect(() => {
        const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
        setCurrentLang(lang);
    }, [i18n.language]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const selectLang = (lang: string) => {
        setCurrentLang(lang);
        setIsOpen(false);
        i18n.changeLanguage(lang);
    };

    const flags: Record<string, string> = {
        en: gbFlag,
        pt: ptFlag,
    };

    return (
        <div className="relative">
            <button onClick={toggleDropdown} className="flex items-center p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                <img src={flags[currentLang]} alt="language flag" className="w-6 h-6 rounded-full object-cover" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-20">
                    <button onClick={() => selectLang('en')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <img src={gbFlag} alt="English" className="w-5 h-5 mr-2 rounded-full" />
                        {t('language.english')}
                    </button>
                    <button onClick={() => selectLang('pt')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <img src={ptFlag} alt="Português" className="w-5 h-5 mr-2 rounded-full" />
                        {t('language.portuguese')}
                    </button>
                </div>
            )}
        </div>
    );
};

const Header: React.FC = () => {
    // 2. Use our new Firebase auth hook
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const { t } = useTranslation();

    // 3. Add state for the login modal
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <>
            <header className="w-full bg-white border-b">
                <div className="container flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <div className="brand">
                            <div className="brand-logo"><BrandLogo /></div>
                            <div className="hidden sm:block">
                                <div className="text-lg font-semibold">{t('brand.title')}</div>
                                <div className="text-xs text-gray-500">{t('brand.subtitle')}</div>
                            </div>
                        </div>
                    </div>

                    {isAuthenticated && (
                        <nav className="hidden md:flex items-center gap-2">
                            <NavLink to="/" label={t('nav.dashboard')} />
                            <NavLink to="/vessel-types" label={t('nav.vesselTypes')} />
                            <NavLink to="/vessel-visits" label={t('nav.vesselVisits')} />
                            <NavLink to="/visualization" label={t('nav.visualization', 'Visualization')} />
                        </nav>
                    )}

                    <div className="flex items-center gap-3">
                        <LanguageSelector />

                        {isLoading ? (
                            <div className="text-sm text-gray-500">{t('loading')}</div>
                        ) : isAuthenticated ? (
                            <>
                                <div className="relative hidden sm:block">
                                    <input
                                        placeholder={t('search.placeholder')}
                                        className="px-3 py-2 rounded-lg border text-sm w-48 focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                    />
                                </div>
                                <button className="btn btn-primary">{t('button.new')}</button>
                                <span className="text-sm text-gray-700 hidden sm:block">
                                    {/* 4. Get name from Firebase user object */}
                                    {t('greeting.hello', { name: user?.displayName ?? user?.email ?? '' })}
                                </span>
                                <button
                                    onClick={logout} // <-- Use Firebase logout
                                    className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                                >
                                    {t('button.logout')}
                                </button>
                            </>
                        ) : (
                            // 5. Open the modal instead of redirecting
                            <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary">
                                {t('button.login')}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* 6. Render the modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
};

export default Header;