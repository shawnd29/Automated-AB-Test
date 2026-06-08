# SaaS A/B Testing Framework

A complete, layered framework for building production-ready A/B experimentation infrastructure from zero — purpose-built for SaaS products optimizing for subscription growth and activation.

Each skill walks you through one layer of the stack interactively, asking product-specific questions and generating real artifacts: SQL schemas, TypeScript modules, dbt models, Python scripts, and PowerPoint decks.

---

## Quick Start

```
Starting from zero?          → /complete
Already have some pieces?    → start at the relevant layer below
Have results to present?     → /presentation
Not sure where to start?     → /abhelp
```

---

## The Framework

The stack is built in 6 sequential layers. Each layer depends on the one before it — identity must exist before events, events before pipeline, pipeline before metrics, and so on. The `/complete` command runs all six in a single session.

```
Layer 1: Identity       Who are your users?
Layer 2: Events         What are they doing?
Layer 3: Pipeline       Where does the data go?
Layer 4: Metrics        How do you measure it?
Layer 5: Assignment     How do users enter experiments?
Layer 6: Analysis       How do you call a winner?
```

---

## Skills Reference

### `/identity` — Layer 1: Identity Infrastructure

**Purpose:** Establishes the identity foundation every downstream experiment depends on. Without clean identity, variant assignment leaks across users, pre-signup behavior can't be attributed to conversions, and your experiment denominators are wrong.

**The skill asks:**
- B2B or B2C? (determines whether experiments are user-level or account-level)
- Auth method? (email, Google OAuth, GitHub, SSO, magic link)
- Trial model? (free trial, freemium, CC-required)
- Frontend stack? (React, Vue, plain JS, mobile)
- Do users collaborate in shared workspaces?

**What it produces:**
- `identity.ts` — client-side module generating `anonymous_id` (localStorage + cookie), `session_id` (sessionStorage), and a unified `getIdentity()` function
- `identity_stitching` SQL table — the critical join between anonymous pre-signup behavior and the authenticated user, including UTM attribution fields
- Server-side stitch handler — fires at signup completion to write the anonymous → user mapping
- Assignment unit recommendation — explains whether to randomize at user-level (B2C) or account-level (B2B) and why contamination happens when teammates land in different variants

**Key concept:** The identity stitch is the most important join in the entire data model. Every conversion metric traces back through it.

---

### `/events` — Layer 2: Event Tracking Schema

**Purpose:** Defines the complete taxonomy of events your product fires — from first page visit through cancellation. Events are the raw material for every experiment metric. Poorly named or inconsistently fired events make metric computation unreliable.

**The skill asks:**
- What does your product do? (one sentence)
- What is the aha moment — the first action that signals a user got real value?
- What are your onboarding steps in order?
- What features are locked behind the paid tier?
- How long is your free trial?

**What it produces:**
- `BaseEvent` TypeScript interface — the standard envelope every event carries: `event_id`, `timestamp`, `anonymous_id`, `user_id`, `account_id`, `session_id`, `experiment_context`, and `properties`
- Full event taxonomy across 7 funnel stages: acquisition, signup, onboarding, activation, engagement, conversion, and guardrail events — all using your product's real names and step descriptions
- `activation_achieved` event — your product's specific aha moment, defined precisely with all properties, fired server-side exactly once per user
- Client vs. server event matrix — which events are safe to fire client-side and which must be server-side (revenue and auth events are always server-side only)
- Naming conventions — `snake_case` past-tense verbs, `is_` boolean prefix, `_at` timestamp suffix, `_count` numeric suffix

**Key concept:** The `activation_achieved` event is your North Star. Everything upstream is acquisition. Everything downstream is monetization.

---

### `/pipeline` — Layer 3: Data Pipeline Architecture

**Purpose:** Selects and configures the right event collection → data warehouse pipeline for your scale and budget. This is an infrastructure decision that's expensive to undo — the skill guides you to the right choice for your situation.

