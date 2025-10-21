import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, Eye, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PixelDashboardProps {
  selectedSite: {
    id: string;
    name: string;
    domain: string | null;
    pixel_code?: string;
    verification_status?: string;
    last_ping?: string;
  } | null;
}

interface VerificationEvent {
  id: string;
  status: string;
  verified_at: string;
  user_agent: string;
  ip_address: string;
}

interface EventData {
  id: string;
  event_type: string;
  url: string;
  timestamp: string;
  session_id: string;
}

export function PixelDashboard({ selectedSite }: PixelDashboardProps) {
  const [verificationEvents, setVerificationEvents] = useState<VerificationEvent[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Real-time subscription to verification events
  useEffect(() => {
    if (!selectedSite?.id) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch verification events
      const { data: verifications } = await supabase
        .from('pixel_verifications')
        .select('*')
        .eq('site_id', selectedSite.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('site_id', selectedSite.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      setVerificationEvents(verifications || []);
      setRecentEvents(events || []);
      setIsLoading(false);
    };

    fetchData();

    // Set up real-time subscriptions
    const verificationChannel = supabase
      .channel('pixel_verifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pixel_verifications', filter: `site_id=eq.${selectedSite.id}` },
        (payload) => {
          console.log('Verification event:', payload);
          fetchData(); // Refresh data
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('events')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `site_id=eq.${selectedSite.id}` },
        (payload) => {
          console.log('New event:', payload);
          fetchData(); // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(verificationChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [selectedSite?.id]);

  const copyPixelCode = async () => {
    if (!selectedSite?.pixel_code) return;
    
    const pixelScript = `<script src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" data-site-id="${selectedSite.id}" async defer></script>`;
    
    try {
      await navigator.clipboard.writeText(pixelScript);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!selectedSite) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Select a site to view pixel dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{selectedSite.name}</h2>
          <p className="text-gray-600">{selectedSite.domain}</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedSite.verification_status === 'verified' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="font-medium">Verified</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <AlertCircle className="w-5 h-5 mr-1" />
              <span className="font-medium">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Pixel Code Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Pixel Installation Code</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
          <code>{`<script src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" data-site-id="${selectedSite.id}" async defer></script>`}</code>
        </div>
        <button
          onClick={copyPixelCode}
          className="mt-3 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copiedCode ? 'Copied!' : 'Copy Code'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{recentEvents.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verifications</p>
              <p className="text-2xl font-bold text-gray-900">{verificationEvents.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Ping</p>
              <p className="text-sm font-bold text-gray-900">
                {selectedSite.last_ping ? new Date(selectedSite.last_ping).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Events</h3>
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading events...</p>
            </div>
          ) : recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{event.event_type}</p>
                    <p className="text-sm text-gray-600">{event.url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">{event.session_id?.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No events yet. Install the pixel to start tracking.</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Verification History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {verificationEvents.length > 0 ? (
            verificationEvents.map((verification) => (
              <div key={verification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {verification.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        Verification {verification.status}
                      </p>
                      <p className="text-sm text-gray-600">{verification.ip_address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(verification.verified_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No verification attempts yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
