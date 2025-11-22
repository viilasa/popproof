import { Bell, BarChart3, Zap, HelpCircle, Plus, Globe, Settings, X } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeSection, onSectionChange, isMobileMenuOpen, onClose }: SidebarProps) {

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

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-14 sm:top-16 bottom-0 left-0 z-40
          w-64 sm:w-72 lg:w-64
          bg-white border-r border-gray-200 
          flex flex-col
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:block">
          <div className="text-sm font-medium text-gray-600">
            Dashboard
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 overflow-y-auto">
          {menuItems.map((category) => (
            <div key={category.category}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4 px-2">
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 text-sm rounded-lg transition-all duration-200 group touch-manipulation min-h-[44px] sm:min-h-0 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
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
        <div className="p-3 sm:p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 border border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">Upgrade Plan</h4>
                <p className="text-xs text-gray-600">Get more features</p>
              </div>
            </div>
            <button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-medium py-2.5 px-3 rounded-md hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}