**The skill asks:**
- Team size and engineering resources?
- Monthly active users (current or near-term)?
- Budget preference? (open source vs. managed)
- Preferred data warehouse? (BigQuery, Snowflake, Redshift)
- Server-side language? (Node.js, Python, Ruby, Go, etc.)
- Any compliance requirements? (GDPR, HIPAA, SOC 2)

**What it produces:**
- Stack recommendation across three tiers:
  - **Tier 1 (Lean):** RudderStack + BigQuery + dbt Core + GrowthBook — best under 50K MAU, cost-sensitive
  - **Tier 2 (Managed):** Segment + Snowflake + dbt Cloud + Statsig — best 50K–500K MAU
  - **Tier 3 (Scale):** Kafka + Snowflake + dbt Cloud + LaunchDarkly — best 500K+ MAU with compliance needs
- ASCII architecture diagram showing your full data flow
- SDK initialization code in your server language (Segment or RudderStack)
- Warehouse destination config (BigQuery or Snowflake JSON)
- Raw events table structure showing what lands after the sync
- Daily data quality check SQL — alerts if any event volume drops more than 50% vs. its 7-day average

**Key concept:** `received_at` (server time) is always authoritative for event ordering. `timestamp` is client time and can be wrong.

---

### `/metrics` — Layer 4: Metric Store

**Purpose:** Translates raw events into SQL models that reliably compute experiment metrics. This is the contract between data and decision-making. All metrics must be defined here before any experiment runs — defining them after you see results is how p-hacking happens.

**The skill asks:**
- What is your primary metric? (`activation_rate` or `trial_to_paid_conversion_rate` are the most common)
- How long is your trial in days?
- What is your attribution window? (how long after assignment should conversions count)
- BigQuery or Snowflake? (SQL syntax differs)
- User-level or account-level assignment?

**What it produces:**
- `experiment_assignments.sql` — base model, source of truth for all assigned users. The denominator for every metric. Never filtered.
- `activation_rate.sql` — primary metric option: % of assigned users reaching the aha moment within the activation window
- `trial_conversion_rate.sql` — primary metric option: % of trial users converting to paid within the attribution window, with average MRR
- `day7_retention.sql` — secondary metric: % of users returning on day 7, a leading indicator of long-term retention
- `guardrail_churn.sql` — if churn rate increases in treatment vs. control, the experiment fails regardless of primary metric
- `guardrail_support.sql` — if support tickets per user increase in treatment, the experiment fails
- Metrics summary table — all 5 models with their type, file, and decision role

**Key concept:** Guardrail metrics are hard stops. An experiment that lifts conversion but also spikes churn has not won.

---

### `/assignment` — Layer 5: Experiment Assignment Pipeline

**Purpose:** Designs how users are deterministically placed into control or treatment variants and how that placement is logged. This is the most critical layer for data integrity. Assignment must be logged at the moment of exposure — not at the moment of conversion.

**The skill asks:**
- User-level or account-level assignment? (B2B with collaboration → almost always account-level)
- Which experimentation tool? (GrowthBook, Statsig, LaunchDarkly, or custom)
- Server-side or client-side assignment? (server-side is strongly recommended)
- Traffic split? (50/50 default, or holdback like 90/10 for high-risk changes)
- Do you need mutual exclusion between simultaneous experiments?

**What it produces:**
- `assignVariant()` — deterministic hashing function using MD5 of `(unitId + experimentId)` mod 100. Same input always returns same variant. Salting with `experimentId` ensures experiments assign users independently.
- `getOrAssignVariant()` — assignment service with idempotency: checks for an existing assignment before creating a new one, preventing any user from flipping variants mid-experiment
- `experiment_assignments` SQL table — stores every assignment with `UNIQUE(unit_id, experiment_id)` constraint
- `experiment_assigned` event schema — the event fired at exposure, carrying `experiment_id`, `variant`, `assignment_unit`, `is_new_assignment`
- GrowthBook or Statsig integration code — wires the `trackingCallback` to fire the assignment event
- Daily SRM (Sample Ratio Mismatch) check SQL — alerts when the actual variant split deviates more than 1% from the intended split, which indicates a bucketing bug

