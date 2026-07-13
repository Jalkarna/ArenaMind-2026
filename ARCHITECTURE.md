# ArenaMind 2026 Architecture

## Challenge fit

ArenaMind is a GenAI-enabled stadium operations and tournament experience platform for the FIFA World Cup 2026. It directly supports navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, and real-time decision support.

## Signal-to-action flow

```text
Venue signals (gates, transit, incidents)
                    |
                    v
Deterministic decision engine -----> ranked evidence + projected impact
                    |                              |
                    v                              v
Grounded GenAI explanation                 operator approval gate
                    |                              |
                    +--------------+---------------+
                                   v
             gate control / dispatch / multilingual broadcast
```

The deterministic engine in `src/utils/decisionEngine.ts` creates a stable safety envelope. GenAI adds natural-language interpretation, multilingual communication, and incident-plan drafting; it does not bypass operational thresholds or execute actions autonomously.

## AI runtime

- `server.js` is a bounded backend-for-frontend proxy. It keeps provider credentials off the client, validates request size and model output, applies rate limits, aborts slow calls, and returns `503` when hosted AI is unavailable.
- `src/utils/ai.ts` provides an offline, deterministic assistant in English, Spanish, French, and Arabic. This keeps navigation and safety guidance available during venue connectivity loss.
- Every operational recommendation includes source evidence, confidence, projected impact, and an explicit human approval action.
- Model output is rendered as text, never injected as HTML. Incident triage accepts only the documented severity schema.

## Product surfaces

| Surface | Primary users | Decisions supported |
| --- | --- | --- |
| Fan Hub | Fans, visitors, volunteers | Low-wait entry, accessible routing, transit alternatives, concessions, recycling |
| Ops Command | Venue managers, safety, transport, stewards | Crowd diversion, emergency response, task dispatch, gate overrides, multilingual alerts |

## Resilience and security

- Hosted generation fails closed into deterministic venue rules.
- API payloads are capped at 16 KB; field limits are enforced at both UI and API boundaries.
- The proxy sets CSP, clickjacking, content-type, referrer, and no-store headers.
- Provider calls have an 8-second abort deadline and schema validation.
- UI action tokens rotate on workspace changes; sensitive identifiers are masked before display.
- The repository makes no certification claim. The venue feed and session are explicitly identified as simulated.

## Performance model

Derived recommendations are memoized from the three live signal collections. The engine is linear in gates, incidents, and transit routes (`O(g + i + t)`) and runs locally, so a provider outage cannot block operational controls.
