# ArenaMind 2026: FIFA World Cup Stadium Operations & Fan Experience

Public repository: https://github.com/Jalkarna/ArenaMind-2026

ArenaMind 2026 is a GenAI-enabled stadium operations and fan-experience platform for the FIFA World Cup 2026. It turns live crowd, transit, accessibility, and incident signals into grounded guidance for fans and explainable decisions for venue teams.

It addresses the challenge across all eight named domains: navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, and real-time decision support.

## Two verticals, one workspace
1. **Fan Hub**: For fans, visitors, and volunteers. Provides a multilingual assistant, wayfinding, live transit wait times, accessibility controls (visual and audio), and eco-points gamification.
2. **Ops Command**: For stadium managers, safety officers, and security teams. Shows crowd heatmaps, incident reports, gate flow overrides, and multilingual emergency broadcasting.

---

## Key Features

### 1. Multilingual Assistant
- Responds to fan inquiries in English, Spanish, French, and Arabic.
- Detects intent (gates, accessibility, transit, food, recycling) and suggests map overlays or dispatch commands.
- Generates operational summaries for organizers, triaging incidents and suggesting crowd diversions.

### 2. Interactive SVG Stadium Map
- Visual layout of entries, concessions, medical bays, transit stations, and ADA elevators.
- Toggle overlay layers for wheelchair routes, gate loads, etc.
- Heatmap flags congested gates (C and D) with color coding.

### 3. Incident Log & Auto-Triage
- CSRF-protected incident submission with input sanitization.
- AI parses descriptions to classify severity (`CRITICAL`, `MAJOR`, `MINOR`), draft response plans, and create dispatcher tasks.

### 4. Staff Dispatch Board
- Kanban board (`Unassigned`, `In Progress`, `Completed`) for claiming, tracking, and closing tasks in real-time.

### 5. Multilingual Emergency Broadcasts
- Broadcast alerts translated via AI into English, Spanish, French, and Arabic for stadium displays and the fan app.

### 6. Sustainability Tracker
- Fans scan smart-bin QR codes to log cup deposits, offset CO2 (0.5kg per deposit), and earn Eco-Points.
- Points redeem for merch discount codes generated in-memory.

### 7. Explainable Real-Time Decision Queue
- Ranks crowd, safety, and transport recommendations from the current venue signal set.
- Shows the evidence, confidence, and projected operational impact behind each recommendation.
- Requires explicit operator approval before changing gates or drafting public alerts.
- Preserves approved recommendations as a visible audit state.

---

## Responsible AI & Security
- **Human authority:** GenAI recommendations never execute operational changes autonomously.
- **Grounding:** Model prompts receive current gate, transit, and incident context; deterministic thresholds verify high-impact recommendations.
- **Resilience:** Four-language offline rules keep core guidance available without a provider connection.
- **API boundary:** The backend proxy enforces rate limits, field and body-size limits, timeouts, output schemas, and real security headers.
- **XSS Prevention (CWE-79)**: Input escaping via `sanitizeInput` plus React JSX auto-encoding.
- **CSRF Defense (CWE-352)**: Cryptographic tokens validated before any state-changing operation.
- **PII Masking (CWE-359)**: Ticket IDs (`FIFA-2026-***-1234`) and emails masked before display.
- **Session Protection (CWE-613)**: `__Host-` prefix session tokens. Logout invalidates the session and reloads the page.
- **CSP & Clickjacking (CWE-1021)**: The API sends CSP, `X-Frame-Options`, `X-Content-Type-Options`, referrer, and no-store headers.

---

## Efficiency
- React hooks with conditional rendering keep memory usage low.
- Input length limits (500 chars for chat, 250 for incidents) prevent DoS.
- Localized client-side state avoids redundant calculations.

---

## Testing
The suite contains 358 unit tests and 15 Playwright workflows. Utility coverage is measured separately with `npm run test:coverage`. Coverage includes:
1. **Layout**: Page titles, logo, role toggling.
2. **AI Chat**: Multi-turn conversations and quick chips.
3. **Accessibility**: High contrast and text scaling.
4. **Sustainability**: QR scanning, points, discount codes.
5. **Map**: Node clicks and chat prompt autofill.
6. **Incidents**: Report forms, CSRF, auto-triage, task dispatch.
7. **Broadcasts**: Translation outputs in ES, FR, AR.
8. **Sanitization**: XSS and SQL injection resilience.
9. **Decision intelligence**: ranking, evidence, approval, projected impact, and no-action edge cases.
10. **Resilience and i18n**: deterministic EN/ES/FR/AR fallbacks and Arabic RTL presentation.
11. **Inclusive interaction**: keyboard map control, readable status semantics, responsive containment, and inline errors.

The unit layer exhaustively checks every integer crowd-load value from 0-100%, wait-time thresholds from 0-60 minutes, all incident severity/status combinations, all supported transit-mode pairings, 50 adversarial HTML payloads, 60 PII variations, and repeated cryptographic token rotation.

Run the complete quality gate:
```bash
npm test
```

Unit coverage is available with `npm run test:coverage`.

## Running the Project
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. For hosted OpenRouter responses, add `OPENROUTER_API_KEY` to `.env` and run the API proxy:
   ```bash
   npm run server
   ```
4. Build for production:
   ```bash
   npm run build
   ```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the hybrid intelligence, safety, and resilience design.
