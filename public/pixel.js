// ProofPop Pixel Script v2.0
(function() {
    console.log('ProofPop: Pixel script loaded');
    
    // Extract site_id from current script tag
    const currentScript = document.currentScript || document.querySelector('script[data-site-id]');
    if (!currentScript) {
        console.error('ProofPop: Could not find script tag with data-site-id');
        return;
    }
    
    const siteId = currentScript.getAttribute('data-site-id');
    if (!siteId) {
        console.error('ProofPop: data-site-id attribute is required');
        return;
    }
    
    console.log('ProofPop: Loading engine for site:', siteId);
    
    // Load the main engine script
    const engineScript = document.createElement('script');
    engineScript.src = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine'; // Fixed: removed .js extension
    engineScript.setAttribute('data-site-id', siteId);
    engineScript.async = true;
    engineScript.defer = true;
    
    // Add error handling
    engineScript.onerror = function() {
        console.error('ProofPop: Failed to load engine script');
    };
    
    engineScript.onload = function() {
        console.log('ProofPop: Engine script loaded successfully');
    };
    
    document.head.appendChild(engineScript);
})();
