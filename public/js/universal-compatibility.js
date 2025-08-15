// Universal Browser Compatibility JavaScript
// Supports: Chrome, Edge, Firefox, Safari, Opera

// Detect browser for compatibility handling
function detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Other';
}

// Universal fetch wrapper with enhanced error handling
async function universalFetch(url, options = {}) {
    const browser = detectBrowser();
    
    // Default options for universal compatibility
    const defaultOptions = {
        credentials: 'include', // Include cookies for all browsers
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    // Merge options
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        console.log(`🌐 [${browser}] Fetching:`, url);
        
        const response = await fetch(url, finalOptions);
        
        // Enhanced error handling for different browsers
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [${browser}] Request failed:`, {
                url,
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ [${browser}] Request successful:`, url);
        return response;
        
    } catch (error) {
        console.error(`💥 [${browser}] Fetch error:`, error);
        
        // Browser-specific error handling
        if (browser === 'Safari' && error.message.includes('credentials')) {
            console.warn('🍎 Safari cookie issue detected');
            // Retry without credentials for Safari
            delete finalOptions.credentials;
            return fetch(url, finalOptions);
        }
        
        throw error;
    }
}

// Universal event handling
function addUniversalEventListener(element, event, handler) {
    if (element.addEventListener) {
        element.addEventListener(event, handler);
    } else if (element.attachEvent) {
        // IE fallback
        element.attachEvent('on' + event, handler);
    }
}

// Universal storage wrapper
const universalStorage = {
    set: function(key, value) {
        try {
            if (typeof Storage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                // Fallback for older browsers
                document.cookie = `${key}=${JSON.stringify(value)}; path=/`;
            }
        } catch (error) {
            console.warn('Storage not available:', error);
        }
    },
    
    get: function(key) {
        try {
            if (typeof Storage !== 'undefined') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } else {
                // Fallback for older browsers
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === key) {
                        return JSON.parse(value);
                    }
                }
                return null;
            }
        } catch (error) {
            console.warn('Storage read error:', error);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            if (typeof Storage !== 'undefined') {
                localStorage.removeItem(key);
            } else {
                // Fallback for older browsers
                document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        } catch (error) {
            console.warn('Storage remove error:', error);
        }
    }
};

// Universal CSS class manipulation
function universalAddClass(element, className) {
    if (element.classList) {
        element.classList.add(className);
    } else {
        // IE fallback
        element.className += ' ' + className;
    }
}

function universalRemoveClass(element, className) {
    if (element.classList) {
        element.classList.remove(className);
    } else {
        // IE fallback
        element.className = element.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
    }
}

// Browser-specific polyfills
function loadPolyfills() {
    const browser = detectBrowser();
    
    // Promise polyfill for older browsers
    if (!window.Promise) {
        console.log('Loading Promise polyfill...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js';
        document.head.appendChild(script);
    }
    
    // Fetch polyfill for older browsers
    if (!window.fetch) {
        console.log('Loading Fetch polyfill...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js';
        document.head.appendChild(script);
    }
    
    // CustomEvent polyfill for IE
    if (!window.CustomEvent) {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            const evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    }
}

// Initialize universal compatibility
function initUniversalCompatibility() {
    const browser = detectBrowser();
    console.log(`🌐 Browser detected: ${browser}`);
    
    // Load polyfills if needed
    loadPolyfills();
    
    // Set browser-specific CSS class on body
    document.body.classList.add(`browser-${browser.toLowerCase()}`);
    
    // Browser-specific optimizations
    switch (browser) {
        case 'Safari':
            console.log('🍎 Safari optimizations applied');
            // Safari-specific tweaks
            document.body.style.webkitTouchCallout = 'none';
            break;
            
        case 'Firefox':
            console.log('🦊 Firefox optimizations applied');
            // Firefox-specific tweaks
            break;
            
        case 'Edge':
            console.log('🌊 Edge optimizations applied');
            // Edge-specific tweaks
            break;
            
        case 'Chrome':
            console.log('🟡 Chrome optimizations applied');
            // Chrome-specific tweaks
            break;
    }
    
    // Universal viewport handling
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    }
}

// Export for global use
window.universalFetch = universalFetch;
window.universalStorage = universalStorage;
window.detectBrowser = detectBrowser;
window.addUniversalEventListener = addUniversalEventListener;
window.universalAddClass = universalAddClass;
window.universalRemoveClass = universalRemoveClass;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalCompatibility);
} else {
    initUniversalCompatibility();
}
