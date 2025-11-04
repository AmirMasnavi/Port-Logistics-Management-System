// src/components/layout/Header.tsx

import React, {useState, useEffect} from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';

// Import flags (Vite + TS friendly)
import gbFlag from '../../assets/gb.png';
import ptFlag from '../../assets/pt.png';

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
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

// Componente para o seletor de idioma
const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    // Use en/pt codes for i18n, map to flag images
    const [currentLang, setCurrentLang] = useState<string>(i18n.language?.startsWith('pt') ? 'pt' : 'en');

    useEffect(() => {
        // keep local state in sync if language changes elsewhere
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
    // 2. Extrair as funções e o estado de autenticação do hook
    const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
    const { t } = useTranslation();

    return (
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

                {/* 3. Mostrar a navegação apenas se o utilizador estiver autenticado */}
                {isAuthenticated && (
                    <nav className="hidden md:flex items-center gap-2">
                        <NavLink to="/" label={t('nav.dashboard')} />
                        <NavLink to="/vessel-types" label={t('nav.vesselTypes')} />
                        <NavLink to="/vessel-visits" label={t('nav.vesselVisits')} />
                    </nav>
                )}

                <div className="flex items-center gap-3">
                    {/* Language selector: available regardless of auth state */}
                    <LanguageSelector />

                    {/* 4. Gerir os diferentes estados: a carregar, autenticado, ou não autenticado */}
                    {isLoading ? (
                        // Mostra um placeholder enquanto o estado de login está a ser verificado
                        <div className="text-sm text-gray-500">{t('loading')}</div>
                    ) : isAuthenticated ? (
                        // Se estiver autenticado, mostra as ações do utilizador e o botão de logout
                        <>
                            <div className="relative hidden sm:block">
                                <input
                                    placeholder={t('search.placeholder')}
                                    className="px-3 py-2 rounded-lg border text-sm w-48 focus:outline-none focus:ring-2 focus:ring-maritime-500"
                                />
                            </div>
                            <button className="btn btn-primary">{t('button.new')}</button>
                            <span className="text-sm text-gray-700 hidden sm:block">
                                {t('greeting.hello', { name: user?.name ?? user?.email ?? '' })}
                            </span>
                            <button
                                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                            >
                                {t('button.logout')}
                            </button>
                        </>
                    ) : (
                        // Se não estiver autenticado, mostra apenas o botão de login
                        <button onClick={() => loginWithRedirect()} className="btn btn-primary">
                            {t('button.login')}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
