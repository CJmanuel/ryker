export interface ErrorContext {
  userId?: string;
  department?: string;
  page?: string;
  action?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

let isInitialized = false;

/**
 * Initialize error reporting (when providers are available)
 * This is called dynamically to avoid build errors if packages aren't installed
 */
export const initializeErrorReporting = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // Dynamically import if needed
    // const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
    // const { initializePerformance } = await import('firebase/performance');

    // Firebase Analytics is auto-initialized
    // Performance monitoring would be set up here
    isInitialized = true;
    console.log('Error reporting initialized');
  } catch (err) {
    console.warn('Error reporting not available:', err);
  }
};

/**
 * Report an error with context
 */
export const reportError = (error: Error | unknown, context?: ErrorContext): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';

  const logEntry = {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Report]', logEntry);
  }

  // In production, these would be sent to Sentry, Crashlytics, etc.
  // For now, logs are captured via Firestore activity logs
};

/**
 * Set user context for error reporting
 */
export const setErrorContext = (_userId: string, _department: string): void => {
  // This would set the user context in Sentry/Crashlytics
  // Example for Sentry:
  // Sentry.setUser({ id: userId, context: { department } });
};

/**
 * Capture performance metrics
 */
export const captureMetric = (name: string, value: number, tags?: Record<string, string>): void => {
  if (import.meta.env.DEV) {
    console.debug(`[Metric] ${name}: ${value}`, tags);
  }
  // Would send to performance monitoring service
};

export default {
  initializeErrorReporting,
  reportError,
  setErrorContext,
  captureMetric,
};
