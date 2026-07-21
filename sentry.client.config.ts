import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    beforeSendTransaction(event) {
      // Redact URLs with sensitive data
      if (event.request?.url) {
        const url = event.request.url;
        if (url.includes('password') || url.includes('pin=')) {
          event.request.url = url.split('?')[0];
        }
      }
      return event;
    },
  });
}
