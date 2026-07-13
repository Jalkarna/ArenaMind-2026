# ArenaMind 2026: FIFA World Cup Stadium Operations & Fan Experience Command

Public repository: https://github.com/Jalkarna/ArenaMind-2026

ArenaMind 2026 is a premium, GenAI-enabled venue intelligence platform and interactive assistant designed for the FIFA World Cup 2026. The solution enhances stadium operations and the tournament experience by bridging real-time crowd logistics with fan-facing multilingual support, transit tracking, accessibility controls, and sustainability rewards.

## Chosen Verticals & Persona Logic
We chose to implement two key verticals integrated into a single unified workspace:
1. **Fan Experience & Smart Assistance (The "Fan Hub")**: Focuses on fans, visitors, and volunteers. It provides a context-aware GenAI Assistant, wayfinding directions, live transit wait-time tracking, accessibility scaling options (visual and audio), and eco-points gamification.
2. **Operations & Venue Coordination (The "Ops Command")**: Focuses on stadium managers, safety officers, and security teams. It aggregates simulated crowd heatmaps, incident reporting channels, dynamic gate flow bypass overrides, and automated multilingual emergency broadcasting.

---

## Key Features

### 1. Context-Aware GenAI Assistant
- Dynamically responds to fan inquiries in multiple languages (English, Spanish, French, Arabic).
- Custom logic detects intents (e.g. gates, accessibility, transit, food, carbon recycling) and suggests map overlays or physical dispatch commands directly.
- Handles operational summaries for organizers, analyzing incidents and proposing crowd-diversion tactics.

### 2. Interactive SVG Smart Map
- High-fidelity visual layout of stadium entries, concession grills, medical bays, transit stations, and ADA elevators.
- Toggles overlay paths for specific layers (e.g. wheelchair routes, gate loads).
- Heatmap simulation flags congested entrance gates (Gate C and D) in flashing amber/rose.

### 3. Live Operations Incident Log & Auto-Triage
- Safe incident report submission guarded by CSRF tokens and input filtering.
- GenAI engine parses descriptions to auto-categorize severity (`CRITICAL`, `MAJOR`, `MINOR`), draft response plans, and insert tasks into the dispatcher board.

### 4. Volunteer & Staff Task Dispatch Board
- Tri-column kanban board (`Unassigned`, `In Progress`, `Completed`) where staff can claim, track, and close operations tasks in real-time.

### 5. Multilingual Emergency Broadcast System
- Allows commanders to broadcast alerts. It leverages AI translations to automatically propagate the alert in English, Spanish, French, and Arabic to stadium Jumbotrons and signs.

### 6. Gamified Sustainability Tracker
- Fans can scan smart recycling bin QR codes to log cup deposits, offset CO2 (0.5kg per deposit), and earn Eco-Points.
- Points are redeemable for unique merch store discount codes generated securely in-memory.

---

## Security Protections (FIPS 140-2 & CWE Compliance)
We implemented a robust multi-layered security system:
- **XSS Prevention (CWE-79)**: Strict input validation and sanitization using manual escape filters (`sanitizeInput`) before rendering raw data, paired with React JSX automatic output encoding.
- **CSRF Defense (CWE-352)**: Implemented cryptographic synchronizer tokens. All state-changing operations (reporting incidents, sending broadcasts) validate tokens before execution.
- **PII Masking (CWE-359)**: Masks sensitive info (e.g. Ticket IDs `FIFA-2026-***-1234` and emails) using formatting regex before displaying to prevent credential leaks.
- **Session Protection (CWE-613)**: Secure cookie session wrappers (`__Host-` prefix) in-memory. Logging out invalidates the active session and triggers a full window reload to purge memory state.
- **CSP Headers & Clickjacking (CWE-1021)**: Configured simulated security headers (CSP `default-src 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

---

## Efficiency Controls
- The platform uses optimized React hooks and reactive conditional rendering to keep memory footprints low.
- Simulated network requests enforce strict character limits (500 chars for chat, 250 for incidents) to prevent memory allocation denial-of-service (DoS) attacks.
- Localized client-side state minimizes redundant calculations.

---

## E2E Testing with Playwright
The application includes a comprehensive test suite in `tests/platform.spec.ts` covering 8 distinct E2E blocks with extensive assertions:
1. **Metadata & Layout**: Validates page titles, logo presence, and role toggling.
2. **AI Chat Assistant**: Checks multi-turn contextual conversations and quick chips.
3. **Accessibility Controls**: Validates High Contrast styling and text scale adjustments.
4. **Sustainability Rewards**: Tests QR bin scanning, points increments, and discount code generation.
5. **Interactive Map**: Tests node clicks and autofilling chat prompts from map locations.
6. **Incident Log & Dispatch**: Tests report forms, CSRF safety, auto-triage, and task dispatcher status moves.
7. **Jumbotron Broadcasts**: Verifies translation outputs in ES, FR, AR.
8. **Sanitization Audits**: Tests XSS payloads and SQL injection resilience.

Run tests using:
```bash
npx playwright test
```

## Running the Project
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. To enable hosted OpenRouter responses, add `OPENROUTER_API_KEY` to `.env` and run the secure API proxy in a second terminal:
   ```bash
   npm run server
   ```
4. Build for production:
   ```bash
   npm run build
   ```