**Key concept:** An SRM means your bucketing has a bug. Results from an experiment with an SRM cannot be trusted and should not be used to make decisions.

---

### `/analysis` — Layer 6: Analysis Readiness

**Purpose:** Calculates required sample sizes, verifies the experiment is properly set up before launch, monitors it during the run, and produces the decision framework and statistical tests for calling results at the end.

**The skill asks:**
- Baseline conversion rate? (what % currently hit the primary metric)
- Minimum detectable effect (MDE)? (smallest lift worth running an experiment for)
- Significance level (α)? (default 0.05 — 5% false positive rate)
- Statistical power (1-β)? (default 0.80 — 80% chance of detecting a real effect)
- One-tailed or two-tailed test? (default two-tailed)
- Daily new user / account volume?

**What it produces:**
- `sample_size.py` — Python script using `scipy.stats` that calculates required `n` per variant for a two-proportion z-test, filled in with your actual numbers
- Duration calculation — minimum days to run, always enforcing a 2-week minimum to account for weekly seasonality
- MDE sensitivity table — shows required sample size and days at different MDE assumptions so you understand the speed vs. sensitivity trade-off
- Pre-launch checklist — covering instrumentation, assignment, metrics, statistical setup, and documentation
- SRM monitoring SQL — run daily during the experiment
- Guardrail pulse SQL — daily check of churn and support ticket rates by variant
- Final analysis SQL — one query producing conversion rate by variant with lift calculation
- p-value computation — Python `proportions_ztest` snippet with your numbers
- Decision framework — three conditions that must all be true to ship: SRM clear, all guardrails pass, primary metric is significant in the expected direction

**Key concept:** Never peek at results before the planned end date. Early stopping inflates false positive rates dramatically.

---

### `/complete` — All 6 Layers End-to-End

**Purpose:** Runs the entire framework in a single guided session, collecting all inputs upfront and generating all artifacts in one coherent pass. Context from earlier layers flows into later ones — your event names from Layer 2 appear in your dbt models from Layer 4, your identity schema from Layer 1 is referenced in your assignment table from Layer 5.

**The skill asks:** All 21 questions from all 6 layers in a single numbered list, so you answer once and it builds everything.

**What it produces:** Every artifact from all 6 layers, plus a consolidated stack summary showing:
- All tools chosen and why
- Identity and assignment unit
- Key events (total count, activation event name, conversion event)
- Primary metric and guardrail thresholds
- Sample size and minimum experiment duration
- Recommended first experiment with hypothesis, trigger, and duration

**When to use it:** When starting from zero and want to build the complete stack in one session. The output is a full engineering specification.

---

### `/presentation` — Stakeholder Results Deck

**Purpose:** Converts experiment results into a polished, stakeholder-ready PowerPoint deck. Designed for presenting to executives, investors, or cross-functional teams — focused on what changed, whether it worked, and what it means for revenue. The appendix documents the full methodology for technical reviewers.

**The skill asks:** All experiment results in a single intake form — paste directly from your SQL output:
- Experiment name and what was changed
- Control and treatment conversion rates, sample sizes, p-value
- Revenue per converted user by variant, incremental MRR, projected ARR
- Guardrail metric results (PASS/FAIL for churn and support tickets)
- Final recommendation (SHIP / DO NOT SHIP / EXTEND)
- Hypothesis, metric definitions, and statistical parameters from the framework

**What it produces:**

