import { describe, expect, it } from 'vitest';
import { generateOperationalDecisions } from '../../src/utils/decisionEngine';
import { initialGates, initialIncidents, initialTransit } from '../../src/utils/mockData';

describe('generateOperationalDecisions', () => {
  it('ranks immediate crowd and safety actions before transport guidance', () => {
    const decisions = generateOperationalDecisions({
      gates: initialGates,
      transit: initialTransit,
      incidents: initialIncidents,
    });

    expect(decisions).toHaveLength(3);
    expect(decisions.map(item => item.id)).toEqual([
      'safety-inc-003',
      'crowd-rebalance',
      'transit-diversion',
    ]);
    expect(decisions[0].urgency).toBe('IMMEDIATE');
    expect(decisions[2].urgency).toBe('NEXT 5 MIN');
  });

  it('grounds the crowd recommendation in observed gate metrics', () => {
    const [crowd] = generateOperationalDecisions({
      gates: initialGates,
      transit: [],
      incidents: [],
    });

    expect(crowd.title).toContain('Gate C + Gate D');
    expect(crowd.recommendation).toContain('Gate B');
    expect(crowd.evidence).toContain('Gate D (South Entry): 92% load, 45 min wait');
    expect(crowd.projectedImpact).toMatch(/about \d+ min/);
    expect(crowd.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('does not recommend diversion when no destination has safe capacity', () => {
    const saturatedGates = initialGates.map(gate => (
      gate.status === 'Open' ? { ...gate, currentLoad: 90, avgWaitMinutes: 30 } : gate
    ));
    const decisions = generateOperationalDecisions({ gates: saturatedGates, transit: [], incidents: [] });

    expect(decisions).toEqual([]);
  });

  it('removes safety actions after the critical incident is resolved', () => {
    const resolved = initialIncidents.map(incident => ({ ...incident, status: 'Resolved' as const }));
    const decisions = generateOperationalDecisions({ gates: [], transit: [], incidents: resolved });

    expect(decisions.some(item => item.category === 'Safety response')).toBe(false);
  });

  it('does not invent a transit alternative when every route is disrupted', () => {
    const disrupted = initialTransit.map(item => ({ ...item, status: 'Crowded' as const }));
    const decisions = generateOperationalDecisions({ gates: [], transit: disrupted, incidents: [] });

    expect(decisions).toEqual([]);
  });
});
