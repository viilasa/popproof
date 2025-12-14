import { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Spinner } from './ui/Loaders';

export function Dashboard() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('notifications');
  const [widgetIdFromUrl, setWidgetIdFromUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check URL parameters for widget ID
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const widgetId = urlParams.get('widgetId');
      
      if (widgetId) {
        setWidgetIdFromUrl(widgetId);
        setActiveSection('edit-widget');
      }
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-surface-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header 
          onSectionChange={setActiveSection} 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>
      
      {/* Main Content Area with top padding for fixed header */}
      <div className="flex flex-1 overflow-hidden pt-14 sm:pt-16">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            setActiveSection(section);
            setIsMobileMenuOpen(false);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        {/* Main content - adjusted margin for new sidebar width */}
        <div className="flex-1 overflow-auto lg:ml-[260px] relative">
          {user && <MainContent 
            activeSection={activeSection} 
            userId={user.id} 
            onSectionChange={setActiveSection}
            initialWidgetId={widgetIdFromUrl} 
          />}
        </div>
      </div>
    </div>
  );
}