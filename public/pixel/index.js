// This is the loader script that gets the client ID from the URL path
// and dynamically loads the main widget script

(function() {
  'use strict';

  function getCurrentPixelScript() {
    if (document.currentScript && document.currentScript.src?.includes('/pixel/')) {
      return document.currentScript;
    }

    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('/pixel/')) {
        return scripts[i];
      }
    }

    return null;
  }

  // Extract client ID from the loader script's URL path (supports hyphen/underscore)
  function getClientIdFromScript(scriptEl) {
    if (!scriptEl || !scriptEl.src) return null;
    const matches = scriptEl.src.match(/\/pixel\/([a-zA-Z0-9_-]+)/);
    return matches && matches[1] ? matches[1] : null;
  }

  function resolveWidgetUrl(scriptEl) {
    if (!scriptEl) return null;

    const explicitUrl = scriptEl.getAttribute('data-widget-url');
    if (explicitUrl) return explicitUrl;

    const scriptSrc = scriptEl.src;
    if (!scriptSrc) return null;

    try {
      const loaderUrl = new URL(scriptSrc);
      const widgetPath = scriptEl.getAttribute('data-widget-path') || '/widget-core.js';
      return new URL(widgetPath, loaderUrl.origin + '/').toString();
    } catch (error) {
      console.warn('ProofPop: Failed to resolve widget URL', error);
      return null;
    }
  }

  // Load the main widget script
  function loadMainScript(scriptEl, clientId) {
    if (!scriptEl || !clientId) return;

    const widgetUrl = resolveWidgetUrl(scriptEl);
    if (!widgetUrl) {
      console.warn('ProofPop: Widget URL could not be resolved');
      return;
    }

    const widgetScript = document.createElement('script');
    widgetScript.async = true;
    widgetScript.src = widgetUrl;
    widgetScript.setAttribute('data-client-id', clientId);

    // Pass through optional configuration attributes
    const passthroughAttributes = [
      'data-api-url',
      'data-api-key',
      'data-debug',
      'data-debug-indicator',
      'data-debug-indicator-text',
      'data-debug-indicator-position',
      'data-site-id'
    ];
    passthroughAttributes.forEach(attr => {
      const value = scriptEl.getAttribute(attr);
      if (value !== null) {
        widgetScript.setAttribute(attr, value);
      }
    });

    document.head.appendChild(widgetScript);
  }

  function init() {
    const scriptEl = getCurrentPixelScript();
    if (!scriptEl) {
      console.warn('ProofPop: Pixel loader script tag could not be located');
      return;
    }

    const clientId = getClientIdFromScript(scriptEl);
    if (!clientId) {
      console.warn('ProofPop: Could not extract client ID from script URL');
      return;
    }

    loadMainScript(scriptEl, clientId);
  }

  init();
})();
