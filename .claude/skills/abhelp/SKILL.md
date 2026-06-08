---
name: ab-help
description: Reference guide for the SaaS A/B testing framework skills. Use this skill when the user types /abhelp, asks "what skills are available", "how does this framework work", "what does /identity do", "remind me what each layer covers", or wants a quick overview of the A/B testing framework commands before deciding where to start.
---

# A/B Testing Framework — Reference Guide

Print this reference card exactly as formatted. No questions, no interactivity — just the docs.

---

## The Framework

This is a 6-layer framework for building a complete A/B testing stack for SaaS products optimizing for subscription growth. Each layer produces real artifacts (SQL, code, configs) for your specific product. You work through the layers in order, or run `/complete` to do them all at once.

---

## Skills Reference

### `/identity` — Layer 1: Identity Infrastructure
**What it covers:** How users are identified before and after login, and how those identities are joined.
**What it produces:**
- Client-side anonymous ID generation code (JS/TS)
- `identity_stitching` SQL table schema
- Server-side identity merge handler
- Experiment assignment unit recommendation (user-level vs account-level)

**When to use it:** Starting from zero instrumentation, or if your pre-signup and post-signup data are disconnected. This layer is required before any other layer — everything downstream depends on clean identity.

---

### `/events` — Layer 2: Event Tracking Schema
**What it covers:** What events to fire, when to fire them, and what properties each event carries.
**What it produces:**
- Base event envelope (TypeScript interface)
- Full event taxonomy: acquisition → signup → onboarding → activation → engagement → conversion → guardrail events
- Your specific `activation_achieved` event (your product's aha moment)
- Client vs. server event matrix

**When to use it:** When you need to decide what to instrument before writing any tracking code. Run this before wiring up Segment or RudderStack.

---

### `/pipeline` — Layer 3: Data Pipeline Architecture
**What it covers:** How events travel from your app to a queryable data warehouse.
**What it produces:**
- Stack recommendation (Segment/RudderStack → BigQuery/Snowflake) with cost estimate
- ASCII architecture diagram for your chosen stack
- Initialization code for your event collection tool (in your server language)
- Warehouse destination config
- Daily data quality check SQL

**When to use it:** After events are defined (Layer 2), when you're ready to choose your analytics infrastructure. Also useful if you're evaluating Segment vs RudderStack or BigQuery vs Snowflake.

---

### `/metrics` — Layer 4: Metric Store
**What it covers:** SQL models that turn raw events into experiment-ready metrics. This is the contract between data and decisions.
**What it produces:**
- dbt SQL model: `activation_rate`
- dbt SQL model: `trial_to_paid_conversion_rate`
- dbt SQL model: `day7_retention` (secondary)
- dbt SQL model: `guardrail_churn`
- dbt SQL model: `guardrail_support_tickets`
- Metrics YAML for dbt metrics layer

**When to use it:** After your pipeline is set up and events are flowing. All metrics must be defined here before any experiment runs — not after.

---

### `/assignment` — Layer 5: Experiment Assignment Pipeline
**What it covers:** How users are deterministically bucketed into control vs treatment, and how that assignment is logged.
**What it produces:**
- Deterministic hashing function (TypeScript)
- Assignment service with idempotency guarantees
- `experiment_assignments` SQL table
- `experiment_assigned` event definition
- GrowthBook / Statsig integration code
- Daily SRM (Sample Ratio Mismatch) check SQL

**When to use it:** When you're ready to wire up your experimentation tool and need the bucketing logic to be correct from day one.

---

### `/analysis` — Layer 6: Analysis Readiness
**What it covers:** Statistical setup, sample size calculation, experiment monitoring, and the decision framework for calling results.
**What it produces:**
- Sample size calculator (Python) with your actual numbers
- Experiment duration estimate
- Pre-launch checklist (filled in for your context)
- During-experiment SRM and guardrail monitoring SQL
- Final analysis SQL + p-value computation
- Decision framework: when to ship, fail, or extend

**When to use it:** Before launching any experiment to confirm you have enough traffic, and again at the end when calling results.

---

### `/complete` — All 6 Layers End-to-End
**What it covers:** Everything above, in one session.
**What it produces:** All artifacts from all 6 layers, using your product's actual details throughout — not generic templates. Collects all inputs upfront in a single intake, then generates the full stack.

**When to use it:** When starting from zero and want everything built in one go. The output is a complete engineering spec for your A/B testing infrastructure.

---

### `/presentation` — Stakeholder Results Deck
**What it covers:** Converts experiment results into a polished PowerPoint for executives, investors, or cross-functional stakeholders.
**What it produces:**
- Title slide with winner badge (SHIP / DO NOT SHIP / INCONCLUSIVE)
- Executive summary with 3 headline callouts (lift, p-value, revenue impact)
- What We Tested slide (control vs treatment description)
- Conversion results: side-by-side rate comparison with significance strip
- Revenue impact: incremental MRR, ARR projection, per-user revenue table
- Guardrail check: PASS/FAIL status for churn, support tickets
- Recommendation slide with rationale and next steps
- **Appendix:** Framework overview (all 6 layers), metric definitions, hypothesis, statistical design, activation instrumentation, pre-launch checklist

**When to use it:** After `/analysis` — once you have results to share. Accepts raw numbers from your SQL output and builds a complete, editable deck.

---

### `/abhelp` — This Reference Guide
**What it covers:** A quick overview of all skills and what they produce.
**When to use it:** When you're not sure which layer to start with, or want to remind yourself what each skill does.

---

## Recommended Starting Order

```
First time (zero instrumentation):
/complete → build everything at once

Already have partial instrumentation:
/identity     → establish who your users are
/events       → define what to track
/pipeline     → connect events to warehouse
/metrics      → build your metric store
/assignment   → set up experiment bucketing
/analysis     → verify readiness before launch

After the experiment runs:
/presentation → build the stakeholder readout deck
```

## Key Concepts

| Term | Definition |
|---|---|
| **Aha moment** | The first action that predicts long-term retention — your activation event |
| **Identity stitching** | Joining anonymous pre-signup behavior to the authenticated user |
| **Assignment unit** | The entity randomized into variants — user (B2C) or account (B2B) |
| **MDE** | Minimum Detectable Effect — smallest lift worth running an experiment for |
| **SRM** | Sample Ratio Mismatch — when actual variant split differs from intended (indicates a bug) |
| **Intent-to-treat** | Analysis denominator = all assigned users, not just those who engaged |
| **Guardrail metric** | A metric that fails the experiment if it worsens, even if the primary metric wins |
