import { useState } from 'react';
import { Copy, ExternalLink, Zap } from 'lucide-react';

export function IntegrationGuide() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const integrationCode = `<script src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel.js" data-site-id="YOUR_SITE_ID" async defer></script>`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Integration Guide</h2>
        <p className="text-gray-600 mt-1">How to add the widget to your website.</p>
      </div>

      {/* Quick Start */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Pixel Installation</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Copy and paste this single line of code into the `&lt;head&gt;` section of your website's HTML.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{integrationCode}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(integrationCode, 'integration')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              {copiedCode === 'integration' && (
                <div className="absolute top-2 right-12 bg-green-600 text-white px-2 py-1 rounded text-xs">
                  Copied!
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Replace `YOUR_SITE_ID` with the actual ID of your site from the dashboard. This ensures the correct widgets are loaded.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Options */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Script Attributes</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attribute</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm font-mono text-gray-900">data-site-id</td>
                    <td className="px-4 py-2 text-sm text-green-600">Yes</td>
                    <td className="px-4 py-2 text-sm text-gray-600">Your unique Site ID.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Link */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">See It In Action</h3>
            <p className="text-gray-600">
              Check out the live demo to see how the widget works on a real website.
            </p>
          </div>
          <a
            href="/demo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Demo
          </a>
        </div>
      </div>
    </div>
  );
}