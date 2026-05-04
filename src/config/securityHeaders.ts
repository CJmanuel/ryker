// src/config/securityHeaders.ts
// Security headers and CORS configuration
// These are typically set at the server/hosting level (Firebase Hosting, Nginx, etc.)
// This file documents the recommended security configuration

/**
 * Recommended Security Headers
 * 
 * Add these to your hosting configuration (firebase.json or web server)
 * 
 * Headers:
 * - Strict-Transport-Security: Forces HTTPS
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Controls browser features
 */

export const securityConfig = {
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebase.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      "frame-src 'self' https://*.firebase.com https://accounts.google.com",
      "connect-src 'self' https://*.firebase.com https://*.firebasedatabase.app https://*.firebaseio.com https://apis.google.com",
      "form-action 'self'",
      "base-uri 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'payment=()',
    ].join(', '),
  },

  /**
   * CORS Configuration
   * Restrict to your own domain in production
   */
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      // Add your production domain here
      // 'https://yourdomain.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  /**
   * Cookie Security Settings
   * Use these when setting cookies (e.g., for session tokens)
   */
  cookieOptions: {
    httpOnly: true,
    secure: true, // HTTPS only in production
    sameSite: 'Strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  /**
   * Rate Limiting Configuration
   * Implement on your backend/Cloud Functions
   */
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      auth: 5, // 5 login attempts per 15 min
      api: 100, // 100 API calls per 15 min
      upload: 20, // 20 uploads per 15 min
    },
  },
};



export const firebaseHostingConfig = {
  headers: [
    {
      source: '**',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=()',
        },
      ],
    },
  ],

  /**
   * Note: Content-Security-Policy should be set dynamically or in a function
   * because it may conflict with inline scripts in Vite
   */
};

export default securityConfig;
