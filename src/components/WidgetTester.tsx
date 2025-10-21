import React, { useState } from 'react';
import { TestTube, Send, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1';

export function WidgetTester() {
  const [formData, setFormData] = useState({
    clientId: 'demo-client-123',
    eventType: 'purchase',
    userName: '',
    productName: '',
    location: '',
    value: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const eventData = {
      client_id: formData.clientId,
      event_type: formData.eventType,
      user_name: formData.userName,
      product_name: formData.productName || undefined,
      location: formData.location || undefined,
      value: formData.value ? parseFloat(formData.value) : undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/add-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setMessage('Event added successfully! Check the widget for the notification.');
        // Reset form
        setFormData(prev => ({
          ...prev,
          userName: '',
          productName: '',
          location: '',
          value: '',
        }));
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to add event');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error: ' + (error as Error).message);
    }
  };

  const generateSampleEvents = async () => {
    const sampleEvents = [
      {
        event_type: 'purchase',
        user_name: 'Alex Johnson',
        product_name: 'Pro Plan',
        location: 'San Francisco, CA',
        value: 49.99,
      },
      {
        event_type: 'signup',
        user_name: 'Sarah Miller',
        location: 'London, UK',
      },
      {
        event_type: 'download',
        user_name: 'Mike Chen',
        product_name: 'Free Guide',
        location: 'Toronto, Canada',
      },
    ];

    setStatus('loading');
    setMessage('Generating sample events...');

    for (let i = 0; i < sampleEvents.length; i++) {
      setTimeout(async () => {
        const eventData = {
          client_id: formData.clientId,
          timestamp: new Date().toISOString(),
          ...sampleEvents[i],
        };

        try {
          await fetch(`${API_BASE_URL}/add-event`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          });

          if (i === sampleEvents.length - 1) {
            setStatus('success');
            setMessage('Sample events generated successfully!');
          }
        } catch (error) {
          setStatus('error');
          setMessage('Failed to generate sample events');
        }
      }, i * 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Widget Tester</h2>
        <p className="text-gray-600 mt-1">Test your social proof widget by adding sample events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Form */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Test Event</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                id="eventType"
                value={formData.eventType}
                onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="purchase">Purchase</option>
                <option value="signup">Sign Up</option>
                <option value="download">Download</option>
                <option value="view">Product View</option>
                <option value="subscribe">Subscribe</option>
              </select>
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                User Name *
              </label>
              <input
                type="text"
                id="userName"
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (optional)
              </label>
              <input
                type="text"
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Premium Plan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="New York, USA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                Value (optional)
              </label>
              <input
                type="number"
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="29.99"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'loading' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Add Event
            </button>
          </form>

          {status !== 'idle' && (
            <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
              status === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : status === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {status === 'success' && <CheckCircle className="w-4 h-4" />}
              {status === 'error' && <XCircle className="w-4 h-4" />}
              {status === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
              <span className="text-sm">{message}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="space-y-4">
            <button
              onClick={generateSampleEvents}
              disabled={status === 'loading'}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Generate Sample Events
            </button>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">This will create 3 sample events:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Alex Johnson made a purchase (Pro Plan, $49.99)</li>
                <li>Sarah Miller signed up (London, UK)</li>
                <li>Mike Chen downloaded (Free Guide, Toronto)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Widget Preview</h4>
            <p className="text-sm text-gray-600 mb-3">
              The widget is currently running on this page. Events you create will appear as notifications in the bottom-left corner.
            </p>
            <div className="text-xs text-gray-500">
              <p>• Fetches events every 30 seconds</p>
              <p>• Shows notifications for 5 seconds</p>
              <p>• Maximum 3 concurrent notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}