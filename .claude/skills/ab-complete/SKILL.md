---
name: ab-complete
description: Runs all 6 layers of the SaaS A/B testing framework end-to-end in a single guided session. Use this skill when the user wants to build their complete A/B testing stack from scratch in one go, or types /complete. This skill carries context from each layer into the next so the final output is a coherent, integrated stack — not 6 disconnected pieces. Trigger whenever the user says /complete, "build the full stack", "set up everything", "do all the layers", or "start from scratch and build the whole framework".
---

# /complete — Full A/B Testing Stack (All 6 Layers)

You are running the complete end-to-end A/B testing framework setup. Your job is to guide the user through all 6 layers in sequence, collecting answers once at the start, then generating all artifacts in one coherent pass. Context from earlier layers feeds into later ones — for example, the identity schema from Layer 1 is referenced in the dbt models from Layer 4.

## Phase 0: Master Intake (collect everything upfront)

Before generating anything, ask all questions at once in a single numbered list. Tell the user: "I'll ask everything I need upfront so I don't interrupt you during the build."

```
LAYER 1 — IDENTITY
1. B2B or B2C?
2. Auth method? (email, Google OAuth, GitHub OAuth, SSO, magic link)
3. Do users collaborate in shared workspaces/accounts? (affects experiment unit)
4. Frontend stack? (React, Vue, plain JS, mobile, server-rendered)

LAYER 2 — EVENTS
5. What does your product do? (one sentence)
6. What is your aha moment — the first action that signals a user got real value?
7. List your onboarding steps in order (e.g., "connect data → invite team → create project")
8. What features are locked behind the paid tier?

LAYER 3 — PIPELINE
9. Team size / engineering resources? (solo, small startup <10, scaling team 10+)
10. Monthly active users (current or near-term)?
11. Budget preference? (minimize cost / managed reliability / no preference)
12. Warehouse preference? (BigQuery, Snowflake, Redshift, no preference)
13. Server-side language? (Node.js, Python, Ruby, Go, etc.)

LAYER 4 — METRICS
14. Primary metric? (activation_rate or trial_to_paid_conversion_rate — or describe your own)
15. Trial length in days?
16. Attribution window in days? (default: trial length + 7)

LAYER 5 — ASSIGNMENT
17. Experimentation tool? (GrowthBook, Statsig, LaunchDarkly, roll your own)
18. Server-side or client-side assignment? (server-side recommended)

LAYER 6 — ANALYSIS
19. Estimated baseline conversion rate? (e.g., "12% of trial users convert")
20. Minimum detectable effect? (e.g., "+2 percentage points" or "15% relative lift")
21. Daily new user / account volume entering experiments?
```

## Phase 1: Generate Layer 1 — Identity

Using answers from questions 1-4, generate:
- Client-side identity module (`identity.ts` or appropriate language)
- `identity_stitching` SQL table
- Server-side stitch handler
- Assignment unit recommendation (with clear reasoning)

Label this section clearly: `## Layer 1: Identity Infrastructure`

## Phase 2: Generate Layer 2 — Events

Using answers from questions 5-8 AND the identity model from Phase 1, generate:
- Base event envelope (TypeScript interface)
- Full event taxonomy tailored to their product — use their actual onboarding step names and feature names from question 7-8, not generic placeholders
- Specific `activation_achieved` event definition using their aha moment from question 6
- Client vs. server event matrix

Label this section: `## Layer 2: Event Tracking Schema`

## Phase 3: Generate Layer 3 — Pipeline

Using answers from questions 9-13, recommend and generate:
- Stack recommendation with cost estimate
- ASCII architecture diagram with their chosen tools filled in
- Segment or RudderStack initialization code in their server language
- Warehouse destination config (BigQuery or Snowflake)
- Daily data quality check SQL

Label this section: `## Layer 3: Data Pipeline Architecture`

## Phase 4: Generate Layer 4 — Metrics

Using answers from questions 14-16 AND the event names from Phase 2, generate:
- All dbt SQL models (use their actual event names, not generic `activation_achieved` if they named it something specific)
- Primary metric model for their chosen metric
- Secondary: Day-7 retention
- Guardrails: churn rate, support tickets
- Metrics summary table

Label this section: `## Layer 4: Metric Store`

## Phase 5: Generate Layer 5 — Assignment

Using answers from questions 17-18 AND the identity schema from Phase 1, generate:
- Deterministic hashing function
- Assignment service with their chosen unit (user or account)
- `experiment_assignments` SQL table
- `experiment_assigned` event definition
- Integration code for their chosen experimentation tool (GrowthBook / Statsig / etc.)
- Daily SRM check SQL

Label this section: `## Layer 5: Experiment Assignment Pipeline`

## Phase 6: Generate Layer 6 — Analysis

Using answers from questions 19-21 AND the metric models from Phase 4, generate:
- Sample size calculation with their actual numbers filled in
- Duration calculation
- Sensitivity table
- Pre-launch checklist (pre-filled with their experiment context)
- During-experiment monitoring SQL
- Final analysis SQL using their actual event and metric names
- p-value computation Python snippet

Label this section: `## Layer 6: Analysis Readiness`

## Final Output: Stack Summary

After all 6 layers, produce a consolidated summary:

```
## Your Complete A/B Testing Stack

TOOLS CHOSEN
├── Event Collection:    [Segment / RudderStack]
├── Data Warehouse:      [BigQuery / Snowflake]
├── Transformation:      dbt Core
├── Experimentation:     [GrowthBook / Statsig]
└── Visualization:       [Metabase / Looker Studio]

IDENTITY
├── Assignment unit:     [user / account]
└── Stitching table:     identity_stitching

KEY EVENTS (XX total)
├── Activation:          [their specific aha moment event name]
├── Conversion:          subscription_created (server-side)
└── Guardrails:          subscription_cancelled, support_ticket_created

PRIMARY METRIC:          [their chosen metric]
GUARDRAIL THRESHOLDS:    churn must not increase / tickets must not increase >10%

SAMPLE SIZE:             [N] per variant
MIN EXPERIMENT DURATION: [N] days

RECOMMENDED FIRST EXPERIMENT:
  Hypothesis: Test [simplest onboarding change] to improve activation rate
  Trigger:    [first onboarding step] viewed
  Duration:   [calculated days]
```

## Output Format Rules

- Each layer gets a clear `##` heading
- All code goes in labeled, language-tagged code blocks
- SQL blocks are labeled with the file path they'd be saved to
- No layer is skipped or summarized — produce the full artifact for each
- Use their actual product details throughout — never leave generic placeholders like `[YOUR_EVENT]` in the output
- Total output will be long — that's expected. This is a complete engineering spec.
