import { useMemo, useState } from 'react';
import { Activity, Check, ChevronDown, Gauge, Sparkles } from 'lucide-react';
import { generateOperationalDecisions } from '../utils/decisionEngine';
import type { OperationalDecision } from '../utils/decisionEngine';
import type { GateInfo, IncidentReport, TransitInfo } from '../utils/mockData';

interface DecisionQueueProps {
  gates: GateInfo[];
  transit: TransitInfo[];
  incidents: IncidentReport[];
  onApprove: (decision: OperationalDecision) => void;
}

type DecisionState = 'pending' | 'approved';

export function DecisionQueue({ gates, transit, incidents, onApprove }: DecisionQueueProps) {
  const liveDecisions = useMemo(
    () => generateOperationalDecisions({ gates, transit, incidents }),
    [gates, transit, incidents],
  );
  const [decisionStates, setDecisionStates] = useState<Record<string, DecisionState>>({});
  const [approvedDecisions, setApprovedDecisions] = useState<OperationalDecision[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(liveDecisions[0]?.id ?? null);
  const decisions = [
    ...liveDecisions,
    ...approvedDecisions.filter(approved => !liveDecisions.some(decision => decision.id === approved.id)),
  ];

  const approve = (decision: OperationalDecision) => {
    onApprove(decision);
    setDecisionStates(current => ({ ...current, [decision.id]: 'approved' }));
    setApprovedDecisions(current => current.some(item => item.id === decision.id) ? current : [...current, decision]);
  };

  return (
    <section className="decision-queue card glass-card" aria-labelledby="decision-queue-title">
      <div className="decision-queue-header">
        <div>
          <span className="decision-overline"><Activity size={13} /> Live decision support</span>
          <h2 id="decision-queue-title">Operator action queue</h2>
        </div>
        <div className="decision-signal" aria-label={`${decisions.length} recommendations from live venue signals`}>
          <span>{decisions.length}</span> recommendations
        </div>
      </div>

      <div className="decision-list">
        {decisions.map(decision => {
          const isApproved = decisionStates[decision.id] === 'approved';
          const isExpanded = expandedId === decision.id;
          return (
            <article className={`decision-row ${isApproved ? 'approved' : ''}`} key={decision.id} data-testid={`decision-${decision.id}`}>
              <div className="decision-priority">
                <span className={`decision-urgency urgency-${decision.urgency.toLowerCase().replaceAll(' ', '-')}`}>
                  {decision.urgency}
                </span>
                <span>{decision.category}</span>
              </div>
              <div className="decision-main">
                <button
                  className="decision-summary"
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`decision-detail-${decision.id}`}
                  onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                >
                  <span>
                    <strong>{decision.title}</strong>
                    <small>{decision.recommendation}</small>
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {isExpanded && (
                  <div className="decision-detail" id={`decision-detail-${decision.id}`}>
                    <p>{decision.rationale}</p>
                    <ul>
                      {decision.evidence.map(item => <li key={item}>{item}</li>)}
                    </ul>
                    <div className="decision-trust-row">
                      <span><Gauge size={13} /> {Math.round(decision.confidence * 100)}% confidence</span>
                      <span><Sparkles size={13} /> AI-assisted, rules verified</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="decision-impact">
                <small>Projected impact</small>
                <span>{decision.projectedImpact}</span>
              </div>
              <button
                className={`decision-approve ${isApproved ? 'is-approved' : ''}`}
                type="button"
                onClick={() => approve(decision)}
                disabled={isApproved}
                id={`btn-approve-${decision.id}`}
              >
                <Check size={14} /> {isApproved ? 'Approved' : decision.actionLabel}
              </button>
            </article>
          );
        })}
      </div>
      <p className="decision-disclaimer">Recommendations use the current simulated venue feed. An operator must approve every action.</p>
    </section>
  );
}
