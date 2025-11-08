// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../auth/AuthProvider';
import { useTranslation } from 'react-i18next';
import LoginModal from '../auth/LoginModal';
import ProfileModal from '../auth/ProfileModal';
import { User, ChevronDown, LogOut, Edit } from 'lucide-react';

// --- We need to pass new props to our dropdowns to manage their state ---
interface DropdownProps {
    isOpen: boolean;
    setIsOpen: () => void;
}

// 1. LanguageSelector component (UPDATED)
const LanguageSelector: React.FC<DropdownProps> = ({ isOpen, setIsOpen }) => {
    const { i18n, t } = useTranslation();
    const [currentLang, setCurrentLang] = useState<string>(i18n.language?.startsWith('pt') ? 'pt' : 'en');

    useEffect(() => {
        const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
        setCurrentLang(lang);
    }, [i18n.language]);

    const selectLang = (lang: string) => {
        setIsOpen(); // This will close the dropdown
        i18n.changeLanguage(lang);
    };

    const flags: Record<string, string> = { en: '🇺🇸', pt: '🇵🇹' };

    return (
        <div className="relative">
            <button
                onClick={setIsOpen} // Use prop to set state
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-maritime-250"
                title="Change language"
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

// 2. ProfileDropdown Component (UPDATED)
const ProfileDropdown: React.FC<DropdownProps> = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // --- UPDATED This logic for the name (Point 4) ---
    const displayName = user?.displayName; // Just the display name
    const buttonText = displayName || "Profile"; // Show name, or "Profile" as fallback

    // --- UPDATED This logic (Point 3) ---
    // We removed the photoURL, so we just show the User icon
    const photo = <User className="w-5 h-5 text-gray-600" />;

    return (
        <>
            <div className="relative">
                <button
                    onClick={setIsOpen} // Use prop to set state
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-maritime-250"
                    title="Profile"
                >
                    {photo}
                    <span className="text-sm font-medium hidden sm:block">
                        {buttonText} {/* --- UPDATED (Point 4) --- */}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20">
                        <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {displayName || "No Name Set"}
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
                                Edit Profile
                            </button>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
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
                    <span className="text-lg font-bold text-maritime-800">BluePORT</span>
                </div>

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
                            Login
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