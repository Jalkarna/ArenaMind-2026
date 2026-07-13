import type { GateInfo, IncidentReport, TransitInfo } from './mockData';

export type DecisionCategory = 'Crowd flow' | 'Safety response' | 'Transport';
export type DecisionUrgency = 'IMMEDIATE' | 'NEXT 5 MIN' | 'MONITOR';

export interface OperationalDecision {
  id: string;
  category: DecisionCategory;
  urgency: DecisionUrgency;
  title: string;
  recommendation: string;
  rationale: string;
  evidence: string[];
  confidence: number;
  projectedImpact: string;
  actionLabel: string;
}

interface DecisionContext {
  gates: GateInfo[];
  transit: TransitInfo[];
  incidents: IncidentReport[];
}

const byWaitTime = (a: GateInfo, b: GateInfo) => a.avgWaitMinutes - b.avgWaitMinutes;

/**
 * Combines deterministic venue thresholds with AI-ready evidence. Operators can
 * inspect why a recommendation exists before approving any state change.
 */
export function generateOperationalDecisions({ gates, transit, incidents }: DecisionContext): OperationalDecision[] {
  const decisions: OperationalDecision[] = [];
  const overloadedGates = gates.filter(
    gate => gate.status === 'Open' && (gate.currentLoad >= 80 || gate.avgWaitMinutes >= 25),
  );
  const alternativeGates = gates
    .filter(gate => gate.status === 'Open' && gate.currentLoad < 60 && gate.avgWaitMinutes <= 10)
    .sort(byWaitTime);

  if (overloadedGates.length > 0 && alternativeGates.length > 0) {
    const sources = overloadedGates.map(gate => gate.name.match(/Gate [A-Z]/)?.[0] ?? gate.name);
    const targets = alternativeGates
      .slice(0, 2)
      .map(gate => gate.name.match(/Gate [A-Z]/)?.[0] ?? gate.name);
    const averageCurrentWait = Math.round(
      overloadedGates.reduce((total, gate) => total + gate.avgWaitMinutes, 0) / overloadedGates.length,
    );
    const averageTargetWait = Math.round(
      alternativeGates.slice(0, 2).reduce((total, gate) => total + gate.avgWaitMinutes, 0) /
        Math.min(alternativeGates.length, 2),
    );

    decisions.push({
      id: 'crowd-rebalance',
      category: 'Crowd flow',
      urgency: 'IMMEDIATE',
      title: `Rebalance arrivals away from ${sources.join(' + ')}`,
      recommendation: `Restrict new arrivals at ${sources.join(' and ')} and publish routes to ${targets.join(' and ')}.`,
      rationale: 'Entry demand is above the safe operating threshold while nearby gates have usable capacity.',
      evidence: overloadedGates.map(
        gate => `${gate.name}: ${gate.currentLoad}% load, ${gate.avgWaitMinutes} min wait`,
      ),
      confidence: alternativeGates.length >= 2 ? 0.96 : 0.88,
      projectedImpact: `Reduce average entry wait by about ${Math.max(0, averageCurrentWait - averageTargetWait)} min`,
      actionLabel: 'Approve gate plan',
    });
  }

  const criticalIncidents = incidents.filter(
    incident => incident.severity === 'CRITICAL' && incident.status !== 'Resolved',
  );
  if (criticalIncidents.length > 0) {
    const incident = criticalIncidents[0];
    decisions.push({
      id: `safety-${incident.id}`,
      category: 'Safety response',
      urgency: 'IMMEDIATE',
      title: `Confirm response path to ${incident.location}`,
      recommendation: incident.recommendedAction ?? 'Clear an access path and dispatch the nearest trained response team.',
      rationale: 'A critical incident remains open and requires a confirmed human owner and unobstructed response route.',
      evidence: [
        `${incident.category} incident reported at ${incident.reportedTime}`,
        `Current status: ${incident.status}`,
      ],
      confidence: 0.99,
      projectedImpact: 'Protect the emergency response route and reduce handoff delay',
      actionLabel: 'Confirm response',
    });
  }

  const crowdedTransit = transit.find(item => item.status === 'Crowded');
  const transitAlternative = transit
    .filter(item => item.status === 'Normal' && item.type !== 'Parking')
    .sort((a, b) => a.waitMinutes - b.waitMinutes)[0];
  if (crowdedTransit && transitAlternative) {
    decisions.push({
      id: 'transit-diversion',
      category: 'Transport',
      urgency: 'NEXT 5 MIN',
      title: `Shift outbound demand from ${crowdedTransit.route.split(' (')[0]}`,
      recommendation: `Send multilingual wayfinding to ${transitAlternative.route} before the post-match surge.`,
      rationale: 'A crowded route and a normal-capacity alternative are available at the same time.',
      evidence: [
        `${crowdedTransit.route}: ${crowdedTransit.status.toLowerCase()}`,
        `${transitAlternative.route}: ${transitAlternative.waitMinutes} min wait`,
      ],
      confidence: 0.91,
      projectedImpact: 'Distribute outbound demand before full-time',
      actionLabel: 'Draft transit alert',
    });
  }

  return decisions.sort((a, b) => {
    const rank: Record<DecisionUrgency, number> = { IMMEDIATE: 0, 'NEXT 5 MIN': 1, MONITOR: 2 };
    return rank[a.urgency] - rank[b.urgency] || b.confidence - a.confidence;
  });
}
