import { describe, expect, it } from 'vitest';
import { generateOperationalDecisions } from '../../src/utils/decisionEngine';
import type { GateInfo, IncidentReport, TransitInfo } from '../../src/utils/mockData';

const gate = (id: string, currentLoad: number, avgWaitMinutes: number): GateInfo => ({
  id,
  name: `Gate ${id.toUpperCase()} (${id === 'a' ? 'North' : 'West'} Entry)`,
  status: 'Open',
  currentLoad,
  avgWaitMinutes,
  location: id === 'a' ? 'North Concourse' : 'West Concourse',
});

const crowdDecision = (source: GateInfo) => generateOperationalDecisions({
  gates: [source, gate('b', 20, 2)],
  transit: [],
  incidents: [],
}).find(decision => decision.id === 'crowd-rebalance');

describe('crowd decision threshold matrix', () => {
  it.each(Array.from({ length: 80 }, (_, load) => [load]))(
    'does not trigger below the 80%% load threshold at %i%%',
    (load) => {
      expect(crowdDecision(gate('a', load, 5))).toBeUndefined();
    },
  );

  it.each(Array.from({ length: 21 }, (_, index) => [index + 80]))(
    'triggers at or above the load threshold at %i%%',
    (load) => {
      const decision = crowdDecision(gate('a', load, 5));
      expect(decision).toBeDefined();
      expect(decision?.evidence[0]).toContain(`${load}% load`);
    },
  );

  it.each(Array.from({ length: 25 }, (_, wait) => [wait]))(
    'does not trigger below the 25 minute wait threshold at %i minutes',
    (wait) => {
      expect(crowdDecision(gate('a', 50, wait))).toBeUndefined();
    },
  );

  it.each(Array.from({ length: 36 }, (_, index) => [index + 25]))(
    'triggers at or above the wait threshold at %i minutes',
    (wait) => {
      const decision = crowdDecision(gate('a', 50, wait));
      expect(decision).toBeDefined();
      expect(decision?.evidence[0]).toContain(`${wait} min wait`);
    },
  );
});

describe('incident decision matrix', () => {
  const severities: IncidentReport['severity'][] = ['CRITICAL', 'MAJOR', 'MINOR'];
  const statuses: IncidentReport['status'][] = ['Open', 'Investigating', 'Resolved'];
  const matrix = severities.flatMap(severity => statuses.map(status => [severity, status] as const));

  it.each(matrix)('handles %s incidents in %s state', (severity, status) => {
    const incident: IncidentReport = {
      id: `incident-${severity}-${status}`,
      category: 'Medical',
      severity,
      location: 'Section 212',
      description: 'Fan requires assessment.',
      reportedTime: '20:04',
      status,
      recommendedAction: 'Dispatch the nearest medical team.',
    };
    const decisions = generateOperationalDecisions({ gates: [], transit: [], incidents: [incident] });
    const shouldRecommend = severity === 'CRITICAL' && status !== 'Resolved';
    expect(decisions.some(decision => decision.category === 'Safety response')).toBe(shouldRecommend);
  });
});

describe('transport alternative matrix', () => {
  const types: TransitInfo['type'][] = ['Metro', 'Bus', 'Shuttle', 'Parking'];
  const matrix = types.flatMap(source => types.map(alternative => [source, alternative] as const));

  it.each(matrix)('evaluates a crowded %s against a normal %s', (sourceType, alternativeType) => {
    const source: TransitInfo = {
      type: sourceType,
      route: `${sourceType} source route`,
      status: 'Crowded',
      waitMinutes: 18,
      nextArrival: '12 mins',
    };
    const alternative: TransitInfo = {
      type: alternativeType,
      route: `${alternativeType} alternative route`,
      status: 'Normal',
      waitMinutes: 4,
      nextArrival: '3 mins',
    };
    const decisions = generateOperationalDecisions({ gates: [], transit: [source, alternative], incidents: [] });
    const transportDecision = decisions.find(decision => decision.category === 'Transport');

    expect(Boolean(transportDecision)).toBe(alternativeType !== 'Parking');
    if (transportDecision) {
      expect(transportDecision.recommendation).toContain(alternative.route);
      expect(transportDecision.confidence).toBeGreaterThan(0);
      expect(transportDecision.confidence).toBeLessThanOrEqual(1);
    }
  });
});
