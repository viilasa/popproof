import { useState, useEffect } from 'react';
import { Copy, CheckCircle, AlertCircle, ArrowLeft, ExternalLink, Globe, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { IntegrationsSection } from './IntegrationsSection';
import { useAuth } from './auth/AuthProvider';

interface PixelIntegrationProps {
  selectedSite: {
    id: string;
    name: string;
    public_key: string;
    domain: string | null;
  } | null;
  onBack: () => void;
}

export function PixelIntegration({ selectedSite, onBack }: PixelIntegrationProps) {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [pixelStatus, setPixelStatus] = useState<'inactive' | 'active' | 'checking'>('inactive');
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // State to track if verification is in progress - used for UI feedback
  const [, setIsVerifying] = useState(false);
  const [showWebsitePreview, setShowWebsitePreview] = useState(false);
  // Track the verification step for UI feedback
  const [, setVerificationStep] = useState<'initial' | 'checking' | 'success' | 'failed'>('initial');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now()); // Used to force iframe reload
  const [verificationWindow, setVerificationWindow] = useState<Window | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [woocommerceApiKey, setWoocommerceApiKey] = useState<string | null>(null);
  const [woocommerceKeyLoading, setWoocommerceKeyLoading] = useState(false);
  const [woocommerceKeyError, setWoocommerceKeyError] = useState<string | null>(null);
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookTestMessage, setWebhookTestMessage] = useState<string | null>(null);
  
  // Google Reviews state
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleReviewsStatus, setGoogleReviewsStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [googleReviewsMessage, setGoogleReviewsMessage] = useState<string | null>(null);
  const [googleReviewsData, setGoogleReviewsData] = useState<any>(null);

  const generateApiKey = () => {
    return 'sp_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Check if the pixel has been verified recently when component mounts
  useEffect(() => {
    if (selectedSite?.id) {
      checkPixelVerificationStatus();
      
      // Set up real-time subscription for verification updates
      const channel = supabase
        .channel(`pixel_activity_${selectedSite.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'pixel_verifications',
          filter: `site_id=eq.${selectedSite.id}`
        }, () => {
          checkPixelVerificationStatus();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedSite?.id]);
  
  // Add a timeout to detect if iframe fails to load due to CORS or other issues
  useEffect(() => {
    if (showWebsitePreview && selectedSite.domain && !iframeError) {
      const timeoutId = setTimeout(() => {
        // If still loading after timeout, assume there's an error
        if (iframeLoading) {
          setIframeLoading(false);
          setIframeError(true);
        }
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [showWebsitePreview, selectedSite.domain, iframeLoading, iframeError]);
  
  // Cleanup effect to close verification window when component unmounts
  useEffect(() => {
    return () => {
      // Close verification window when component unmounts
      if (verificationWindow && !verificationWindow.closed) {
        verificationWindow.close();
      }
    };
  }, [verificationWindow]);

  useEffect(() => {
    const ensureWooApiKey = async () => {
      if (selectedPlatform !== 'woocommerce' || !user || !selectedSite) {
        return;
      }

      setWoocommerceKeyLoading(true);
      setWoocommerceKeyError(null);

      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('id, public_key, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setWoocommerceApiKey(data[0].public_key);
          return;
        }

        const newKey = generateApiKey();
        const { data: inserted, error: insertError } = await supabase
          .from('api_keys')
          .insert([
            {
              user_id: user.id,
              name: `WooCommerce - ${selectedSite.domain || selectedSite.name}`,
              public_key: newKey,
              domain: selectedSite.domain || null,
            },
          ])
          .select('public_key')
          .single();

        if (insertError) {
          throw insertError;
        }

        setWoocommerceApiKey(inserted.public_key);
      } catch (error: any) {
        console.error('Error ensuring WooCommerce API key:', error);
        setWoocommerceKeyError('Could not generate API key. Please try again from the API Keys section.');
      } finally {
        setWoocommerceKeyLoading(false);
      }
    };

    ensureWooApiKey();
  }, [selectedPlatform, user, selectedSite]);

  if (!selectedSite) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Test webhook by sending a sample event
  const testWebhook = async () => {
    setWebhookTestStatus('testing');
    setWebhookTestMessage(null);
    
    try {
      const testPayload = {
        site_id: selectedSite.id,
        event_type: 'test',
        url: `https://${selectedSite.domain || 'test-site.com'}/test`,
        event_data: {
          customer_name: 'Test User',
          product_name: 'Webhook Test',
          value: 0,
          currency: 'USD',
          test: true,
          timestamp: new Date().toISOString()
        }
      };
      
      const response = await fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setWebhookTestStatus('success');
        setWebhookTestMessage('Webhook is working! Test event was received successfully.');
      } else {
        setWebhookTestStatus('error');
        setWebhookTestMessage(result.message || 'Webhook test failed. Please check your configuration.');
      }
    } catch (error: any) {
      setWebhookTestStatus('error');
      setWebhookTestMessage(error.message || 'Failed to connect to webhook endpoint.');
    }
    
    // Reset status after 5 seconds
    setTimeout(() => {
      setWebhookTestStatus('idle');
      setWebhookTestMessage(null);
    }, 5000);
  };

  // Test and save Google Reviews integration
  const testGoogleReviews = async () => {
    if (!googlePlaceId.trim()) {
      setGoogleReviewsStatus('error');
      setGoogleReviewsMessage('Please enter a Google Place ID');
      return;
    }
    if (!googleApiKey.trim()) {
      setGoogleReviewsStatus('error');
      setGoogleReviewsMessage('Please enter your Google Places API Key');
      return;
    }

    setGoogleReviewsStatus('testing');
    setGoogleReviewsMessage(null);
    setGoogleReviewsData(null);

    try {
      const response = await fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/fetch-google-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: selectedSite.id,
          place_id: googlePlaceId.trim(),
          api_key: googleApiKey.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setGoogleReviewsStatus('success');
        setGoogleReviewsMessage(`Found ${result.data.reviews_count} reviews for "${result.data.place_name}"`);
        setGoogleReviewsData(result.data);

        // Save the integration to the database
        const { error: saveError } = await supabase
          .from('site_integrations')
          .upsert({
            site_id: selectedSite.id,
            integration_type: 'google-reviews',
            is_active: true,
            settings: {
              place_id: googlePlaceId.trim(),
              api_key: googleApiKey.trim(),
              place_name: result.data.place_name
            },
            last_sync: new Date().toISOString(),
            sync_status: 'success'
          }, {
            onConflict: 'site_id,integration_type'
          });

        if (saveError) {
          console.error('Error saving integration:', saveError);
        }
      } else {
        setGoogleReviewsStatus('error');
        setGoogleReviewsMessage(result.details || result.message || 'Failed to fetch reviews');
      }
    } catch (error: any) {
      setGoogleReviewsStatus('error');
      setGoogleReviewsMessage(error.message || 'Failed to connect to Google Reviews API');
    }
  };

  // Check the pixel verification status from the database
  const checkPixelVerificationStatus = async () => {
    setIsVerifying(true);
    
    try {
      // Query the sites table to get the latest status
      const { data, error } = await supabase
        .from('sites')
        .select('last_ping, verified')
        .eq('id', selectedSite.id)
        .single();
      
      if (error) {
        console.error('Error checking pixel verification status:', error);
        setPixelStatus('inactive');
        setLastSeenAt(null);
      } else if (data) {
        // Check if the site is already verified
        if (data.verified) {
          setPixelStatus('active');
          setLastSeenAt(data.last_ping);
          return;
        }
        
        // Check if the pixel was seen in the last 10 minutes
        if (data.last_ping) {
          const lastSeen = new Date(data.last_ping);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
          
          if (diffMinutes <= 10) {
            setPixelStatus('active');
            setLastSeenAt(data.last_ping);
          } else {
            setPixelStatus('inactive');
            setLastSeenAt(data.last_ping);
            setErrorMessage(`Pixel has not been active in the last ${Math.round(diffMinutes)} minutes.`);
          }
        } else {
          setPixelStatus('inactive');
          setLastSeenAt(null);
          setErrorMessage('No pixel activity detected yet.');
        }
      } else {
        setPixelStatus('inactive');
        setLastSeenAt(null);
        setErrorMessage('No site data found.');
      }
    } catch (error) {
      console.error('Error checking pixel verification:', error);
      setPixelStatus('inactive');
      setLastSeenAt(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Open a popup window for verification
  const openVerificationWindow = () => {
    if (!selectedSite.domain) {
      setErrorMessage('No domain specified for verification');
      return null;
    }
    
    // Close any existing window
    if (verificationWindow && !verificationWindow.closed) {
      verificationWindow.close();
    }

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;

    const prepareWindow = (win: Window | null) => {
      if (!win) {
        setErrorMessage('Popup blocked. Please allow popups for this site.');
        return null;
      }

      try {
        win.document.open();
        win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pixel Verification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; text-align: center; }
            .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 30px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .container { max-width: 500px; margin: 50px auto; padding: 20px; }
            h2 { color: #333; }
            p { color: #666; line-height: 1.5; }
            .logo { font-size: 24px; font-weight: bold; color: #3B82F6; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">ProofPop</div>
            <h2>Verifying Pixel Integration</h2>
            <div class="loader"></div>
            <p>Loading your website to verify the pixel integration...</p>
            <p>This window will automatically close when verification is complete.</p>
          </div>
          <script>
            // Redirect to the actual site after showing the message
            setTimeout(() => {
              const domain = "${selectedSite.domain || ''}";
              if (domain) {
                window.location.href = domain.startsWith('http') ? domain : 'https://' + domain;
              }
            }, 2000);
          </script>
        </body>
        </html>
        `);
        win.document.close();
        return win;
      } catch (error) {
        console.warn('ProofPop: could not access verification window document, reopening fresh instance.', error);
        return null;
      }
    };

    let newWindow = prepareWindow(
      window.open('', 'PixelVerification', windowFeatures)
    );

    if (!newWindow) {
      // Fall back to a brand-new window name to avoid cross-origin reuse issues
      newWindow = prepareWindow(window.open('', `_ProofPopVerification_${Date.now()}`, windowFeatures));
    }

    if (!newWindow) {
      return null;
    }

    newWindow.focus();
    setVerificationWindow(newWindow);

    // Start monitoring the window status
    startWindowStatusCheck(newWindow);
    
    return newWindow;
  };
  
  // Monitor verification window status
  const startWindowStatusCheck = (window: Window) => {
    console.log('🔍 Starting verification polling...');
    
    const checkInterval = setInterval(async () => {
      if (window.closed) {
        // Window was closed by user, clean up
        console.log('Window closed by user');
        clearInterval(checkInterval);
        setVerificationWindow(null);
        
        // If still checking, update status
        if (pixelStatus === 'checking') {
          // Re-check verification status in case the pixel was activated
          checkPixelVerificationStatus();
        }
      } else if (pixelStatus === 'checking') {
        // Periodically check if the pixel has been verified while window is open
        const verified = await checkPixelVerificationStatusSilently();
        if (verified) {
          clearInterval(checkInterval); // Stop polling once verified
        }
      }
    }, 2000); // Check every 2 seconds (faster polling)
    
    // Auto-close after 2 minutes if verification is still pending
    setTimeout(() => {
      if (!window.closed) {
        console.log('⏰ Verification timeout');
        window.close();
        setVerificationWindow(null);
        clearInterval(checkInterval);
        
        // If still checking, update status
        if (pixelStatus === 'checking') {
          setErrorMessage('Verification timed out. Please try again.');
          setPixelStatus('inactive');
          setVerificationStep('failed');
        }
      }
    }, 120000); // 2 minutes timeout
  };
  
  // Check pixel verification status without UI updates
  const checkPixelVerificationStatusSilently = async () => {
    try {
      // Query the sites table
      const { data, error } = await supabase
        .from('sites')
        .select('last_ping, verified')
        .eq('id', selectedSite.id)
        .single();
      
      console.log('🔍 Polling verification status:', { verified: data?.verified, last_ping: data?.last_ping, error });
      
      if (!error && data) {
        // Check if pixel was detected (either verified flag OR recent last_ping)
        const hasRecentPing = data.last_ping && 
          (new Date().getTime() - new Date(data.last_ping).getTime()) < 10 * 60 * 1000; // 10 minutes
        
        if (data.verified || hasRecentPing) {
          console.log('✅ Pixel detected! Updating UI...');
          
          // Update UI immediately
          setPixelStatus('active');
          setLastSeenAt(data.last_ping);
          setVerificationStep('success');
          setErrorMessage(null);
          
          // Close the verification window FAST (500ms delay)
          if (verificationWindow && !verificationWindow.closed) {
            setTimeout(() => {
              verificationWindow.close();
              setVerificationWindow(null);
              setShowWebsitePreview(false);
              console.log('✅ Verification window closed');
            }, 500); // Fast close
          }
          
          return true; // Signal that verification succeeded
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Silent verification check failed:', error);
      return false;
    }
  };

  // Verify the pixel by checking the verification status and optionally crawling the site
  const verifyPixel = async () => {
    console.log('=== VERIFY PIXEL BUTTON CLICKED ===');
    console.log('Selected site:', selectedSite);
    
    setPixelStatus('checking');
    setErrorMessage(null);
    setVerificationStep('checking');
    
    try {
      console.log('Checking if site exists in database...');
      // First check if the site is already verified
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('verified, last_ping')
        .eq('id', selectedSite.id)
        .single();
      
      console.log('Site data from database:', siteData);
      console.log('Site error from database:', siteError);
      
      if (siteError) {
        console.error('Error checking site verification status:', siteError);
        throw new Error('Failed to check site verification status');
      }
      
      // If site is already verified, update UI and return
      if (siteData.verified) {
        if (siteData.last_ping) {
          console.log('Site is already verified');
          setPixelStatus('active');
          setLastSeenAt(siteData.last_ping);
          setVerificationStep('success');
          setErrorMessage('Site is already verified.');
          return;
        }

        console.log('Site flagged verified but no recent pixel ping; resetting status for re-check');
        const { error: resetError } = await supabase
          .from('sites')
          .update({ verified: false })
          .eq('id', selectedSite.id);

        if (resetError) {
          console.error('Error resetting site verification status:', resetError);
          setPixelStatus('inactive');
          setVerificationStep('failed');
          setErrorMessage('Unable to reset verification flag. Please try again.');
          return;
        }
      }
    } catch (error) {
      console.error('Pixel verification failed:', error);
      setPixelStatus('inactive');
      setErrorMessage(`Verification failed: ${(error as Error).message}`);
      setVerificationStep('failed');
    }
    
    // Open verification window after checking status
    console.log('Opening verification window...');
    const popupWindow = openVerificationWindow();
    if (!popupWindow) {
      console.log('Failed to open verification window');
    }
  };
  

  // Generate simple one-line integration script
  const pixelCode = `<!-- ProofPop Pixel Code for ${selectedSite.domain || selectedSite.name} -->
<script src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" data-site-id="${selectedSite.id}" async defer></script>
<!-- END ProofPop Pixel Code -->`;

  const webhookUrl = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event';

  const webhookPayload = `{
  "site_id": "${selectedSite.id}",
  "event_type": "purchase",
  "url": "https://${selectedSite.domain || 'your-site.com'}/thank-you",
  "event_data": {
    "customer_name": "John Doe",
    "product_name": "Premium Plan",
    "value": 99,
    "currency": "USD"
  }
}`;

  // Medusa.js subscriber code
  const medusaSubscriberCode = `// src/subscribers/popproof-notification.ts
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

export default async function popproofHandler({
  data,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "customer", "shipping_address"],
  });

  // Send to PopProof webhook
  await fetch("${webhookUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      site_id: "${selectedSite.id}",
      event_type: "purchase",
      url: "https://${selectedSite.domain || 'your-store.com'}/order-confirmed",
      event_data: {
        customer_name: order.shipping_address?.first_name || "Someone",
        product_name: order.items[0]?.title || "Product",
        value: order.total / 100,
        currency: order.currency_code?.toUpperCase(),
        location: order.shipping_address?.city + ", " + order.shipping_address?.country_code,
        order_id: order.id,
      },
    }),
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: { subscriberId: "popproof-notification" },
};`;

  const medusaStorefrontCode = `<!-- Add to your Medusa storefront (Next.js, Gatsby, etc.) -->
<!-- In your _app.tsx or layout.tsx -->
<script 
  src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" 
  data-site-id="${selectedSite.id}" 
  async 
  defer
></script>`;

  return (
    <div className="flex-1 bg-gray-50 min-h-full relative overflow-x-hidden">
      {showWebsitePreview && selectedSite.domain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Website Preview: {selectedSite.domain}</h3>
              </div>
              <button 
                onClick={() => setShowWebsitePreview(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {selectedSite.domain ? (
                <div className="relative w-full h-full">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading website preview...</p>
                      </div>
                    </div>
                  )}
                  {!iframeError ? (
                    <>
                      <iframe 
                        key={iframeKey}
                        src={selectedSite.domain.startsWith('http') ? selectedSite.domain : `https://${selectedSite.domain}`} 
                        className="w-full h-full border-0"
                        title={`Preview of ${selectedSite.domain}`}
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        loading="lazy"
                        onLoad={() => setIframeLoading(false)}
                        onError={() => {
                          setIframeLoading(false);
                          setIframeError(true);
                        }}
                        style={{ opacity: iframeLoading ? 0 : 1, transition: 'opacity 0.3s' }}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-center p-8">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">Failed to load website</h3>
                        <p className="text-gray-500 mt-2">The website could not be loaded. This could be due to CORS restrictions or the site is unavailable.</p>
                        <button 
                          onClick={() => {
                            setIframeLoading(true);
                            setIframeError(false);
                            // Force iframe to reload by changing the key
                            setIframeKey(Date.now());
                          }}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center p-8">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No domain specified</h3>
                    <p className="text-gray-500 mt-2">Please add a domain to your site settings to preview the website.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="text-sm text-gray-600">
                {pixelStatus === 'active' ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" /> Pixel is active on this website
                  </span>
                ) : pixelStatus === 'checking' ? (
                  <span className="flex items-center text-yellow-600">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Checking pixel status...
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" /> Pixel not detected
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {selectedSite.domain && (
                  <a 
                    href={selectedSite.domain.startsWith('http') ? selectedSite.domain : `https://${selectedSite.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center space-x-1 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </a>
                )}
                <button 
                  onClick={() => setShowWebsitePreview(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header - Sticky below main header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              <button
                onClick={onBack}
                className="inline-flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>Sites</span>
                <span>/</span>
                <span className="text-blue-600 font-medium">Pixel</span>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                  {selectedSite.domain || selectedSite.name}
                </h1>
                <div className="flex items-center space-x-1.5 sm:space-x-2 mt-0.5 sm:mt-1">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    pixelStatus === 'active' ? 'bg-green-500' : 
                    pixelStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {pixelStatus === 'active' ? 'Active' : 
                     pixelStatus === 'checking' ? 'Checking...' : 'Not Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Status Banner */}
        <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border-2 ${
          pixelStatus === 'active' 
            ? 'bg-green-50 border-green-200' 
            : pixelStatus === 'checking'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 mb-3 sm:mb-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-xs sm:text-sm">1</span>
              </div>
              {pixelStatus === 'active' ? (
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
              ) : pixelStatus === 'checking' ? (
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-yellow-600 flex-shrink-0"></div>
              ) : (
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold text-sm sm:text-base md:text-lg ${
                  pixelStatus === 'active' ? 'text-green-800' :
                  pixelStatus === 'checking' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {pixelStatus === 'active' ? 'Pixel is Active!' :
                   pixelStatus === 'checking' ? 'Checking Pixel Status...' : 'Ready to Install Pixel'}
                </h3>
                <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                  pixelStatus === 'active' ? 'text-green-700' :
                  pixelStatus === 'checking' ? 'text-yellow-700' : 'text-blue-700'
                }`}>
                  {pixelStatus === 'active' ? 'Your social proof widget is working correctly' :
                   pixelStatus === 'checking' ? 'Please wait while we verify your installation' : 
                   'Follow the steps below to activate social proof notifications on your website'}
                </p>
              </div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
          
          {verificationWindow && !verificationWindow.closed && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">Verification window is open. Please complete the process in the popup window.</p>
              </div>
              <button 
                onClick={() => {
                  if (verificationWindow && !verificationWindow.closed) {
                    verificationWindow.focus();
                  }
                }}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Focus Window
              </button>
            </div>
          )}
        </div>

        {/* Main Content - Platform Selection or Installation Steps */}
        {!selectedPlatform ? (
          // Step 1: Platform Selection
          <div className="mb-4 sm:mb-6 md:mb-8">
            <IntegrationsSection 
              siteId={selectedSite.id} 
              onPlatformSelect={(platformId) => setSelectedPlatform(platformId)}
            />
          </div>
        ) : (
          // Step 2: Installation Steps for Selected Platform
          <div className="mb-4 sm:mb-6 md:mb-8">
            {/* Back Button */}
            <button
              onClick={() => setSelectedPlatform(null)}
              className="inline-flex items-center space-x-1.5 sm:space-x-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">Back to Platforms</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:gap-8">
              {/* Installation Instructions */}
              <div className="flex-1 lg:max-w-2xl mb-6 lg:mb-0">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm sm:text-base">2</span>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pixel Installation</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Complete these steps to activate social proof</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                          1
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                            {selectedPlatform === 'woocommerce'
                              ? 'Connect WooCommerce with Keys'
                              : selectedPlatform === 'webhook'
                              ? 'Connect via Webhook'
                              : selectedPlatform === 'zapier'
                              ? 'Connect via Zapier'
                              : selectedPlatform === 'google-reviews'
                              ? 'Connect Google Reviews'
                              : selectedPlatform === 'medusa'
                              ? 'Connect Medusa.js'
                              : 'Copy the Pixel Code'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            {selectedPlatform === 'woocommerce'
                              ? 'Use your Site Key and API Key below inside the ProofPop WooCommerce plugin settings.'
                              : selectedPlatform === 'webhook'
                              ? 'Send events from your backend to the webhook URL below using the JSON payload.'
                              : selectedPlatform === 'zapier'
                              ? 'Use Zapier to connect PopProof with 5000+ apps. Send events when triggers fire in your connected apps.'
                              : selectedPlatform === 'google-reviews'
                              ? 'Display your Google Reviews as social proof notifications. Enter your Place ID and API key below.'
                              : selectedPlatform === 'medusa'
                              ? 'Add a subscriber to your Medusa backend to send order events to PopProof.'
                              : 'Copy the code snippet below to integrate the social proof widget into your website.'}
                          </p>
                          
                          {selectedPlatform === 'woocommerce' ? (
                            <div className="space-y-4">
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">Site Key</span>
                                  <button
                                    onClick={() => copyToClipboard(selectedSite.public_key, 'woocommerce-site-key')}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <div className="bg-white rounded-md px-3 py-2 border border-gray-200 font-mono text-xs sm:text-sm text-gray-900 break-all">
                                  {selectedSite.public_key}
                                </div>
                                {copiedCode === 'woocommerce-site-key' && (
                                  <div className="mt-1 text-xs text-green-600">Copied site key</div>
                                )}
                              </div>

                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">API Key</span>
                                  <button
                                    onClick={() => woocommerceApiKey && copyToClipboard(woocommerceApiKey, 'woocommerce-api-key')}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={!woocommerceApiKey || woocommerceKeyLoading}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <div className="bg-white rounded-md px-3 py-2 border border-gray-200 font-mono text-xs sm:text-sm text-gray-900 break-all">
                                  {woocommerceKeyLoading && 'Generating API key...'}
                                  {!woocommerceKeyLoading && woocommerceApiKey && woocommerceApiKey}
                                  {!woocommerceKeyLoading && !woocommerceApiKey && !woocommerceKeyError && 'No key available'}
                                  {woocommerceKeyError && (
                                    <span className="text-red-600">{woocommerceKeyError}</span>
                                  )}
                                </div>
                                {copiedCode === 'woocommerce-api-key' && (
                                  <div className="mt-1 text-xs text-green-600">Copied API key</div>
                                )}
                              </div>

                              <div className="text-xs sm:text-sm text-gray-600">
                                Install the ProofPop WooCommerce plugin, then paste the Site Key and API Key into the plugin settings to start sending events.
                              </div>
                            </div>
                          ) : selectedPlatform === 'webhook' || selectedPlatform === 'zapier' ? (
                            <div className="space-y-4">
                              {selectedPlatform === 'zapier' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-4">
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      <img 
                                        src="https://1000logos.net/wp-content/uploads/2022/09/Zapier-Emblem.png" 
                                        alt="Zapier" 
                                        className="w-8 h-8 object-contain"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-orange-900 mb-1">Zapier Setup Instructions</h4>
                                      <ol className="text-xs text-orange-800 space-y-1 list-decimal list-inside">
                                        <li>Create a new Zap in Zapier</li>
                                        <li>Choose your trigger app (e.g., Stripe, Shopify, Typeform)</li>
                                        <li>Select "Webhooks by Zapier" as the action</li>
                                        <li>Choose "POST" method and paste the webhook URL below</li>
                                        <li>Set the payload type to "JSON" and use the format shown below</li>
                                      </ol>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">Webhook URL</span>
                                  <button
                                    onClick={() => copyToClipboard(webhookUrl, 'webhook-url')}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <div className="bg-white rounded-md px-3 py-2 border border-gray-200 font-mono text-xs sm:text-sm text-gray-900 break-all">
                                  {webhookUrl}
                                </div>
                                {copiedCode === 'webhook-url' && (
                                  <div className="mt-1 text-xs text-green-600">Copied webhook URL</div>
                                )}
                              </div>

                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                                    {selectedPlatform === 'zapier' ? 'Zapier JSON Payload' : 'Example JSON Payload'}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(webhookPayload, 'webhook-payload')}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <pre className="bg-white rounded-md px-3 py-2 border border-gray-200 font-mono text-[11px] sm:text-xs text-gray-900 overflow-x-auto whitespace-pre">
{webhookPayload}
                                </pre>
                                {copiedCode === 'webhook-payload' && (
                                  <div className="mt-1 text-xs text-green-600">Copied example payload</div>
                                )}
                              </div>

                              <div className="text-xs sm:text-sm text-gray-600 mb-4">
                                Send a POST request with this JSON body whenever a purchase, signup, or other event happens in your backend. Widgets listening for this event type will turn these into live notifications.
                              </div>

                              {/* Test Webhook Button */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm text-blue-900 mb-1">Test Your Webhook</h4>
                                    <p className="text-xs text-blue-700">Send a test event to verify your webhook is working correctly.</p>
                                  </div>
                                  <button
                                    onClick={testWebhook}
                                    disabled={webhookTestStatus === 'testing'}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                                      webhookTestStatus === 'testing' 
                                        ? 'bg-blue-300 text-white cursor-not-allowed'
                                        : webhookTestStatus === 'success'
                                        ? 'bg-green-600 text-white'
                                        : webhookTestStatus === 'error'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    {webhookTestStatus === 'testing' && (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    {webhookTestStatus === 'success' && (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    {webhookTestStatus === 'error' && (
                                      <AlertCircle className="w-4 h-4" />
                                    )}
                                    <span>
                                      {webhookTestStatus === 'testing' ? 'Testing...' 
                                        : webhookTestStatus === 'success' ? 'Success!' 
                                        : webhookTestStatus === 'error' ? 'Failed' 
                                        : 'Send Test Event'}
                                    </span>
                                  </button>
                                </div>
                                {webhookTestMessage && (
                                  <div className={`mt-2 text-xs ${
                                    webhookTestStatus === 'success' ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {webhookTestMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : selectedPlatform === 'google-reviews' ? (
                            <div className="space-y-4">
                              {/* Google Reviews Setup Instructions */}
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <span className="text-2xl">⭐</span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-yellow-900 mb-1">How to Get Your Google Place ID</h4>
                                    <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                                      <li>Go to <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline">Google Place ID Finder</a></li>
                                      <li>Search for your business name</li>
                                      <li>Copy the Place ID (starts with "ChIJ...")</li>
                                      <li>Get a Google Places API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                                    </ol>
                                  </div>
                                </div>
                              </div>

                              {/* Place ID Input */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                  Google Place ID
                                </label>
                                <input
                                  type="text"
                                  value={googlePlaceId}
                                  onChange={(e) => setGooglePlaceId(e.target.value)}
                                  placeholder="ChIJ..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Your unique Google Place ID for your business location
                                </p>
                              </div>

                              {/* API Key Input */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                  Google Places API Key
                                </label>
                                <input
                                  type="password"
                                  value={googleApiKey}
                                  onChange={(e) => setGoogleApiKey(e.target.value)}
                                  placeholder="AIza..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Your Google Cloud API key with Places API enabled
                                </p>
                              </div>

                              {/* Test & Connect Button */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm text-blue-900 mb-1">Test Connection</h4>
                                    <p className="text-xs text-blue-700">Verify your credentials and fetch reviews</p>
                                  </div>
                                  <button
                                    onClick={testGoogleReviews}
                                    disabled={googleReviewsStatus === 'testing'}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                                      googleReviewsStatus === 'testing' 
                                        ? 'bg-blue-300 text-white cursor-not-allowed'
                                        : googleReviewsStatus === 'success'
                                        ? 'bg-green-600 text-white'
                                        : googleReviewsStatus === 'error'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    {googleReviewsStatus === 'testing' && (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    {googleReviewsStatus === 'success' && (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    {googleReviewsStatus === 'error' && (
                                      <AlertCircle className="w-4 h-4" />
                                    )}
                                    <span>
                                      {googleReviewsStatus === 'testing' ? 'Fetching...' 
                                        : googleReviewsStatus === 'success' ? 'Connected!' 
                                        : googleReviewsStatus === 'error' ? 'Failed' 
                                        : 'Connect & Fetch Reviews'}
                                    </span>
                                  </button>
                                </div>
                                {googleReviewsMessage && (
                                  <div className={`mt-2 text-xs ${
                                    googleReviewsStatus === 'success' ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {googleReviewsMessage}
                                  </div>
                                )}
                              </div>

                              {/* Show fetched reviews preview */}
                              {googleReviewsData && googleReviewsData.reviews && (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                  <h4 className="font-medium text-sm text-gray-900 mb-3">
                                    Preview: {googleReviewsData.place_name} ({googleReviewsData.place_rating}⭐)
                                  </h4>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {googleReviewsData.reviews.slice(0, 3).map((review: any, idx: number) => (
                                      <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="font-medium">{review.author_name}</span>
                                          <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                                        </div>
                                        <p className="text-gray-600 line-clamp-2">{review.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="mt-2 text-xs text-gray-500">
                                    These reviews will appear as social proof notifications on your site.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : selectedPlatform === 'medusa' ? (
                            <div className="space-y-4">
                              {/* Medusa Setup Instructions */}
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <img 
                                      src="https://user-images.githubusercontent.com/7554214/153162406-bf8fd16f-aa98-4604-b87b-e13ab4baf604.png" 
                                      alt="Medusa" 
                                      className="w-8 h-8 object-contain"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-purple-900 mb-1">Medusa.js Integration</h4>
                                    <p className="text-xs text-purple-800">
                                      Add a subscriber to your Medusa backend to automatically send order events to PopProof.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Step 1: Backend Subscriber */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                                    Step 1: Create Subscriber (Backend)
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(medusaSubscriberCode, 'medusa-subscriber')}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Create this file in your Medusa backend: <code className="bg-gray-200 px-1 rounded">src/subscribers/popproof-notification.ts</code>
                                </p>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-[10px] sm:text-xs font-mono max-h-[200px]">
                                  <code>{medusaSubscriberCode}</code>
                                </pre>
                                {copiedCode === 'medusa-subscriber' && (
                                  <div className="mt-1 text-xs text-green-600">Copied subscriber code</div>
                                )}
                              </div>

                              {/* Step 2: Storefront Pixel */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                                    Step 2: Add Pixel to Storefront
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(medusaStorefrontCode, 'medusa-storefront')}
                                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Add this to your storefront (Next.js, Gatsby, etc.) in the layout or _app file:
                                </p>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-[10px] sm:text-xs font-mono">
                                  <code>{medusaStorefrontCode}</code>
                                </pre>
                                {copiedCode === 'medusa-storefront' && (
                                  <div className="mt-1 text-xs text-green-600">Copied storefront code</div>
                                )}
                              </div>

                              {/* Webhook URL for testing */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <h4 className="font-medium text-sm text-blue-900 mb-2">Webhook Endpoint</h4>
                                <div className="flex items-center space-x-2">
                                  <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 text-xs font-mono text-gray-800 break-all">
                                    {webhookUrl}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(webhookUrl, 'medusa-webhook')}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                                  >
                                    Copy
                                  </button>
                                </div>
                                {copiedCode === 'medusa-webhook' && (
                                  <div className="mt-1 text-xs text-green-600">Copied webhook URL</div>
                                )}
                              </div>

                              <div className="text-xs sm:text-sm text-gray-600">
                                <strong>Events supported:</strong> order.placed, order.completed, order.canceled, customer.created
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-3 sm:px-4 py-2 border-b border-gray-700">
                                <span className="text-xs text-gray-400">Pixel Code</span>
                                <button
                                  onClick={() => copyToClipboard(pixelCode, 'pixel-code')}
                                  className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-200 active:text-white bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg transition-colors flex items-center space-x-1 touch-manipulation min-h-[44px] sm:min-h-0"
                                >
                                  <Copy className="w-4 h-4" />
                                  <span className="text-xs font-medium">Copy</span>
                                </button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-b-lg overflow-x-auto text-xs sm:text-sm font-mono border border-t-0 border-gray-700 max-h-[120px] sm:max-h-[150px] whitespace-pre-wrap break-all">
                                <code>{pixelCode}</code>
                                <div className="mt-2 sm:mt-3 text-xs text-gray-400">This code will track page visits and verify your site.</div>
                              </pre>
                              {copiedCode === 'pixel-code' && (
                                <div className="absolute top-2 right-2 sm:right-14 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
                                  ✓ Copied!
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                          2
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                            Paste Before Closing &lt;/head&gt; Tag
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            Add the code to every page where you want to display social proof notifications, right before the closing &lt;/head&gt; tag.
                          </p>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm sm:text-base text-blue-900 mb-0.5 sm:mb-1">Pro Tip</h4>
                                <p className="text-xs sm:text-sm text-blue-800">
                                  For best performance, place the script in your site's template or header file so it loads on all pages automatically.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                          3
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
                            Check Verification Status
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            Check the verification status indicator at the top of this page to confirm if your pixel is active and working correctly.
                          </p>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm sm:text-base text-blue-900 mb-0.5 sm:mb-1">Status Indicator</h4>
                                <p className="text-xs sm:text-sm text-blue-800">
                                  Look for the status indicator next to your site name at the top. A green dot means your pixel is active and tracking successfully.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="mt-4 sm:mt-6 lg:mt-0 lg:w-80 lg:shrink-0">
                <div className="lg:sticky lg:top-4 space-y-4 sm:space-y-6">
                {/* Help & Support */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Need Help?</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <a
                      href="#"
                      className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:text-blue-600 transition-colors p-2.5 sm:p-2 rounded-lg hover:bg-gray-50 active:bg-blue-50 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <span className="text-base sm:text-lg">📚</span>
                      <span className="font-medium">Documentation</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:text-blue-600 transition-colors p-2.5 sm:p-2 rounded-lg hover:bg-gray-50 active:bg-blue-50 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <span className="text-base sm:text-lg">💬</span>
                      <span className="font-medium">Live Chat Support</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600 hover:text-gray-900 active:text-blue-600 transition-colors p-2.5 sm:p-2 rounded-lg hover:bg-gray-50 active:bg-blue-50 touch-manipulation min-h-[44px] sm:min-h-0"
                    >
                      <span className="text-base sm:text-lg">📧</span>
                      <span className="font-medium">Email Support</span>
                    </a>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}