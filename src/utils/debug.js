/**
 * Environment-based debugging utility
 * Only logs in development mode when explicitly enabled via VITE_DEBUG environment variable
 * Never logs sensitive data like authentication tokens or passwords
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.VITE_DEBUG === '1';

// Sensitive data patterns to never log
const SENSITIVE_PATTERNS = [
    /token/i,
    /password/i,
    /authorization/i,
    /auth/i,
    /secret/i,
    /key/i,
    /credential/i,
    /bearer/i,
];

/**
 * Check if a key or value contains sensitive data
 */
function isSensitive(key, value) {
    if (!key || !value) return false;
    
    const keyStr = String(key).toLowerCase();
    const valueStr = typeof value === 'string' ? value.toLowerCase() : JSON.stringify(value).toLowerCase();
    
    return SENSITIVE_PATTERNS.some(pattern => 
        pattern.test(keyStr) || pattern.test(valueStr)
    );
}

/**
 * Sanitize an object to remove sensitive data
 */
function sanitizeData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (isSensitive(key, value)) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeData(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Debug logger - only logs in development when explicitly enabled
 */
const debug = {
    /**
     * Log debug information
     */
    log(...args) {
        if (isDevelopment && isDebugEnabled) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    return sanitizeData(arg);
                }
                return arg;
            });
            console.log(...sanitized);
        }
    },
    
    /**
     * Log warnings
     */
    warn(...args) {
        if (isDevelopment && isDebugEnabled) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    return sanitizeData(arg);
                }
                return arg;
            });
            console.warn(...sanitized);
        }
    },
    
    /**
     * Log errors (always logged in development, but sanitized)
     */
    error(...args) {
        if (isDevelopment) {
            const sanitized = args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    return sanitizeData(arg);
                }
                return arg;
            });
            console.error(...sanitized);
        }
    },
    
    /**
     * Log API requests (sanitized)
     */
    apiRequest(url, method, headers, body) {
        if (isDevelopment && isDebugEnabled) {
            const sanitizedHeaders = sanitizeData(headers || {});
            const sanitizedBody = body ? sanitizeData(body) : undefined;
            console.log('🔍 API Request:', {
                url,
                method: method || 'GET',
                headers: sanitizedHeaders,
                ...(sanitizedBody && { body: sanitizedBody })
            });
        }
    },
    
    /**
     * Log API responses (sanitized)
     */
    apiResponse(url, status, data) {
        if (isDevelopment && isDebugEnabled) {
            const sanitizedData = sanitizeData(data);
            console.log('🔍 API Response:', {
                url,
                status,
                data: sanitizedData
            });
        }
    },
    
    /**
     * Log API errors (always logged in development, but sanitized)
     */
    apiError(url, error) {
        if (isDevelopment) {
            const sanitizedError = {
                message: error?.message || 'Unknown error',
                ...(error?.response && {
                    response: {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: sanitizeData(error.response.data)
                    }
                })
            };
            console.error('❌ API Error:', {
                url,
                error: sanitizedError
            });
        }
    },
    
    /**
     * Log component lifecycle events
     */
    component(componentName, event, data) {
        if (isDevelopment && isDebugEnabled) {
            const sanitized = data ? sanitizeData(data) : undefined;
            console.log(`[${componentName}] ${event}`, sanitized || '');
        }
    }
};

export default debug;

