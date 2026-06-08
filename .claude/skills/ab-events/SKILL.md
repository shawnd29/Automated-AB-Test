---
name: ab-events
description: Layer 2 of the SaaS A/B testing framework — Event Tracking Schema. Use this skill when the user wants to define what events to track, design their event taxonomy, identify their product's aha moment / activation event, or build out the full event schema for A/B experimentation. Trigger whenever the user says /events, mentions "event schema", "what should I track", "aha moment", "activation event", "onboarding events", "click tracking schema", or asks how to instrument their product for experiments.
---

# Layer 2: Event Tracking Schema

Your job is to help the user define the complete set of events their product needs to fire — from first page visit through paid subscription. Events are the raw material for every metric in the experiment.

## Step 1: Ask These Questions First

Ask all at once.

1. **What does your product do?** — One sentence.
2. **What is the aha moment?** — The first moment a new user realizes they got value. If unsure, help them think through it: what action most correlates with users who stay long-term?
3. **How many onboarding steps exist?** — List them if known.
4. **What features are core to the paid tier?** — What do free users get blocked from?
5. **Trial length?** — Free trial days?

## Step 2: Define the Aha Moment

If the user isn't sure, guide them:

> "Think about your best retained users — the ones paying for 12+ months. What's the one action they almost all took in their first week that churned users didn't?"

Common patterns by product type:
| Product Type | Likely Aha Moment |
|---|---|
| Project management | First task assigned to a teammate |
| Analytics / BI | First dashboard with live data connected |
| Communication | First reply received from a teammate |
| Dev tool / API | First successful API call or deploy |
| Document / CMS | First document shared externally |
| CRM | First contact imported + first activity logged |

Name this event `activation_achieved`. Fire it exactly once per user (server-side, idempotency enforced).

## Step 3: Generate the Full Event Schema

### 3a. Base Event Envelope

```typescript
interface BaseEvent {
  event_id:    string;      // crypto.randomUUID()
  event_name:  string;      // snake_case past-tense verb_noun
  timestamp:   string;      // ISO 8601 UTC
  anonymous_id: string;
  user_id?:    string;      // present after auth
  account_id?: string;      // B2B only
  session_id:  string;
  experiment_context?: {
    experiment_id: string;
    variant:       string;
    assigned_at:   string;
  };
  properties:  Record<string, unknown>;
}
```

The `experiment_context` block attaches to every event during an active experiment — not just conversions.

### 3b. Full Event Taxonomy

Generate all events organized by funnel stage with realistic JSON examples. Use their actual product details from the intake answers — not generic placeholders.

**Acquisition:**
- `page_viewed` — page, utm_source, utm_campaign, referrer
- `pricing_page_viewed` — plan_highlighted, visited_from, time_on_site_secs

**Signup:**
- `signup_started` — signup_method, source_page
- `signup_completed` — signup_method, trial_type, cc_required, plan_at_signup *(also server-side)*

**Onboarding** — one `onboarding_step_viewed` + `onboarding_step_completed` per step they listed, plus:
- `onboarding_abandoned` — last_step_reached, drop_reason
- `onboarding_completed` — total_steps, time_to_complete_secs

**Activation:**
- `activation_achieved` — hours_since_signup, activation_trigger (their aha moment name), onboarding_completed, features_used_count, sessions_to_activate

**Engagement:**
- `feature_used` — feature_name, is_first_use, usage_count
- `session_started` — session_number, days_since_signup, days_since_last_session
- Collaboration events if relevant (invite_sent, teammate_joined)

**Conversion:**
- `upgrade_prompt_shown` — prompt_trigger, feature_blocked, days_in_trial
- `checkout_started` — plan_selected, mrr_value, trigger
- `subscription_created` — plan, mrr, trial_converted, days_to_convert *(server-side only)*

**Guardrail:**
- `subscription_cancelled` — plan, days_active, cancel_reason, mrr_lost *(server-side)*
- `support_ticket_created` — category, severity, days_in_trial

### 3c. Naming Conventions

- Event names: `snake_case`, past-tense verb_noun (`feature_used` not `use_feature`)
- Booleans: prefix `is_` or `has_`
- IDs: suffix `_id`
- Timestamps: suffix `_at`
- Counts: suffix `_count` or `_total`

## Step 4: Client vs. Server Matrix

| Event | Client | Server | Reason |
|---|---|---|---|
| page_viewed | ✓ | — | UI only |
| signup_completed | ✓ | ✓ | Both: client for timing, server is authoritative |
| activation_achieved | — | ✓ | Single-fire guarantee needs server |
| subscription_created | — | ✓ | Never trust client for revenue |

## Step 5: Summary

1. Count of events generated
2. Which event is `activation_achieved` for their specific product
3. Which events are server-side only
4. "Next step" → `/pipeline`
