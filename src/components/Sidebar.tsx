import React from 'react';
import { Bell, BarChart3, Zap, User, CreditCard, HelpCircle, Plus, Globe, Settings } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { signOut } = useAuth();

  const menuItems = [
    {
      category: 'WORKSPACE',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'create-notification', label: 'Create New', icon: Plus },
        { id: 'sites', label: 'Sites', icon: Globe },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      category: 'TOOLS',
      items: [
        { id: 'integrations', label: 'Integrations', icon: Zap },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    },
    {
      category: 'ACCOUNT',
      items: [
       
        { id: 'help', label: 'Help', icon: HelpCircle },
      ]
    }
  ];

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-600">
          Dashboard
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {menuItems.map((category) => (
          <div key={category.category}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
              {category.category}
            </div>
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">Upgrade Plan</h4>
              <p className="text-xs text-gray-600">Get more features</p>
            </div>
          </div>
          <button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}