// TODO: Replace mock implementations with production KMS and server-side HttpOnly cookies.

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

export class CSRFProtection {
  private static token: string | null = null;

  public static generateToken(): string {
    if (!this.token) {
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
      sessionToken: `__Host-session-${token}`,
    };

    return this.activeSession;
  }

  public static getSession(): SecureSession | null {
    return this.activeSession;
  }

  public static endSession(): void {
    if (this.activeSession) {
      this.activeSession = null;
      window.location.reload();
    }
  }
}

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
