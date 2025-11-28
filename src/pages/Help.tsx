import { useState } from 'react';
import { 
  Book, 
  Zap, 
  Globe, 
  Bell, 
  BarChart3, 
  Code, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Search,
  ShoppingBag,
  Users,
  Star,
  Activity,
  FileText,
  ShoppingCart,
  Eye,
  Palette,
  Clock,
  CheckCircle,
  ArrowRight,
  Copy,
  HelpCircle,
  MessageSquare,
  Mail
} from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function Help() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const faqs: FAQItem[] = [
    {
      question: "How do I install the pixel on my website?",
      answer: "Go to Sites → Select your site → Click 'Setup Pixel'. Copy the provided script tag and paste it in the <head> section of your website. For platforms like WordPress, Shopify, or WooCommerce, use the platform-specific integration guides provided."
    },
    {
      question: "Why aren't my notifications showing?",
      answer: "Check the following: 1) Ensure the pixel is correctly installed and verified (green status). 2) Make sure you have at least one active widget. 3) Verify that events are being tracked (check Analytics). 4) Check if the widget's display settings (pages, timing) match your test conditions."
    },
    {
      question: "How do I track purchases from WooCommerce?",
      answer: "In the Sites section, select your site and click 'Setup Pixel'. Choose WooCommerce from the integration options. You'll need to install our WooCommerce plugin or use the webhook integration. The system will automatically track purchases, including customer name, product, and value."
    },
    {
      question: "Can I customize the notification appearance?",
      answer: "Yes! Click on any widget to open the editor. You can customize colors, fonts, border radius, shadows, position, animation style, and more. Use the live preview to see changes in real-time."
    },
    {
      question: "What's the difference between impressions and unique viewers?",
      answer: "Impressions count every time a notification is displayed to any visitor. Unique viewers count individual visitors who saw at least one notification, regardless of how many times they saw it."
    },
    {
      question: "How do I show notifications only on specific pages?",
      answer: "In the widget editor, go to Display Settings → Page Targeting. You can set rules to show notifications on all pages, specific URLs, or URLs matching certain patterns."
    },
    {
      question: "Can I use PopProof on multiple websites?",
      answer: "Yes! You can add multiple sites from the Sites section. Each site gets its own unique pixel code and can have different widgets configured."
    },
    {
      question: "How do I integrate Google Reviews?",
      answer: "In the Sites section, select your site and click 'Setup Pixel'. Choose Google Reviews integration. You'll need your Google Place ID and a Google Places API key. Once configured, customer reviews will automatically appear as notifications."
    },
    {
      question: "What notification templates are available?",
      answer: "We offer 8 template types: Recent Purchase, New Signup, Customer Reviews, Live Visitors, Form Submission, Cart Activity, Active Sessions, and Recent Activity. Each template is optimized for specific use cases."
    },
    {
      question: "How do I test if my pixel is working?",
      answer: "After installing the pixel, click 'Verify Installation' in the pixel setup page. You can also open your website in a new tab - if the pixel is working, you'll see a green 'Active' status in your dashboard."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    searchQuery === '' || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            Welcome to PopProof! Follow these steps to start showing social proof notifications on your website.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-900">Add Your Website</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to <strong>Sites</strong> in the sidebar and click <strong>"Add Site"</strong>. Enter your website name and domain.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-900">Install the Pixel</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Click <strong>"Setup Pixel"</strong> on your site card. Copy the script code and paste it in your website's <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> section.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-900">Create a Notification Widget</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Go to <strong>Create New</strong> and select a template. Choose a design preset that matches your brand.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div>
                <h4 className="font-semibold text-gray-900">Customize & Activate</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Customize the widget's appearance, set display rules, and toggle it to <strong>Active</strong>. Your notifications will start appearing!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notification-templates',
      title: 'Notification Templates',
      icon: Bell,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            PopProof offers 8 pre-built notification templates, each designed for specific social proof use cases.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Recent Purchase</h4>
              </div>
              <p className="text-sm text-gray-600">
                Display recent customer purchases to build trust and create urgency. Shows customer name, product, and price.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">New Signup</h4>
              </div>
              <p className="text-sm text-gray-600">
                Show recent signups to demonstrate a growing community. Great for SaaS and membership sites.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold text-gray-900">Customer Reviews</h4>
              </div>
              <p className="text-sm text-gray-600">
                Display customer reviews and ratings. Integrates with Google Reviews for automatic updates.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Live Visitors</h4>
              </div>
              <p className="text-sm text-gray-600">
                Show real-time visitor count to create FOMO. Updates automatically based on active sessions.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-900">Form Submission</h4>
              </div>
              <p className="text-sm text-gray-600">
                Display recent form submissions like contact requests, demo bookings, or newsletter signups.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Cart Activity</h4>
              </div>
              <p className="text-sm text-gray-600">
                Show when visitors add items to cart. Creates urgency and social proof for e-commerce.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Eye className="w-5 h-5 text-teal-600" />
                <h4 className="font-semibold text-gray-900">Active Sessions</h4>
              </div>
              <p className="text-sm text-gray-600">
                Display how many people are viewing the current page. Great for product pages.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Recent Activity</h4>
              </div>
              <p className="text-sm text-gray-600">
                Show a stream of recent activities on your site. Combines multiple event types.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'widget-customization',
      title: 'Widget Customization',
      icon: Palette,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            Every widget can be fully customized to match your brand. Click on any widget to open the editor.
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Design Settings</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Colors</strong>
                    <p className="text-sm text-gray-600">Background, text, accent, and border colors</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Typography</strong>
                    <p className="text-sm text-gray-600">Font family, sizes, and weights</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Shape & Shadow</strong>
                    <p className="text-sm text-gray-600">Border radius, shadow size, and border width</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Layout Style</strong>
                    <p className="text-sm text-gray-600">Card, Toast, Bubble, Minimal, or Peekaboo</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Display Settings</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Position</strong>
                    <p className="text-sm text-gray-600">Bottom-left, bottom-right, top-left, top-right, or center</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Timing</strong>
                    <p className="text-sm text-gray-600">Display duration, delay between notifications, initial delay</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Animation</strong>
                    <p className="text-sm text-gray-600">Slide, fade, bounce, or scale animations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Device Targeting</strong>
                    <p className="text-sm text-gray-600">Show on desktop, mobile, or both</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pixel-installation',
      title: 'Pixel Installation',
      icon: Code,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            The PopProof pixel is a small JavaScript snippet that enables notifications on your website.
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Manual Installation</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Copy the pixel code from your site's setup page and paste it in your website's <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> section:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
{`<script src="https://your-domain.supabase.co/functions/v1/engine"
  data-site-id="YOUR_SITE_ID">
</script>`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(`<script src="https://your-domain.supabase.co/functions/v1/engine" data-site-id="YOUR_SITE_ID"></script>`, 'pixel-code')}
                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                  >
                    {copiedCode === 'pixel-code' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Platform Integrations</h4>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">
                  We offer one-click integrations for popular platforms:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <div className="font-medium text-gray-900">WordPress</div>
                    <div className="text-xs text-gray-500">Plugin available</div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <div className="font-medium text-gray-900">Shopify</div>
                    <div className="text-xs text-gray-500">Theme integration</div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <div className="font-medium text-gray-900">WooCommerce</div>
                    <div className="text-xs text-gray-500">Webhook + Plugin</div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg text-center">
                    <div className="font-medium text-gray-900">Custom</div>
                    <div className="text-xs text-gray-500">API & Webhooks</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <HelpCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Verification</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    After installing the pixel, click "Verify Installation" to confirm it's working. The status will change to green when verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Analytics & Metrics',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            Track the performance of your social proof notifications with detailed analytics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Impressions</h4>
              </div>
              <p className="text-sm text-gray-600">
                Total number of times notifications were displayed to visitors.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Unique Viewers</h4>
              </div>
              <p className="text-sm text-gray-600">
                Number of individual visitors who saw at least one notification.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Active Visitors</h4>
              </div>
              <p className="text-sm text-gray-600">
                Real-time count of visitors currently on your site (last 5 minutes).
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-900">Avg Session Duration</h4>
              </div>
              <p className="text-sm text-gray-600">
                Average time visitors spend on your site per session.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <ArrowRight className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-gray-900">Bounce Rate</h4>
              </div>
              <p className="text-sm text-gray-600">
                Percentage of single-page sessions (lower is better).
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Eye className="w-5 h-5 text-teal-600" />
                <h4 className="font-semibold text-gray-900">Viewability Rate</h4>
              </div>
              <p className="text-sm text-gray-600">
                Ratio of impressions to page views (notification visibility).
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Widget Performance</h4>
            <p className="text-sm text-blue-700">
              View per-widget statistics including impressions, unique viewers, and reach rate. Use this data to optimize your notification strategy.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            Connect PopProof with your existing tools and platforms for automatic event tracking.
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">WooCommerce Integration</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Automatically track purchases, cart activity, and customer signups from your WooCommerce store.
                </p>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Go to Sites → Select your site → Setup Pixel</li>
                  <li>Choose "WooCommerce" from the platform options</li>
                  <li>Copy the webhook URL and API key</li>
                  <li>Add the webhook in WooCommerce → Settings → Advanced → Webhooks</li>
                  <li>Install the PopProof pixel on your theme</li>
                </ol>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Google Reviews Integration</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Display your Google Business reviews as social proof notifications.
                </p>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Get your Google Place ID from Google Maps</li>
                  <li>Create a Google Places API key in Google Cloud Console</li>
                  <li>Enter both in the Google Reviews integration section</li>
                  <li>Test the connection to fetch your reviews</li>
                  <li>Create a "Customer Reviews" widget to display them</li>
                </ol>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Custom Events API</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Send custom events from any platform using our REST API:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
{`POST /functions/v1/add-event
{
  "site_id": "your-site-id",
  "event_type": "purchase",
  "customer_name": "John Doe",
  "product_name": "Premium Plan",
  "value": 99.00,
  "location": "New York, USA"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: Book,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            Follow these tips to maximize the impact of your social proof notifications.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Keep notifications relevant</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Show purchase notifications on product pages, signup notifications on landing pages, and reviews on checkout pages.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Don't overwhelm visitors</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Set appropriate delays between notifications (10-15 seconds). Too many notifications can annoy visitors.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Match your brand</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Customize colors, fonts, and styles to match your website's design for a seamless experience.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Use recent data</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Configure time windows to show only recent events (last 24-48 hours for signups, 7 days for purchases).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Test on mobile</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ensure notifications look good on mobile devices. Consider using different positions for mobile vs desktop.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Monitor analytics</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Regularly check your analytics to see which widgets perform best and optimize accordingly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600">
            Everything you need to know about using PopProof to boost your conversions with social proof.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setExpandedSection('getting-started')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Zap className="w-6 h-6 text-blue-600 mb-2" />
            <div className="font-medium text-gray-900">Quick Start</div>
            <div className="text-xs text-gray-500">Get up and running</div>
          </button>
          <button 
            onClick={() => setExpandedSection('pixel-installation')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Code className="w-6 h-6 text-green-600 mb-2" />
            <div className="font-medium text-gray-900">Installation</div>
            <div className="text-xs text-gray-500">Pixel setup guide</div>
          </button>
          <button 
            onClick={() => setExpandedSection('notification-templates')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Bell className="w-6 h-6 text-purple-600 mb-2" />
            <div className="font-medium text-gray-900">Templates</div>
            <div className="text-xs text-gray-500">Notification types</div>
          </button>
          <button 
            onClick={() => setExpandedSection('integrations')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Globe className="w-6 h-6 text-orange-600 mb-2" />
            <div className="font-medium text-gray-900">Integrations</div>
            <div className="text-xs text-gray-500">Connect platforms</div>
          </button>
        </div>

        {/* Documentation Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Documentation</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              
              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-6 pt-2">
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredFaqs.map((faq, index) => {
              const isExpanded = expandedFaq === `faq-${index}`;
              
              return (
                <div key={index}>
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : `faq-${index}`)}
                    className="w-full px-4 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No FAQs match your search. Try different keywords.
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Still need help?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="mailto:support@popproof.io"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Support</span>
                </a>
                <a 
                  href="#"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Documentation</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
