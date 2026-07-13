import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { askArenaMindAI, toPlainText } from '../../src/utils/ai';
import { initialGates, initialIncidents, initialTransit } from '../../src/utils/mockData';

describe('ArenaMind deterministic AI fallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('normalizes safe model formatting for plain-text rendering', () => {
    expect(toPlainText('### Brief\n- **Gate C** is crowded')).toBe('Brief\n- Gate C is crowded');
  });

  async function ask(query: string, language: string, role: 'fan' | 'operator' = 'fan') {
    const pending = askArenaMindAI(query, {
      role,
      language,
      gates: initialGates,
      transit: initialTransit,
      activeIncidents: initialIncidents,
      seatSection: 'Section 212',
    });
    await vi.advanceTimersByTimeAsync(350);
    return pending;
  }

  it('uses live gate load to produce a grounded recommendation', async () => {
    const response = await ask('Which gate has the shortest queue?', 'en');
    expect(response.detectedIntent).toBe('gate_status');
    expect(response.answer).toContain('Gate C');
    expect(response.answer).toContain('Gate B');
    expect(response.suggestedActions?.[0].payload).toBe('gates');
  });

  it('provides a French accessibility route offline', async () => {
    const response = await ask('wheelchair elevator', 'fr');
    expect(response.answer).toContain('Porte E');
    expect(response.answer).toContain('fauteuil roulant');
  });

  it('provides an Arabic transit alternative offline', async () => {
    const response = await ask('metro', 'ar');
    expect(response.answer).toContain('الخط المحلي 2');
    expect(response.confidenceScore).toBe(0.97);
  });

  it('summarizes actual incident and gate counts for operators', async () => {
    const response = await ask('operations status summary', 'en', 'operator');
    expect(response.answer).toContain('3** active');
    expect(response.answer).toContain('2** gates');
    expect(response.detectedIntent).toBe('ops_summary');
  });

  it('reports low confidence for unsupported questions', async () => {
    const response = await ask('Where can I buy a team scarf?', 'fr');
    expect(response.detectedIntent).toBe('fallback');
    expect(response.confidenceScore).toBe(0.5);
  });

  it.each([
    ['en', 'wheelchair elevator', 'accessibility_info', 'Gate E'],
    ['es', 'discapacidad', 'accessibility_info', 'Puerta E'],
    ['ar', 'wheelchair elevator', 'accessibility_info', 'البوابة E'],
    ['fr', 'gate queue', 'gate_status', '35 à 45'],
    ['ar', 'gate queue', 'gate_status', '35 إلى 45'],
    ['es', 'metro', 'transit_recommendation', 'Línea 2 Local'],
    ['en', 'metro', 'transit_recommendation', 'Line 2 Local'],
    ['es', 'food', 'food_location', 'North Concourse Grill'],
    ['fr', 'food', 'food_location', 'végétaliennes'],
    ['ar', 'food', 'food_location', 'مطعم الرواق الشمالي'],
    ['en', 'food', 'food_location', 'vegan options'],
    ['es', 'recycle', 'sustainability_info', '50 puntos'],
    ['fr', 'recycle', 'sustainability_info', '50 éco-points'],
    ['ar', 'recycle', 'sustainability_info', '50 نقطة'],
    ['en', 'recycle', 'sustainability_info', '50 Eco-Points'],
  ])('covers %s %s guidance', async (language, query, intent, phrase) => {
    const response = await ask(query, language);
    expect(response.detectedIntent).toBe(intent);
    expect(response.answer).toContain(phrase);
  });

  it('provides a Spanish operator brief', async () => {
    const response = await ask('resumen operativo', 'es', 'operator');
    expect(response.answer).toContain('Incidentes Activos');
    expect(response.answer).toContain('Puertas C y D');
  });

  it('explains the incident workflow to operators', async () => {
    const response = await ask('incident assistance', 'en', 'operator');
    expect(response.detectedIntent).toBe('incident_help');
    expect(response.answer).toContain('auto-classify severity');
  });

  it('returns a bounded operator fallback', async () => {
    const response = await ask('unknown command', 'en', 'operator');
    expect(response.detectedIntent).toBe('fallback_ops');
    expect(response.confidenceScore).toBe(0.5);
  });
});
