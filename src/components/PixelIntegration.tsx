import { useState, useEffect } from 'react';
import { Copy, CheckCircle, AlertCircle, ArrowLeft, ExternalLink, Globe, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { IntegrationsSection } from './IntegrationsSection';

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
  if (!selectedSite) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
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

  return (
    <div className="flex-1 bg-gray-50 min-h-screen relative">
      {showWebsitePreview && selectedSite.domain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Sites</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Sites</span>
                <span>/</span>
                <span className="text-blue-600 font-medium">Pixel Integration</span>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {selectedSite.domain || selectedSite.name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    pixelStatus === 'active' ? 'bg-green-500' : 
                    pixelStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 ${
          pixelStatus === 'active' 
            ? 'bg-green-50 border-green-200' 
            : pixelStatus === 'checking'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              {pixelStatus === 'active' ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : pixelStatus === 'checking' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 flex-shrink-0"></div>
              ) : (
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              )}
              <div>
                <h3 className={`font-semibold ${
                  pixelStatus === 'active' ? 'text-green-800' :
                  pixelStatus === 'checking' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {pixelStatus === 'active' ? 'Pixel is Active!' :
                   pixelStatus === 'checking' ? 'Checking Pixel Status...' : 'Ready to Install Pixel'}
                </h3>
                <p className={`text-sm ${
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
          <div className="mb-8">
            <IntegrationsSection 
              siteId={selectedSite.id} 
              onPlatformSelect={(platformId) => setSelectedPlatform(platformId)}
            />
          </div>
        ) : (
          // Step 2: Installation Steps for Selected Platform
          <div className="mb-8">
            {/* Back Button */}
            <button
              onClick={() => setSelectedPlatform(null)}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Platform Selection</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Installation Instructions */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Pixel Installation</h2>
                        <p className="text-sm text-gray-600">Complete these steps to activate social proof on your website</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          1
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Copy the Pixel Code
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Copy the code snippet below to integrate the social proof widget into your website.
                          </p>
                          
                          <div className="relative">
                            <div className="flex items-center justify-between bg-gray-800 rounded-t-lg px-4 py-2 border-b border-gray-700">
                              <span className="text-xs text-gray-400">Pixel Code</span>
                              <button
                                onClick={() => copyToClipboard(pixelCode, 'pixel-code')}
                                className="p-2 text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-1"
                              >
                                <Copy className="w-4 h-4" />
                                <span className="text-xs">Copy</span>
                              </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm font-mono border border-t-0 border-gray-700 max-h-[150px] whitespace-pre-wrap break-all">
                              <code>{pixelCode}</code>
                              <div className="mt-3 text-xs text-gray-400">This code will track page visits and verify your site.</div>
                            </pre>
                            {copiedCode === 'pixel-code' && (
                              <div className="absolute top-2 right-14 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                                Copied!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          2
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Paste Before Closing &lt;/head&gt; Tag
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Add the code to every page where you want to display social proof notifications, right before the closing &lt;/head&gt; tag.
                          </p>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
                                <p className="text-sm text-blue-800">
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
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          3
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Check Verification Status
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Check the verification status indicator at the top of this page to confirm if your pixel is active and working correctly.
                          </p>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-blue-900 mb-1">Status Indicator</h4>
                                <p className="text-sm text-blue-800">
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
              <div className="space-y-6">
                {/* Help & Support */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
                  <div className="space-y-3">
                    <a
                      href="#"
                      className="flex items-center space-x-3 text-sm text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    >
                      <span>📚</span>
                      <span>Documentation</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center space-x-3 text-sm text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    >
                      <span>💬</span>
                      <span>Live Chat Support</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center space-x-3 text-sm text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    >
                      <span>📧</span>
                      <span>Email Support</span>
                    </a>
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