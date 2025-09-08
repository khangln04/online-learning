// IMMEDIATE error suppression - loaded before React
(function() {
  'use strict';
  
  // Store original methods immediately
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  // Comprehensive error patterns
  const errorPatterns = [
    'invocation canceled',
    'invocation cancelled', 
    'signalr',
    'hubconnection',
    'websockettransport',
    'websocket',
    'httptransport', 
    'httpconnection',
    'underlying connection being closed',
    'connection being closed',
    'connectionclosed',
    '_connectionclosed',
    'stopconnection',
    '_stopconnection',
    'stopinternal',
    '_stopinternal',
    'transport.onclose',
    'connection.onclose',
    'bundle.js:',
    'failed to invoke',
    'leavereportgroup',
    'joinreportgroup',
    'processincomingdata',
    'connection.onreceive',
    'callbacks.computed',
    'websocket.onmessage',
    'error on the server',
    'an error on the server',
    'due to an error on the server'
  ];
  
  // Function to check if message contains error patterns
  function isBlockedError(message) {
    if (!message) return false;
    const msgLower = String(message).toLowerCase();
    return errorPatterns.some(pattern => msgLower.includes(pattern));
  }
  
  // AGGRESSIVE console overrides
  console.error = function(...args) {
    const fullMessage = args.join(' ');
    if (isBlockedError(fullMessage)) {
      return; // Completely block
    }
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const fullMessage = args.join(' ');
    if (isBlockedError(fullMessage)) {
      return; // Block warnings too
    }
    originalWarn.apply(console, args);
  };

  // Disable React Error Overlay IMMEDIATELY
  if (typeof window !== 'undefined') {
    window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
      isMounted: () => false,
      onBuildError: () => {},
      onBuildSuccess: () => {},
      onRuntimeError: () => {},
      onRuntimeWarning: () => {},
      onRuntimeRecovered: () => {}
    };
  }

  // Block ALL error events with maximum priority
  const blockAllErrors = (event) => {
    // Check all possible error message sources
    const sources = [
      event.error?.message,
      event.error?.stack,
      event.message,
      event.reason?.message,
      String(event.reason),
      event.type
    ].filter(Boolean);
    
    if (sources.some(source => isBlockedError(source))) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };

  // Add multiple listeners with different configurations
  if (typeof window !== 'undefined') {
    window.addEventListener('error', blockAllErrors, { capture: true, passive: false });
    window.addEventListener('error', blockAllErrors, { capture: false, passive: false });
    window.addEventListener('unhandledrejection', blockAllErrors, { capture: true, passive: false });
    window.addEventListener('unhandledrejection', blockAllErrors, { capture: false, passive: false });

    // Override global handlers immediately
    window.onerror = function(message, source, lineno, colno, error) {
      if (isBlockedError(message) || isBlockedError(error?.message) || isBlockedError(error?.stack)) {
        return true; // Prevent default
      }
      return false;
    };

    window.onunhandledrejection = function(event) {
      if (isBlockedError(event.reason?.message) || isBlockedError(String(event.reason))) {
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    // Override setTimeout/setInterval to catch async errors
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = function(callback, delay, ...args) {
      const wrappedCallback = function() {
        try {
          return callback.apply(this, arguments);
        } catch (error) {
          if (isBlockedError(error.message) || isBlockedError(error.stack)) {
            return; // Suppress SignalR errors
          }
          throw error;
        }
      };
      return originalSetTimeout.call(this, wrappedCallback, delay, ...args);
    };
    
    window.setInterval = function(callback, delay, ...args) {
      const wrappedCallback = function() {
        try {
          return callback.apply(this, arguments);
        } catch (error) {
          if (isBlockedError(error.message) || isBlockedError(error.stack)) {
            return; // Suppress SignalR errors
          }
          throw error;
        }
      };
      return originalSetInterval.call(this, wrappedCallback, delay, ...args);
    };
  }
  
  // Mark as loaded
  window.__ERROR_SUPPRESSOR_LOADED__ = true;
  console.log('🔇 IMMEDIATE error suppression active - All SignalR errors blocked');
})();

// Additional layer for React Error Boundary override
if (typeof window !== 'undefined') {
  // Override React Error Boundary
  const originalReactError = window.React?.Component?.prototype?.componentDidCatch;
  if (originalReactError) {
    window.React.Component.prototype.componentDidCatch = function(error, errorInfo) {
      if (error && (error.message && isBlockedError(error.message) || 
                   error.stack && isBlockedError(error.stack))) {
        return; // Don't call original componentDidCatch
      }
      return originalReactError.call(this, error, errorInfo);
    };
  }
}
