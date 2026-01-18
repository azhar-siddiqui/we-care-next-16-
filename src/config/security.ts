/**
 * Security configuration for production environment
 */

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    SIGNUP: {
      MAX_ATTEMPTS: 5,
      WINDOW_SECONDS: 3600, // 1 hour
    },
    LOGIN: {
      MAX_ATTEMPTS: 5,
      WINDOW_SECONDS: 3600, // 1 hour
    },
    VERIFY_OTP: {
      MAX_ATTEMPTS: 3,
      WINDOW_SECONDS: 1800, // 30 minutes
    },
  },

  // Request limits
  REQUEST_LIMITS: {
    MAX_BODY_SIZE: 1024 * 1024, // 1MB
    MAX_BODY_SIZE_OTP: 1024 * 10, // 10KB for OTP routes
    TIMEOUT_MS: 30000, // 30 seconds
  },

  // Security headers
  HEADERS: {
    CONTENT_SECURITY_POLICY:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    X_FRAME_OPTIONS: "DENY",
    X_CONTENT_TYPE_OPTIONS: "nosniff",
    X_XSS_PROTECTION: "1; mode=block",
    REFERRER_POLICY: "strict-origin-when-cross-origin",
    PERMISSIONS_POLICY: "geolocation=(), microphone=(), camera=()",
  },

  // Input validation
  VALIDATION: {
    EMAIL_MAX_LENGTH: 254,
    OTP_MIN_LENGTH: 4,
    OTP_MAX_LENGTH: 8,
    PASSWORD_MIN_LENGTH: 8,
  },

  // Logging
  LOGGING: {
    ENABLE_SECURITY_EVENTS: true,
    SENSITIVE_DATA_MASKING: true,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
  },

  // Environment-specific settings
  ENVIRONMENT: {
    IS_PRODUCTION: process.env.NODE_ENV === "production",
    ENABLE_DETAILED_LOGGING: process.env.NODE_ENV !== "production",
  },
} as const;
