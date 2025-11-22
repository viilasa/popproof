import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Languages, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

interface HeaderProps {
  onSectionChange?: (section: string) => void;
  onMenuToggle?: () => void;
}

export function Header({ onSectionChange, onMenuToggle }: HeaderProps = {}) {
  const { user, signOut } = useAuth();
  const { toast, hideToast, success } = useToast();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'French' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'tr', name: 'Turkish' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (language: { code: string; name: string }) => {
    setSelectedLanguage(language.name);
    setShowLanguageDropdown(false);
  };

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    setShowUserDropdown(false);
    await signOut();
    success('Successfully signed out');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex-shrink-0 z-20">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6 max-w-full">
        {/* Left side - Burger menu and Logo */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Burger Menu Button - Mobile Only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg sm:text-xl font-bold text-gray-900">ProofEdge</span>
              <p className="text-xs text-gray-500 -mt-1 hidden md:block">Social Proof Platform</p>
            </div>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="hidden md:flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Languages className="w-4 h-4" />
              <span>{selectedLanguage}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLanguageDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedLanguage === language.name 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700'
                      }`}
                    >
                      {language.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 sm:space-x-3 hover:bg-gray-50 rounded-lg p-1.5 sm:p-2 transition-colors touch-manipulation"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-sm">
                {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-sm text-left">
                <div className="text-gray-900 font-semibold">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-gray-500 text-xs truncate max-w-32">
                  {user?.email}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hidden sm:block" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSectionChange?.('settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowSignOutModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={hideToast}
      />
    </header>
  );
}