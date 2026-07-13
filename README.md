# ArenaMind 2026: FIFA World Cup Stadium Operations & Fan Experience

Public repository: https://github.com/Jalkarna/ArenaMind-2026

ArenaMind 2026 is a stadium operations and fan-experience platform for the FIFA World Cup 2026. It combines crowd tracking, wayfinding, transit status, multilingual assistance, incident triage, and sustainability rewards in one workspace.

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

---

## Security (FIPS 140-2 & CWE Compliance)
- **XSS Prevention (CWE-79)**: Input escaping via `sanitizeInput` plus React JSX auto-encoding.
- **CSRF Defense (CWE-352)**: Cryptographic tokens validated before any state-changing operation.
- **PII Masking (CWE-359)**: Ticket IDs (`FIFA-2026-***-1234`) and emails masked before display.
- **Session Protection (CWE-613)**: `__Host-` prefix session tokens. Logout invalidates the session and reloads the page.
- **CSP & Clickjacking (CWE-1021)**: Simulated headers: CSP `default-src 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

---

## Efficiency
- React hooks with conditional rendering keep memory usage low.
- Input length limits (500 chars for chat, 250 for incidents) prevent DoS.
- Localized client-side state avoids redundant calculations.

---

## E2E Testing (Playwright)
Tests in `tests/platform.spec.ts` cover 8 blocks:
1. **Layout**: Page titles, logo, role toggling.
2. **AI Chat**: Multi-turn conversations and quick chips.
3. **Accessibility**: High contrast and text scaling.
4. **Sustainability**: QR scanning, points, discount codes.
5. **Map**: Node clicks and chat prompt autofill.
6. **Incidents**: Report forms, CSRF, auto-triage, task dispatch.
7. **Broadcasts**: Translation outputs in ES, FR, AR.
8. **Sanitization**: XSS and SQL injection resilience.

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
3. For hosted OpenRouter responses, add `OPENROUTER_API_KEY` to `.env` and run the API proxy:
   ```bash
   npm run server
   ```
4. Build for production:
   ```bash
   npm run build
   ```
