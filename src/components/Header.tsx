import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Bell, Globe, ChevronDown, Plus, Languages, User, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

export function Header() {
  const { user, signOut } = useAuth();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
    setShowUserDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 z-10">
      <div className="flex items-center justify-between h-full px-6 max-w-full">
        {/* Left side - Logo and site info */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">PopProof</span>
              <p className="text-xs text-gray-500 -mt-1">Social Proof Platform</p>
            </div>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-4">
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
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
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
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
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
                      // Navigate to profile page - you can implement this
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
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
    </header>
  );
}