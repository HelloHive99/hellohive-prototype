# HelloHive Prototype — Claude Code Build Plan

You are a senior full-stack engineer acting as my technical co-pilot. I need to build a working prototype of HelloHive tonight on my local machine that I can demo to show meaningful progress to non-technical stakeholders.

---

## Context: What HelloHive Is

HelloHive is an AI-powered facilities operations platform that replaces the disconnected mess of spreadsheets, phone calls, texts, clunky CMMS tools, and partial property management software that facilities teams duct-tape together today. It handles the full operational lifecycle in one flow:

**Intake → Execution → Accountability → Intelligence → Payments**

The prototype targets MLB stadium and broadcast studio facilities operations. The primary user is a Facilities Manager overseeing sound stages, edit bays, control rooms, and office/light industrial spaces across 2–3 properties.

---

## Visual Design Playbook — STRICT IMPLEMENTATION SPEC

This is the binding visual contract for the entire codebase. Do not deviate from these hex codes, opacity values, or Tailwind classes. Every component must comply.

### Color Palette (Dark Mode — Enterprise SaaS)

| Token | Hex | Usage |
|-------|-----|-------|
| Plum 900 | `#150F16` | Main app canvas/background |
| Plum 800 | `#1E1520` | Global sidebar, top navigation |
| Plum 700 | `#2C1F2F` | Cards, panels, modals (elevation without drop-shadows) |
| Bumble Bee Yellow | `#F5C518` | **Primary CTA buttons ONLY** (Export, Save, Create). Active nav states. **NEVER for alerts/warnings.** |
| Amber Warning | `#D4820A` | System warnings, pending states — deliberately duller than brand yellow |
| Alabaster White | `#F5F0EB` | Primary text, data values |
| Silicon Slate | `#4A4953` | Secondary text, table headers, timestamps, placeholders |
| Success | `#2ECC71` | Completed states |
| Error/Urgent | `#E74C3C` | Critical alerts, overdue items |

---

### Rule 1: "Command Center" Elevation Model (No-Shadow Depth)

**Drop-shadows are strictly forbidden.** Depth is communicated entirely through color contrast and structural borders.

| Layer | Tailwind Classes |
|-------|-----------------|
| **Canvas** (main app background) | `bg-[#150F16]` |
| **Sidebar & Header** | `bg-[#1E1520]` with right/bottom border: `border-slate-800/50` |
| **Cards & Panels** | `bg-[#2C1F2F]` with `border border-[#4A4953]/40 ring-1 ring-white/5 ring-inset` |

The `ring-inset` creates a subtle inner glow on cards that separates them from the canvas without any shadow. This is the elevation model — nothing else.

**Card component pattern (use everywhere):**
```tsx
<div className="bg-[#2C1F2F] border border-[#4A4953]/40 ring-1 ring-white/5 ring-inset rounded-lg p-6">
  {/* card content */}
</div>
```

**Sidebar pattern:**
```tsx
<aside className="bg-[#1E1520] border-r border-slate-800/50 w-64 min-h-screen">
  {/* nav content */}
</aside>
```

**Header pattern:**
```tsx
<header className="bg-[#1E1520] border-b border-slate-800/50 h-16 px-6">
  {/* header content */}
</header>
```

---

### Rule 2: Typography Execution (Inter)

**Font:** Inter (400, 500, 600, 700) — no serifs inside the app, ever.

| Context | Tailwind Classes |
|---------|-----------------|
| **Big data values** (dashboard numbers) | `text-4xl font-semibold tracking-tighter tabular-nums text-[#F5F0EB]` |
| **Page titles & headers** | `text-2xl font-semibold tracking-tight text-[#F5F0EB]` |
| **Section headers** | `text-xl font-semibold tracking-tight text-[#F5F0EB]` |
| **Body text** | `text-sm text-[#F5F0EB]` |
| **Secondary text / timestamps** | `text-sm font-medium text-[#4A4953]` |
| **Table headers** | `uppercase tracking-wider text-xs font-medium text-[#4A4953]` |
| **Small labels / captions** | `text-xs text-[#4A4953]` |

---

### Rule 3: "Bumble Bee Yellow" CTA Strategy

Yellow is the action color. It means "do something." Never use it for alerts, warnings, or decoration.

| Element | Tailwind Classes |
|---------|-----------------|
| **Primary button** | `bg-[#F5C518] hover:bg-[#F5C518]/90 text-[#150F16] font-semibold px-4 py-2 rounded-md` |
| **Primary button focus** | Add `focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 focus:ring-offset-[#150F16]` |
| **Active nav state** | Text or indicator uses `text-[#F5C518]` or `bg-[#F5C518]` accent bar |

