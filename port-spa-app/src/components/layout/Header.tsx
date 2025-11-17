// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../auth/AuthProvider';
import { t, changeLanguage, default as i18n } from '../../i18nClient';
import LoginModal from '../auth/LoginModal';
import ProfileModal from '../auth/ProfileModal';
import { User, ChevronDown, LogOut, Edit, KeyRound } from 'lucide-react';
import Menu from '../Menu'; // <-- import the Menu component
// 1. IMPORT FIREBASE FUNCTIONS
import { auth } from '../../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

// --- We need to pass new props to our dropdowns to manage their state ---
interface DropdownProps {
    isOpen: boolean;
    setIsOpen: () => void;
}

// 1. LanguageSelector component (UPDATED)
const LanguageSelector: React.FC<DropdownProps> = ({ isOpen, setIsOpen }) => {
    // use i18nClient to avoid react-i18next typing issues
    // i18n is the i18next instance imported from i18nClient
    const [currentLang, setCurrentLang] = useState<string>(i18n.language?.startsWith('pt') ? 'pt' : 'en');

    useEffect(() => {
        const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
        setCurrentLang(lang);
    }, [i18n.language]);

    const selectLang = (lang: string) => {
        setIsOpen(); // This will close the dropdown
        changeLanguage(lang);
    };

    const flags: Record<string, string> = { en: '🇺🇸', pt: '🇵🇹' };

    return (
        <div className="relative">
            <button
                onClick={setIsOpen} // Use prop to set state
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-maritime-250"
                title={t('header.changeLanguage')}
            >
                <span className="text-xl">{flags[currentLang]}</span>
                <span className="text-sm font-medium hidden sm:block">{currentLang.toUpperCase()}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-20">
                    <button
                        onClick={() => selectLang('en')}
                        className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 ${
                            currentLang === 'en' ? 'bg-maritime-650 text-white' : 'hover:bg-gray-100'
                        }`}
                    >
                        <span className="text-xl mr-2">🇺🇸</span>
                        {t('language.english')} {/* This will now render "English" or "Inglês" */}
                    </button>
                    <button
                        onClick={() => selectLang('pt')}
                        className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 ${
                            currentLang === 'pt' ? 'bg-maritime-650 text-white' : 'hover:bg-gray-100'
                        }`}
                    >
                        <span className="text-xl mr-2">🇵🇹</span>
                        {/* --- THIS WAS THE BUG. IT IS NOW FIXED. --- */}
                        {t('language.portuguese')} {/* This will now render "Portuguese" or "Português" */}
                    </button>
                </div>
            )}
        </div>
    );
};

const ProfileDropdown: React.FC<DropdownProps> = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    // 4. NEW STATE for password reset message
    const [resetMessage, setResetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const displayName = user?.displayName;
    const buttonText = displayName || t('header.profile');
    const photo = <User className="w-5 h-5 text-gray-600" />;

    const handleChangePassword = async () => {
        if (user && user.email) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                // 2. SET SUCCESS MESSAGE
                setResetMessage({type: 'success', text: t('header.passwordReset.sent')});
                setTimeout(() => setResetMessage(null), 3000); // 3-second delay
            } catch (error) {
                console.error("Error sending password reset email:", error);
                // 3. SET ERROR MESSAGE
                setResetMessage({type: 'error', text: t('header.passwordReset.failed')});
                setTimeout(() => setResetMessage(null), 3000); // 3-second delay
            }
        }
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={setIsOpen}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-maritime-250"
                    title={t('header.profile')}
                >
                    {photo}
                    <span className="text-sm font-medium hidden sm:block">
                        {buttonText}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20">
                        <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {displayName || t('header.noNameSet')}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.email}
                            </p>
                        </div>
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    setIsProfileModalOpen(true);
                                    setIsOpen(); // Close the dropdown
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Edit className="w-4 h-4" />
                                {t('header.editProfile')}
                            </button>
                            {/* --- 6. NEW BUTTON --- */}
                            <button
                                onClick={handleChangePassword}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <KeyRound className="w-4 h-4" />
                                {t('header.changePassword')}
                            </button>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                {t('button.logout')}
                            </button>
                        </div>
                        {/* --- 7. NEW MESSAGE AREA --- */}
                        {resetMessage && (
                            <div className={`px-4 py-2 text-xs text-center border-t ${
                                resetMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {resetMessage.text}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Render the modal */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </>
    );
};

// 3. Main Header Component (UPDATED)
interface HeaderProps {
    isSidebarVisible: boolean;
    isExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSidebarVisible, isExpanded }) => {
    const { isAuthenticated } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // --- NEW: State to manage dropdowns (Point 2) ---
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const headerStyle = isSidebarVisible
        ? (isExpanded ? 'md:ml-64 md:w-[calc(100%-16rem)]' : 'md:ml-20 md:w-[calc(100%-5rem)]')
        : 'w-full';

    return (
        <>
            <header
                className={`fixed top-0 right-0 bg-white border-b h-16
                            flex items-center justify-between px-6
                            transition-all duration-300 ease-in-out ${headerStyle}
                            z-40`}
            >
                <div className="flex items-center gap-3">
                    <BrandLogo />
                    <span className="text-lg font-bold text-maritime-800">{t('brand.title')}</span>
                </div>

                {/* Render the compact top menu when the sidebar is not visible (mobile view) */}
                {!isSidebarVisible && <Menu />}

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            {/* --- UPDATED: Pass state to children (Point 2) --- */}
                            <LanguageSelector
                                isOpen={openDropdown === 'lang'}
                                setIsOpen={() => setOpenDropdown(openDropdown === 'lang' ? null : 'lang')}
                            />
                            <ProfileDropdown
                                isOpen={openDropdown === 'profile'}
                                setIsOpen={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                            />
                        </>
                    ) : (
                        <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary">
                            {t('button.login')}
                        </button>
                    )}
                </div>
            </header>

            <div className="h-16" />

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
};

export default Header;

