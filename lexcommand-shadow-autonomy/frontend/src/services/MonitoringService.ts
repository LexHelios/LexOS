import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { PerformanceObserver, performance } from 'perf_hooks';

class MonitoringService {
  private static instance: MonitoringService;
  private performanceObserver: PerformanceObserver;

  private constructor() {
    this.initializeSentry();
    this.initializePerformanceMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeSentry() {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  }

  private initializePerformanceMonitoring() {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 1000) { // Log slow operations (>1s)
          Sentry.captureMessage('Slow operation detected', {
            level: 'warning',
            extra: {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
            },
          });
        }
      });
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, { level });
  }

  setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser(user);
  }

  clearUser() {
    Sentry.setUser(null);
  }

  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

export const monitoringService = MonitoringService.getInstance(); 