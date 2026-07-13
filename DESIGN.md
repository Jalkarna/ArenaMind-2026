# ArenaMind Interface System

## Scene

ArenaMind is used on bright phones outside a venue and on shared control-room displays under mixed light. The interface therefore defaults to a light, high-contrast workspace with a dark navigation rail that stays easy to locate at a glance.

## Visual Direction

- **Canvas:** cool neutral gray separates the workspace from white operational surfaces.
- **Navigation:** deep venue green anchors identity without turning the entire product into a dark dashboard.
- **Primary action:** coral identifies commands and public communication.
- **Safe state:** pitch green means open, normal, approved, or grounded.
- **Pressure state:** amber means delayed, loaded, or approaching a threshold.
- **Danger state:** red is reserved for critical incidents and immediate action.
- **Typography:** Manrope handles product hierarchy and IBM Plex Mono handles timestamps, tokens, counts, and live telemetry.

## Component Rules

- Cards use an 8px radius, a single boundary, and almost no shadow.
- Page sections remain unframed; cards are reserved for tools, repeated records, and bounded operational modules.
- Primary controls are at least 40px on desktop and 44px on touch layouts.
- Icons come from Lucide at a consistent 1.5-2px visual stroke weight.
- Status is always communicated with text as well as color.
- GenAI recommendations always show evidence and require an explicit operator action.
- Motion is limited to state feedback and is disabled under `prefers-reduced-motion`.

## Responsive Model

- **Desktop:** top workspace rail, 12-column operational grid, map-first Fan Hub.
- **Tablet:** condensed identity and progressive column stacking.
- **Mobile:** fixed two-destination bottom navigation, single-column task order, horizontal map-layer scroller, and full-width decision actions.

## Tokens

The source of truth is the `:root` block in `src/index.css`. Product components consume semantic tokens such as `--surface`, `--line`, `--brand`, `--safe`, `--warning`, and `--danger`; hard-coded values are limited to the public venue scene and SVG visualization.