**CRITICAL:** Button text inside yellow CTAs is always Plum 900 (`text-[#150F16]`), **never white**. The dark-on-yellow contrast is the brand signature.

**Button component pattern:**
```tsx
<button className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-[#150F16] font-semibold px-4 py-2 rounded-md focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 focus:ring-offset-[#150F16] transition-colors">
  Create Work Order
</button>
```

---

### Rule 4: Data Visualization (Recharts — Goldman Strategy)

Charts communicate institutional credibility. No rainbow palettes.

| Element | Color / Value |
|---------|--------------|
| **Default bars/lines** (chart body) | Muted slate `#4A4953` or lighter plum `#3D2C42` |
| **The Highlight** (single most important data point) | Bumble Bee Yellow `#F5C518` |
| **Grid lines** | Near-invisible: `stroke="rgba(255,255,255,0.05)"` |
| **Axis labels** | Silicon Slate `#4A4953`, `text-xs` |
| **Tooltip background** | Plum 700 `#2C1F2F` with border `#4A4953/40` |

**Recharts config pattern:**
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
<Bar dataKey="value" fill="#4A4953" radius={[4, 4, 0, 0]} />
{/* Highlight bar for the key metric */}
<Bar dataKey="highlight" fill="#F5C518" radius={[4, 4, 0, 0]} />
```

The rule: the audience's eye should land on ONE yellow element in the chart. Everything else recedes.

---

### Rule 5: Status Badges & Alerts ("Glass" Visual)

**No solid bright background colors.** Badges use highly transparent backgrounds with solid text and a solid indicator dot.

| Status | Tailwind Classes |
|--------|-----------------|
| **Completed** | `bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/20` |
| **In Progress** | `bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20` |
| **Open / New** | `bg-[#F5F0EB]/10 text-[#F5F0EB] border border-[#F5F0EB]/20` |
| **Overdue / Urgent** | `bg-[#E74C3C]/10 text-[#E74C3C] border border-[#E74C3C]/20` |
| **Pending / Warning** | `bg-[#D4820A]/10 text-[#D4820A] border border-[#D4820A]/20` |
| **Dispatched** | `bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20` |

**All badges** share this base structure: `flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium`

**The Dot:** Every badge includes a 6×6px solid indicator circle:
```tsx
<span className="w-1.5 h-1.5 rounded-full bg-[STATUS_COLOR]" />
```

**Badge component pattern (Completed example):**
```tsx
<span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/20">
  <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" />
  Completed
</span>
```

---

### Implementation Deliverables (Milestone 1 — FIRST thing built)

Before building ANY page or component, deliver these three foundation pieces:

1. **`tailwind.config.ts`** — All color tokens registered as custom colors (plum-900, plum-800, plum-700, bumble, amber-warn, alabaster, slate-sec, success, error). Include Inter as the default font.

2. **`globals.css`** — Import Inter from Google Fonts. Set `body` to `bg-[#150F16] text-[#F5F0EB] font-sans antialiased`. Set `*` to remove all box-shadows as a safety net.

3. **Base components** — Create reusable `Card`, `Badge`, and `Button` components that enforce these exact patterns so they cannot be accidentally overridden later in the build.

---

## Locked Domain Terminology

Use these exact terms throughout the UI — labels, nav items, headers, seed data, empty states:

| Object | Term | Example |
|--------|------|---------|
| Location (top level) | **Property** or **Site** | MLB Studio Campus |
| Sub-location | **Space** (not "Unit") | Sound Stage 2, Edit Suite 3, Server Room B |
| Equipment | **Asset** | HVAC Unit #RTU-04, UPS-12, Camera Rail A |
| Internal teams | **Departments** | Production Ops, Post Production, Broadcast Engineering |
| External occupants | **Tenants** | (not used in initial demo) |
| Service providers | **Vendors** | Johnson Controls, ABM Industries |
| Work items | **Work Orders** | WO-2026-0047 |
| Incoming requests | **Service Requests** | (feed into Work Orders) |
| Scheduled maintenance | **Preventive Maintenance** | PM tasks |

### Canonical Flow
`Service Request → Work Order → Assigned Vendor → Completed → Invoiced`

---

## Locked Vendor Seed Data

Use these REAL company names. They are nationally recognized providers that actually serve stadium/studio environments.

| Category | Vendors |
|----------|---------|
| **MEP / Critical Infrastructure** (HVAC, power, environmental) | Johnson Controls, Schneider Electric |
| **Electrical & Low-Voltage** (lighting, cabling, fiber, access control wiring) | Rosendin Electric, IES Holdings |
| **Janitorial & Maintenance** (cleaning, floor care, event resets) | ABM Industries, ISS Facility Services |
| **Security & Access Control** (badge access, CCTV, patrol) | Allied Universal, Convergint |
| **AV, Broadcast & Studio Systems** (control rooms, LED walls, signal routing) | Diversified, AVI-SPL |

---

## Locked User Persona (seed into the UI)

- **Logged-in user:** Use a realistic Facilities Manager name (e.g., "Marcus Reyes, Director of Facilities")
- **Organization:** MLB Studio Campus (or similar — do not use a real MLB team name)
- **Properties managed:** 2–3 (e.g., "Stadium Complex," "Broadcast Production Center," "Training & Operations Facility")
- **Spaces per property:** 8–15 (sound stages, edit suites, server rooms, control rooms, offices, loading docks)
- **Active work orders:** ~25–40 across all properties (mix of open, in-progress, completed, overdue)

---

## Locked Demo Flow (3-Act Structure)

The demo tells a story in three beats. Build for this narrative:

### Act 1: "The Wow" — Voice Memo → Structured Work Order
A voice memo like *"AC is leaking in Stage 3 near the lighting rig"* gets transcribed and auto-parsed into:
- **Location detected:** Sound Stage 3
- **Asset suggested:** HVAC Unit #RTU-04
- **Priority inferred:** High (water + equipment risk)
- **Work order created** with all fields populated

This is the iPhone "swipe to unlock" moment. It must feel magical.

### Act 2: "The Speed" — Instant Vendor Dispatch
The work order auto-matches to the right vendor category (MEP → Johnson Controls), shows availability/SLA data, and dispatches with one click. The vendor receives notification (simulated). Status updates in real time on the dashboard.

### Act 3: "The Enterprise Brain" — Full Lifecycle Dashboard
Pull back to show the operational command center:
- Work order pipeline by status (open / in-progress / completed / overdue)
- Cost tracking across vendors and properties
- Asset history (this HVAC unit has had 3 service calls in 60 days → flag)
- SLA compliance metrics
- The single yellow-highlighted metric: **Mean Time to Resolution** or **% SLA Compliance** (the "Goldman" data spotlight)

---

## UI North Star

The app should feel closer to **Slack + Uber + voice notes** and farther from **SAP + old CMMS + accounting software**.

### Anti-Patterns (DO NOT build these)
- ❌ **Form hell:** No 15-field required forms. AI structures data behind the scenes.
- ❌ **Accounting dashboards:** No tiny dense financial grids. Show status, what's broken, what's late, what's costing money.
- ❌ **Over-modeled assets:** No serial number fields or 12 metadata dropdowns. Let structure emerge.
- ❌ **Complex vendor portals:** Vendors tap link → accept → upload photo → get paid. That's it.

---

## Step 3: Tonight's Build Plan

### Stack Recommendation

**Next.js 14 (App Router) + Tailwind CSS + TypeScript**

Why: Matches the production architecture spec exactly (the proposal says Next.js 14, React, Tailwind, TypeScript). Zero translation cost from prototype to production. App Router gives you layouts, loading states, and server components out of the box. `shadcn/ui` provides accessible, unstyled components you can theme to the plum palette instantly.

```bash
npx create-next-app@14 hellohive --typescript --tailwind --app --src-dir
cd hellohive
npx shadcn-ui@latest init
npm install lucide-react recharts openai
```

Configure `tailwind.config.ts` with the locked color tokens above as the first step.

---

### MVP Feature Set (Tonight — 4 features max)

| # | Feature | Demo Narrative | Est. Time | Acceptance Criteria |
|---|---------|---------------|-----------|-------------------|
| 1 | **Operations Dashboard + RBAC** | Act 3 — the command center. First thing visible. Role switcher is the "fourth moment." | 105 min | Sidebar nav (Properties, Work Orders, Vendors, Assets). Main canvas shows: WO pipeline by status (card-based kanban or status bar), top-line metrics (open WOs, mean resolution time, SLA %, cost MTD), recent activity feed. All seeded with realistic data. Yellow spotlight on one key metric. User switcher in top bar with 5 seeded users across 5 roles — switching users re-renders the entire UI with role-appropriate permissions. |
| 2 | **Voice Memo → Work Order** | Act 1 — the wow moment. | 60 min | Record button in UI with Whisper toggle (default ON — server determines availability). "Use Sample Clip" button for guaranteed demo path. Parsed fields auto-populate: location, asset, priority, description, suggested category. "Create Work Order" CTA in brand yellow. New WO appears in dashboard. Falls back to simulated transcript seamlessly on any failure. |
| 3 | **Work Order Detail + Vendor Dispatch** | Act 2 — the speed moment. | 45 min | Click any WO → detail panel/page. Shows full WO info, timeline, suggested vendor with match reasoning (category, SLA, availability). "Dispatch" button (yellow CTA). On click: status changes to "Dispatched," vendor notification simulated, timestamp appears in timeline. |
| 4 | **Work Order List + Filtering** | Supporting — proves depth. | 30 min | Filterable list view of all WOs. Filter by status, property, priority, vendor category. Columns: ID, description, space, priority, status, assigned vendor, created date. Click any row → opens detail view. |

---

### Build Sequence with Milestones

#### Milestone 1 (~105 min): "Safe Demo" — The Dashboard + Role System

**If everything else fails, you can demo this.**

Build:
1. Project scaffolding + **Visual Design Playbook foundation** — this comes FIRST before any UI work:
   - `tailwind.config.ts` with all color tokens from Rule 1
   - `globals.css` with Inter font import, body styles, shadow kill-switch
   - Reusable `Card` component (Rule 1 — Plum 700 + border + ring-inset)
   - Reusable `Badge` component (Rule 5 — glass badges with dot indicator)
   - Reusable `Button` component (Rule 3 — yellow CTA with Plum 900 text)
2. App shell using playbook patterns: sidebar (`bg-[#1E1520] border-r border-slate-800/50`), header (`bg-[#1E1520] border-b border-slate-800/50`), canvas (`bg-[#150F16]`). Nav items: Dashboard, Work Orders, Vendors, Properties, Assets. Top bar: "Marcus Reyes, Director of Facilities"
3. **RBAC context + user switcher:** `UserContext.tsx` provider with all 5 seeded users, `hasPermission()` helper, and a role-switching dropdown in the top bar. Nav items and CTAs respect the current role from first render.
4. Dashboard page:
   - 4 metric cards (using Card component from playbook) at top. Numbers use `text-4xl font-semibold tracking-tighter tabular-nums`. Labels use `uppercase tracking-wider text-xs font-medium text-[#4A4953]`:
     - Open WOs: 12
     - In Progress: 8
     - Avg Resolution: 4.2 hrs
     - SLA Compliance: 94.3% ← **this card gets a `border-[#F5C518]/40` accent and the number rendered in `text-[#F5C518]`** (Goldman spotlight)
   - Work order status pipeline (horizontal bar or kanban-style columns)
   - Recent activity feed (8–10 entries: "WO-2026-0034 dispatched to Johnson Controls," "Convergint completed WO-2026-0028," etc.)
5. All data from a single `seed-data.ts` constants file

**Git commit:** `milestone-1: dashboard shell with seeded operational data`
**Demoable as:** "Here's the operations command center. A facilities manager sees everything at a glance — what's open, what's late, and the one metric that matters most. And watch this — I can switch to the VP's view, or even show you what a vendor sees."

---

#### Milestone 2 (~90 min): "The Wow" — Voice → Work Order

Build:
1. "New Service Request" button (yellow CTA) on dashboard header
2. Modal or slide-over panel (Plum 700 background, `border border-[#4A4953]/40 ring-1 ring-white/5 ring-inset`) with a mic icon / record button
3. **Transcription toggle:** The voice intake modal always renders a "Live Transcription (Whisper)" switch, default ON. The client never reads `OPENAI_API_KEY` directly — it cannot. Instead, when the toggle is ON and the user records audio, the client sends it to `POST /api/transcribe`. If the server returns `{ fallback: true }` (because the key is missing, the request failed, or for any other reason), the client silently uses the simulated transcript. The toggle is purely a user-facing intent signal; the server decides whether real transcription happens. If the user prefers the guaranteed demo path, they flip the toggle OFF and the simulated transcript fires without a server call.
4. **If toggle ON:** clicking the mic icon activates the browser `MediaRecorder` (see MIME selection rule in "Optional: Real Whisper Transcription" section), records until stop (or 30-second auto-stop), sends audio blob to `POST /api/transcribe`, shows a "Transcribing…" pulsing state, and feeds the returned transcript into the typing animation. If the server returns `{ fallback: true }`, the simulated transcript plays seamlessly — no visible error.
5. **If toggle OFF:** on mic click, simulate transcription with typing animation using the pre-written string — "AC is leaking in Stage 3 near the lighting rig. Water is pooling near the base of the unit by camera rail A."
6. **"Use Sample Clip" button:** A secondary action below the mic icon, styled as a text link or ghost button (`text-[#4A4953] hover:text-[#F5F0EB]`). On click, instantly populates the pre-written transcript and proceeds through the same typing animation and AI-parsed field sequence. Purpose: guaranteed demo path for loud rooms, unreliable mics, or rapid repeated demos. This button is always visible regardless of toggle state.
7. Below transcription (regardless of source), AI-parsed fields animate in one by one:
   - Property: MLB Studio Campus → Broadcast Production Center
   - Space: Sound Stage 3
   - Asset: HVAC Unit #RTU-04
   - Priority: 🔴 High (water + equipment proximity)
   - Category: MEP / Critical Infrastructure
   - Suggested Vendor: Johnson Controls
8. "Create Work Order" CTA → creates WO, navigates to WO detail, shows in dashboard
9. **API route handler:** Build `src/app/api/transcribe/route.ts` per the specification in the "Optional: Real Whisper Transcription" section. Install `openai` npm package. If the key is absent, the route returns fallback immediately.

**Git commit:** `milestone-2: voice-to-work-order intake with AI parsing simulation and optional Whisper transcription`
**Demoable as:** "Watch this. I speak a voice memo — the system transcribes it, identifies the location, suggests the asset, infers priority, and creates a fully structured work order. No forms, no dropdowns."

---

#### Milestone 3 (~60 min): "The Speed" — Work Order Detail + Dispatch

Build:
1. Work Order detail page/panel
2. Header: WO number, status badge (use Rule 5 glass badge pattern), priority badge, created timestamp
3. Sections: Description, Location (Property → Space → Asset), Timeline (created, parsed, etc.)
4. Vendor Match panel: suggested vendor with reasoning ("Johnson Controls — MEP category, 98% SLA compliance, 2.1 hr avg response, currently available")
5. "Dispatch to Johnson Controls" yellow CTA
6. On click: status badge → "Dispatched" (with animation), timeline entry added ("Dispatched to Johnson Controls via SMS + Email"), simulated vendor notification toast
7. Work Order list page with basic filters (status, property, priority)

**Git commit:** `milestone-3: work order detail view with vendor dispatch`
**Demoable as:** "One click — vendor matched, dispatched, notified. The system chose Johnson Controls because they handle MEP, they have a 98% SLA, and they're available now."

---

#### Milestone 4 (~30 min): Polish + Demo Prep

Build:
1. Tune all seed data — make sure names, numbers, dates, WO descriptions are all realistic and consistent
2. Add loading transitions / skeleton states where needed
3. Ensure click-through flow works smoothly: Dashboard → New Request → Voice → Create → Detail → Dispatch → Back to Dashboard (updated)
4. Add a few completed WOs with cost data and asset history to support Act 3 narrative
5. Remove any placeholder text, lorem ipsum, or "TODO" artifacts
6. **Demo Reset control (Admin-only):** Add a "Reset Demo Data" button in the sidebar footer or a settings area, visible only to the Admin role. On click, resets all in-memory state (work orders, activity feed, metrics) back to the original seed data snapshot. This includes all derived metrics (dashboard counts, SLA percentages, cost totals) — they must recompute from the restored seed data to match the initial state exactly. This is purely client-side — no backend persistence. Purpose: allows repeatable demos without state drift. If you dispatched a vendor or created a WO during a dry run, one click returns everything to the clean starting state. Confirm dialog before executing ("Reset all demo data to defaults?").
7. Test the full demo flow 3 times — including one full reset cycle

**Git commit:** `milestone-4: demo-ready polish and seed data finalization`
**Demoable as:** Full 3-act walkthrough ready.

---

### Mock/Stub Strategy

Everything is local. No external services.

| What | How to Fake |
|------|------------|
| Voice transcription | **Default:** Pre-written string with a typing/streaming animation on button click. No actual mic access needed. A "Use Sample Clip" button provides instant access to this path. **Optional upgrade:** Real Whisper transcription via browser mic — see "Optional: Real Whisper Transcription" section below. The client sends audio to `POST /api/transcribe`; the server returns either real text or a fallback signal. On fallback, the simulated transcript plays seamlessly. |
| AI parsing | Hardcoded parsed output mapped to the specific demo transcript. Delay 1–2 seconds with a "processing" spinner for realism. |
| Vendor matching | Hardcoded match logic: category → vendor lookup from seed data. Show "reasoning" as static text. |
| SMS/Email dispatch | Toast notification + timeline entry. No real messaging. |
| Vendor response | Seed some WOs as already-responded with timestamps. |
| Dashboard metrics | Computed from seed data array at render time (not hardcoded numbers — compute from the WO list so numbers are consistent). |
| User authentication | React context provider with 5 seeded users and role-based permissions. User switcher dropdown in top bar — no login screen, but full role awareness. Default: Marcus Reyes (Admin). |
| Photos/proof-of-work | Not in prototype. |
| Payments | Not in prototype. |

---

### Optional: Real Whisper Transcription (Low-Risk Upgrade)

This is a **non-blocking upgrade** to Milestone 2. If it works, the demo goes from impressive to jaw-dropping — a stakeholder speaks into their laptop mic and sees a real work order materialize. If it fails for any reason, the prototype falls back to the simulated transcript seamlessly. The audience never knows.

#### Approach

Browser `MediaRecorder` API captures audio from the device microphone → audio blob is sent as `multipart/form-data` to a Next.js Route Handler at `POST /api/transcribe` → the route handler checks for `OPENAI_API_KEY`, forwards the file to the OpenAI Audio Transcriptions endpoint (Whisper model) if present, and returns a structured JSON response → the client feeds the returned transcript into the same typing/streaming animation used by the simulated path, or falls back to the simulated transcript if the response indicates fallback.

#### MediaRecorder MIME Selection Rule

Browsers vary in which audio MIME types `MediaRecorder` supports. Use this deterministic selection:

1. If `MediaRecorder.isTypeSupported("audio/webm;codecs=opus")` → use `"audio/webm;codecs=opus"`
2. Else if `MediaRecorder.isTypeSupported("audio/webm")` → use `"audio/webm"`
3. Else → use the browser default (omit the `mimeType` option)
4. If `MediaRecorder` constructor throws or `start()` fails for any reason → abandon recording, use the simulated transcript immediately.

Whisper accepts webm, mp4, mp3, wav, and ogg. All three paths above produce formats Whisper can handle.

#### Environment Variable

| Variable | Location | Required? |
|----------|----------|-----------|
| `OPENAI_API_KEY` | `.env.local` (never committed — add to `.gitignore`) | **No.** If not present, the route handler returns `{ text: null, fallback: true }` immediately. The client silently uses the simulated transcript. |

Add to `.env.local`:
```
OPENAI_API_KEY=sk-...
```

**CRITICAL:** The client never reads `OPENAI_API_KEY`. The client cannot access server-side environment variables. All key detection happens server-side inside the route handler. The client always sends its request to `/api/transcribe` when the toggle is ON; the server response determines whether real transcription occurred.

#### API Route Handler: `POST /api/transcribe`

Location: `src/app/api/transcribe/route.ts`

**Response contract — every response is HTTP 200 JSON with one of two shapes:**

```
Success: { text: string, fallback: false }
Fallback: { text: null, fallback: true, error?: string }
```

**Never return non-200 status codes. Never throw unhandled errors.** The client checks `response.fallback` — if `true`, it uses the simulated transcript. If `false`, it uses `response.text`.

Specification:
- Accept `multipart/form-data` with a single field named `file` containing the audio blob.
- **File-size enforcement (two layers):**
  1. Check the `Content-Length` request header (if present). If > 5 MB (5,242,880 bytes), return `{ text: null, fallback: true, error: "File too large" }` immediately without parsing the body.
  2. After parsing form data, check the actual blob size. If > 5 MB, return the same fallback response. This catches cases where `Content-Length` is absent or inaccurate.
- Check `process.env.OPENAI_API_KEY`. If falsy, return `{ text: null, fallback: true, error: "No API key configured" }`.
- Forward the file to the OpenAI Audio Transcriptions endpoint using the `openai` npm package with `model: "whisper-1"`.
- Wrap the entire OpenAI call in a **10-second timeout** (use `AbortController`). If Whisper has not responded within 10 seconds, abort and return `{ text: null, fallback: true, error: "Transcription timeout" }`.
- On any other failure (network error, 401 from OpenAI, malformed audio, parse error), catch the error and return `{ text: null, fallback: true, error: "<descriptive message>" }`.
- On success, return `{ text: string, fallback: false }`.

#### UI Behavior

The voice intake modal (Milestone 2) contains three actions:

1. **"Live Transcription (Whisper)" toggle** — always rendered, default ON. This is a user-facing intent signal; the server decides whether real transcription is available. When ON, clicking the mic icon records and sends audio to `/api/transcribe`. When OFF, the simulated transcript fires immediately with no server call.

2. **Mic icon / record button** — primary action. Behavior depends on toggle state (see Milestone 2 steps 4–5).

3. **"Use Sample Clip" button** — secondary action, styled as a ghost button or text link (`text-[#4A4953] hover:text-[#F5F0EB]`), always visible regardless of toggle state. On click, instantly populates the pre-written transcript string and proceeds through the same typing animation and AI-parsed field sequence. Purpose: guaranteed demo path for loud rooms, unreliable mics, or rapid repeated demos.

When the toggle is ON and the user records audio, the UI shows a "Transcribing…" pulsing state (Plum 700 card with a pulsing dot animation). If the server returns `{ fallback: true }`, the simulated transcript plays instead with no visible error — the demo continues uninterrupted.

#### Fallback Guarantee

The simulated transcript path is **never removed**. It remains the default, the safety net, and the guaranteed demo path. Real transcription is layered on top. The decision tree:

1. Is the toggle ON? → Record audio, call `POST /api/transcribe`. Otherwise use simulated.
2. Did recording succeed? (MediaRecorder started, blob produced) → Send to server. Otherwise use simulated.
3. Did the server return `{ text: "...", fallback: false }`? → Feed real text into animation. Otherwise use simulated.

At no point can the Whisper integration block, break, or delay the demo beyond the 10-second server timeout. The "Use Sample Clip" button provides an additional zero-latency path that bypasses both recording and the server entirely.

### Seed Data File Structure (`src/data/seed-data.ts`)

Single file containing:
- `users[]` — 4–5 users across roles (see RBAC section below)
- `properties[]` — 3 properties with spaces and assets
- `vendors[]` — 10 vendors across 5 categories with SLA/response metrics
- `workOrders[]` — 30+ work orders in various states with realistic descriptions
- `activityFeed[]` — recent activity entries with attributed user names
- `currentUser` — defaults to Marcus Reyes (Admin), switchable at runtime

All descriptions should be realistic facilities language:
- ✅ "Intermittent power fluctuation on Panel 7B feeding Edit Suite 2 — monitors cycling off during live sessions"
- ✅ "Badge reader at Loading Dock C not recognizing contractor credentials since Tuesday AM"
- ❌ "Test work order #1"
- ❌ "Lorem ipsum dolor sit amet"

---

### RBAC & User Management (Prototype-Grade)

No real authentication. No login screen. This is a **role-aware context system** with a **demo user switcher** — which is actually more impressive in a live demo than a login form, because you can show stakeholders how different roles experience the platform in real time.

#### Seeded Users

| Name | Role | Context |
|------|------|---------|
| Marcus Reyes | **Admin** (Director of Facilities) | Full access. Default logged-in user. Creates WOs, dispatches vendors, sees all metrics and cost data. |
| Sarah Chen | **Ops Coordinator** | Day-to-day operator. Can create WOs, dispatch vendors, manage work orders. Cannot access billing/cost views or system settings. |
| Derek Morales | **Technician** | Field-level role. Sees assigned work orders only. Can update status, add notes, upload proof-of-work. Cannot create WOs or dispatch vendors. |
| James Whitfield | **Viewer** (VP of Operations) | Read-only executive view. Sees dashboards, metrics, and reports. Cannot create, edit, or dispatch anything. Sees cost data. |
| Vendor: Johnson Controls | **Vendor Contact** | External role. Sees only their assigned work orders. Can accept/decline, update status, upload photos. No access to other vendors, properties, or financials. |

#### Permission Matrix

| Capability | Admin | Ops Coordinator | Technician | Viewer | Vendor Contact |
|-----------|-------|----------------|------------|--------|---------------|
| View dashboard & metrics | ✅ | ✅ | ❌ | ✅ | ❌ |
| View cost data | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create service requests / WOs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Voice memo intake | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dispatch vendors | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update WO status | ✅ | ✅ | ✅ (own) | ❌ | ✅ (own) |
| View all work orders | ✅ | ✅ | ❌ | ✅ | ❌ |
| View assigned WOs only | — | — | ✅ | — | ✅ |
| Manage vendors | ✅ | ❌ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ | ❌ |

#### Implementation (build in Milestone 1 as part of app shell)

1. **`src/context/UserContext.tsx`** — React context provider. Stores `currentUser` from seed data. Exposes `switchUser(userId)` function and `hasPermission(capability)` helper.

2. **User switcher in top bar** — Small dropdown next to the user name showing all 5 seeded users with their role badge. Click to switch. The entire UI re-renders to reflect the new role's permissions. This is the demo move: "Let me show you what this looks like for an executive... now let me show you the vendor's view."

3. **Conditional rendering** — Components check `hasPermission()` before rendering:
   - "New Service Request" button: hidden for Technician, Viewer, Vendor
   - "Dispatch" button on WO detail: hidden for Technician, Viewer, Vendor
   - Cost columns/cards: hidden for Ops Coordinator, Technician, Vendor
   - Dashboard: Technician and Vendor see a filtered "My Work Orders" view instead
   - Nav items dim or hide based on role

4. **Activity feed attribution** — Work order timeline entries show different user names: "Created by Marcus Reyes," "Dispatched by Sarah Chen," "Status updated by Derek Morales," "Accepted by Johnson Controls." This makes the platform feel multi-user even in a single-browser demo.

**Estimated additional time: ~25 min** (context provider: 10 min, user switcher UI: 10 min, conditional renders sprinkled across existing components: 5 min).

---

### Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| **Tailwind dark theme + custom tokens take longer than expected** | Low (reduced) | The Visual Design Playbook provides exact Tailwind classes for every element. Copy-paste, do not improvise. Build `tailwind.config.ts` and the 3 base components (Card, Badge, Button) in Milestone 1 step 1 before touching any pages. |
| **Voice animation feels janky or cheap** | Medium | Keep it simple — character-by-character typing effect is proven. Don't attempt real audio visualization. Fallback: paste-in text with a "transcribing..." delay. |
| **Component styling rabbit hole** | Medium (reduced) | The playbook eliminates guesswork — every component has exact classes specified. Use shadcn/ui primitives and override with playbook classes. If a component doesn't have a playbook pattern, use the Card pattern as the default container and the Badge pattern for any status indicator. Never invent new color values. |
| **Whisper transcription integration fails or degrades demo** | Medium | Three specific sub-risks and mitigations: **(1) Audio format quirks:** Browser `MediaRecorder` may produce different MIME types across browsers. Use the deterministic MIME selection rule (try `audio/webm;codecs=opus`, then `audio/webm`, then browser default — see "Optional: Real Whisper Transcription" section). If `MediaRecorder` constructor or `start()` throws, abandon recording and use the simulated transcript immediately. **(2) Latency:** Whisper can take 2–8 seconds on a 10-second clip. The "Transcribing…" pulsing state covers this. Hard timeout at 10 seconds triggers server-side fallback — the client receives `{ fallback: true }` and plays the simulated transcript. The audience sees the same typing animation either way. **(3) API key missing or invalid:** The route handler checks for the key server-side before calling OpenAI. If absent or if OpenAI returns a 401, the route returns `{ text: null, fallback: true }` immediately. The client never knows why — it just uses the simulated transcript. The "Use Sample Clip" button provides a zero-latency path that bypasses recording and the server entirely. **Guarantee:** at no point can the Whisper path block or break the demo. The simulated transcript is always one `{ fallback: true }` away. |

---

## Step 4: Implementation Rules

Once I say "go," begin building. Follow these rules:

- **The Visual Design Playbook is the single source of truth for all visual decisions.** If a styling choice is not covered by the playbook, use the closest pattern (Card for containers, Badge for status indicators, Button for actions). Never introduce hex values, opacities, or border styles not defined in the playbook.
- Write clean, working TypeScript. No pseudocode, no TODOs in critical paths.
- After completing each milestone, stop and confirm it runs. Commit with a descriptive message.
- If you hit a blocker that will take >20 minutes to resolve, flag it immediately and propose a workaround.
- All UI states should degrade gracefully — no blank screens, no uncaught errors. Use loading states and placeholder content.
- All data lives in `src/data/seed-data.ts`. One file. Easy to swap later. The Demo Reset control restores this original state at any time.
- Incorporate all branding, terminology, and persona details throughout — nav labels, page titles, sample data, empty states, badges, everything.
- The voice → work order flow is the hero moment. Spend extra time making it feel smooth and magical. If `OPENAI_API_KEY` is in `.env.local`, wire up real Whisper transcription — but never let it block the demo path.
- `.env.local` must be in `.gitignore`. Never commit API keys.

---

## Step 5: Demo Script (generate AFTER implementation)

Once the prototype is running, produce:
- A 2-minute walkthrough script: what I click, what I say, what the audience sees
- Key talking points connecting each screen to the value proposition
- The three "moments": wow (voice — simulated or live Whisper), speed (dispatch), enterprise brain (dashboard)
- **Fourth moment (optional but powerful):** role switcher — "Let me show you what the VP sees... now here's the vendor's view." Demonstrates multi-user awareness in 15 seconds.
- Screens or interactions to AVOID during the demo (stubbed or fragile areas)
- **Pre-demo checklist:** hit "Reset Demo Data" before every run to ensure clean starting state

---

## Constraints

- Everything runs on localhost. No external service dependencies **except** the optional Whisper transcription, which requires an OpenAI API key in `.env.local`. If the key is absent, the app is fully self-contained.
- Prioritize visual impact and interactivity over backend completeness.
- The audience is non-technical. They want to see the product vision come to life.
- Speed > perfection. But the demo must not crash.
- The prototype should feel like a real product in active development, not a hackathon sketch.
- The UI north star: **Slack + Uber + voice notes**, not **SAP + CMMS + accounting software**.