*Main deck (7 slides):*
- **Title** — experiment name, date range, winner badge (green SHIP / red NO WINNER / amber INCONCLUSIVE)
- **Executive Summary** — three headline callouts: conversion lift, p-value significance badge, projected ARR impact
- **What We Tested** — control vs. treatment side-by-side with stated hypothesis
- **Conversion Results** — large % comparison with significance strip (green if significant, red if not)
- **Revenue Impact** — incremental MRR, ARR projection, per-user revenue comparison table
- **Guardrail Check** — PASS/FAIL badges for all guardrail metrics; red banner if any breach
- **Recommendation** — SHIP/DON'T SHIP verdict, 3-bullet rationale, next steps

*Appendix (5 slides):*
- **Framework Overview** — all 6 layers and what each produced for this experiment
- **Metric Definitions** — primary, secondary, and guardrail metrics with formulas and thresholds
- **Hypothesis & Statistical Design** — stated hypothesis, α, power, required vs. actual sample size, MDE
- **Activation & Instrumentation** — aha moment definition, key events tracked, pipeline diagram
- **Pre-Launch Checklist** — all items confirmed before experiment launch

**When to use it:** After `/analysis` — once you have p-values and lift numbers to report.

---

### `/abhelp` — Reference Guide

**Purpose:** Prints a quick reference card explaining every skill, what it covers, what it produces, and when to use it. No questions asked — just documentation.

**When to use it:** When you're not sure which skill to run next, or want a reminder of what each command does.

---

## Full Skill Map

```
/identity      Layer 1 — Who are your users?
/events        Layer 2 — What are they doing?
/pipeline      Layer 3 — Where does the data go?
/metrics       Layer 4 — How do you measure it?
/assignment    Layer 5 — How do users enter experiments?
/analysis      Layer 6 — How do you call a winner?
──────────────────────────────────────────────────
/complete      All 6 layers in one session
/presentation  Stakeholder PowerPoint from results
/abhelp        This reference guide
```

---

## Key Concepts Glossary

| Term | Definition |
|---|---|
| **Aha moment** | The specific product action most correlated with long-term retention — becomes the `activation_achieved` event |
| **Identity stitching** | The join table connecting anonymous pre-signup behavior to the authenticated user ID |
| **Assignment unit** | The entity randomized into variants — `user_id` for B2C, `account_id` for B2B with collaboration |
| **Experiment exposure** | The moment a user sees the variant — assignment must be logged here, not at conversion |
| **Intent-to-treat** | Analysis methodology where the denominator is all assigned users, not just those who engaged |
| **MDE** | Minimum Detectable Effect — the smallest lift that justifies the cost and time of running an experiment |
| **SRM** | Sample Ratio Mismatch — when the actual variant split deviates from the intended split, indicating a bucketing bug |
| **Guardrail metric** | A metric that fails the experiment if it worsens in treatment, even if the primary metric wins |
| **Attribution window** | The time period after assignment within which a conversion counts toward the experiment |
| **p-value** | Probability of seeing the observed lift (or larger) by chance if there were no real effect |
| **Statistical power** | Probability of detecting a real effect of the target MDE size — default 80% |

---

## Project Structure

```
automated-AB-test/
├── README.md                   ← This file
└── skills/
    ├── ab-identity/
    │   └── SKILL.md            ← /identity skill
    ├── ab-events/
    │   └── SKILL.md            ← /events skill
    ├── ab-pipeline/
    │   └── SKILL.md            ← /pipeline skill
    ├── ab-metrics/
    │   └── SKILL.md            ← /metrics skill
    ├── ab-assignment/
    │   └── SKILL.md            ← /assignment skill
    ├── ab-analysis/
    │   └── SKILL.md            ← /analysis skill
    ├── ab-complete/
    │   └── SKILL.md            ← /complete skill
    ├── ab-presentation/
    │   └── SKILL.md            ← /presentation skill
    └── ab-help/
        └── SKILL.md            ← /abhelp skill
```

## Next Steps 
- Get clearer connections with data sources
- Update experiences to track more nuanced events (CTR, Cancellation Rate)
- Get better mapping two events that lead to a conversion