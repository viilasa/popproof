import { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { HelpButton } from './HelpButton';

export function Dashboard() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('notifications');
  const [widgetIdFromUrl, setWidgetIdFromUrl] = useState<string | null>(null);
  
  // Check URL parameters for widget ID
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const widgetId = urlParams.get('widgetId');
      
      console.log('URL parameters:', urlParams.toString());
      console.log('Widget ID from URL:', widgetId);
      
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSectionChange={setActiveSection} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">
          {user && <MainContent 
            activeSection={activeSection} 
            userId={user.id} 
            onSectionChange={setActiveSection}
            initialWidgetId={widgetIdFromUrl} 
          />}
        </div>
      </div>
      <HelpButton />
    </div>
  );
}