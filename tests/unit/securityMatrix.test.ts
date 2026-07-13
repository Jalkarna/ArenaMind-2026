import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CSRFProtection, maskPII, sanitizeInput } from '../../src/utils/security';

describe('adversarial input encoding matrix', () => {
  const tags = ['script', 'img', 'svg', 'iframe', 'object', 'video', 'audio', 'details', 'math', 'form'];
  const handlers = ['alert', 'confirm', 'prompt', 'fetch', 'eval'];
  const payloads = tags.flatMap(tag => handlers.map(handler => [
    tag,
    handler,
    `<${tag} data-test="${handler}('/admin')">'unsafe' & value</${tag}>`,
  ] as const));

  it.each(payloads)('encodes <%s> with %s payloads', (_tag, _handler, payload) => {
    const encoded = sanitizeInput(payload);
    expect(encoded).not.toMatch(/[<>"'/]/);
    expect(encoded).toContain('&lt;');
    expect(encoded).toContain('&gt;');
    expect(encoded).toContain('&quot;');
    expect(encoded).toContain('&#x27;');
    expect(encoded).toContain('&amp;');
  });
});

describe('PII masking matrix', () => {
  it.each(Array.from({ length: 40 }, (_, value) => {
    const suffix = value.toString().padStart(4, '0');
    return [`+1 (201) 555-${suffix}`, suffix] as const;
  }))('preserves only the final four digits of %s', (phone, suffix) => {
    const masked = maskPII(phone, 'phone');
    expect(masked).toBe(`***-***-${suffix}`);
    expect(masked).not.toContain('201');
    expect(masked).not.toContain('555');
  });

  it.each(Array.from({ length: 20 }, (_, value) => {
    const suffix = value.toString(16).toUpperCase().padStart(4, '0');
    return [`MATCH42-SECTION212-${suffix}`, suffix] as const;
  }))('preserves only the final ticket characters for %s', (ticket, suffix) => {
    expect(maskPII(ticket, 'ticket')).toBe(`FIFA-2026-***-${suffix}`);
  });
});

describe('action token rotation matrix', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { crypto: webcrypto });
    CSRFProtection.rotateToken();
  });

  it.each(Array.from({ length: 25 }, (_, index) => [index]))(
    'creates a unique 128-bit token on rotation %i',
    () => {
      const previous = CSRFProtection.generateToken();
      const rotated = CSRFProtection.rotateToken();
      expect(rotated).toMatch(/^[a-f0-9]{32}$/);
      expect(rotated).not.toBe(previous);
      expect(CSRFProtection.validateToken(previous)).toBe(false);
      expect(CSRFProtection.validateToken(rotated)).toBe(true);
    },
  );
});
