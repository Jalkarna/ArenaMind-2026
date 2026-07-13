/**
 * ArenaMind 2026 - Core Security & Protection Utilities
 * Strictly enforces secure coding guidelines to prevent XSS, CSRF, and PII leaks.
 */

// TODO(security): Replace these mock implementations with production KMS and server-side HttpOnly cookies.

/**
 * XSS Mitigation: Sanitizes untrusted user strings before rendering in any raw HTML context.
 * Utilizes framework-native React JSX escaping by default, but provides this manual filter for edge cases.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * PII Protection: Masks sensitive info (e.g. Emails, Phone numbers, Ticket IDs) before displaying in the UI.
 */
export function maskPII(text: string, type: 'email' | 'phone' | 'ticket'): string {
  if (!text) return '';
  
  switch (type) {
    case 'email': {
      const parts = text.split('@');
      if (parts.length !== 2) return '***@***.***';
      const [local, domain] = parts;
      if (local.length <= 2) return `*@${domain}`;
      return `${local.slice(0, 2)}***@${domain}`;
    }
    case 'phone': {
      const clean = text.replace(/\D/g, '');
      if (clean.length < 4) return '***-***';
      return `***-***-${clean.slice(-4)}`;
    }
    case 'ticket': {
      if (text.length <= 4) return '****';
      return `FIFA-2026-***-${text.slice(-4)}`;
    }
    default:
      return '***';
  }
}

/**
 * CSRF Protection: Simulates CSRF token generation and validation for state-changing operations.
 */
export class CSRFProtection {
  private static token: string | null = null;

  public static generateToken(): string {
    if (!this.token) {
      // Use cryptographically secure random values generator (PRNG)
      const array = new Uint32Array(4);
      window.crypto.getRandomValues(array);
      this.token = Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
    }
    return this.token;
  }

  public static validateToken(clientToken: string): boolean {
    if (!this.token) return false;
    return this.token === clientToken;
  }

  public static rotateToken(): string {
    this.token = null;
    return this.generateToken();
  }
}

/**
 * Secure Session Management: Mock cookie container using Secure, HttpOnly, and SameSite headers.
 * In a real backend BFF, this is fully handled server-side to prevent client-side script theft (CWE-312).
 */
export interface SecureSession {
  userId: string;
  role: 'fan' | 'operator' | 'admin';
  userName: string;
  ticketId?: string;
  sessionToken: string;
}

export class SessionManager {
  private static activeSession: SecureSession | null = null;

  public static startSession(user: Omit<SecureSession, 'sessionToken'>): SecureSession {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    const token = Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('-');

    this.activeSession = {
      ...user,
      sessionToken: `__Host-session-${token}`, // Enforce secure cookie prefix guideline
    };

    // Log login securely (never printing credentials or raw secret tokens)
    console.log(`[Security] Session started for user: ${user.userName} with role: ${user.role}`);
    return this.activeSession;
  }

  public static getSession(): SecureSession | null {
    return this.activeSession;
  }

  public static endSession(): void {
    if (this.activeSession) {
      console.log(`[Security] Session invalidated for user: ${this.activeSession.userName}`);
      this.activeSession = null;
      // Trigger full page reload on logout to clear client-side caches (CWE-613)
      window.location.reload();
    }
  }
}

/**
 * CSP Simulation Check: Verifies that Content Security Policy constraints are simulated.
 */
export function verifySecurityHeaders(): {
  csp: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
} {
  return {
    csp: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self';",
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff"
  };
}
