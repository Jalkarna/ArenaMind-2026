import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { CSRFProtection, SessionManager, maskPII, sanitizeInput } from '../../src/utils/security';

describe('security utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      crypto: webcrypto,
      location: { reload: vi.fn() },
    });
    CSRFProtection.rotateToken();
  });

  it('encodes active HTML and attribute characters', () => {
    expect(sanitizeInput(`<img src=x onerror="alert(1)">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
  });

  it.each([
    ['email', 'diego.rossi@example.org', 'di***@example.org'],
    ['phone', '+1 (201) 555-0198', '***-***-0198'],
    ['ticket', 'TK-992F', 'FIFA-2026-***-992F'],
  ] as const)('masks %s identifiers', (type, value, expected) => {
    expect(maskPII(value, type)).toBe(expected);
  });

  it('uses safe masks for malformed or short identifiers', () => {
    expect(maskPII('invalid', 'email')).toBe('***@***.***');
    expect(maskPII('12', 'phone')).toBe('***-***');
    expect(maskPII('ABC', 'ticket')).toBe('****');
    expect(maskPII('', 'ticket')).toBe('');
  });

  it('rotates CSRF tokens and rejects the previous token', () => {
    const first = CSRFProtection.generateToken();
    const second = CSRFProtection.rotateToken();
    expect(second).not.toBe(first);
    expect(CSRFProtection.validateToken(first)).toBe(false);
    expect(CSRFProtection.validateToken(second)).toBe(true);
  });

  it('creates a host-prefixed session token and clears the session', () => {
    const session = SessionManager.startSession({
      userId: 'operator-1', role: 'operator', userName: 'Diego Rossi',
    });
    expect(session.sessionToken).toMatch(/^__Host-session-/);
    expect(SessionManager.getSession()).toEqual(session);
    SessionManager.endSession();
    expect(SessionManager.getSession()).toBeNull();
    expect(window.location.reload).toHaveBeenCalledOnce();
  });
});
