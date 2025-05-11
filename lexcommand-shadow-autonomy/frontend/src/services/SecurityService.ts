import { monitoringService } from './MonitoringService';

class SecurityService {
  private static instance: SecurityService;
  private csrfToken: string | null = null;

  private constructor() {
    this.initializeCSRF();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private initializeCSRF() {
    // Get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      this.csrfToken = metaTag.getAttribute('content');
    }
  }

  getSecurityHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }

  sanitizeInput(input: string): string {
    // Basic XSS prevention
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  validateInput(input: string, type: 'email' | 'username' | 'password'): boolean {
    try {
      switch (type) {
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        case 'username':
          return /^[a-zA-Z0-9_-]{3,20}$/.test(input);
        case 'password':
          return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(input);
        default:
          return false;
      }
    } catch (error) {
      monitoringService.captureError(error as Error, { input, type });
      return false;
    }
  }

  generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  isSecureContext(): boolean {
    return window.isSecureContext;
  }

  validateOrigin(origin: string): boolean {
    const allowedOrigins = process.env.REACT_APP_ALLOWED_ORIGINS?.split(',') || [];
    return allowedOrigins.includes(origin);
  }
}

export const securityService = SecurityService.getInstance(); 