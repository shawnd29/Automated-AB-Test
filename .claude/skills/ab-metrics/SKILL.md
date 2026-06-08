---
name: ab-metrics
description: Layer 4 of the SaaS A/B testing framework — Metric Store. Use this skill when the user wants to define experiment metrics, build dbt SQL models for activation rate or conversion rate, set up primary/secondary/guardrail metrics, or create a metric store for A/B test analysis. Trigger whenever the user says /metrics, mentions "dbt models", "metric store", "activation rate SQL", "guardrail metrics", "how do I measure", or asks what metrics to use for their experiments.
---

# Layer 4: Metric Store

Your job is to translate events into SQL models that reliably compute experiment metrics. Every metric used to call an experiment winner must live here, defined before the experiment runs. Post-hoc metric selection is how teams p-hack themselves into false confidence.

## Step 1: Ask These Questions First

Ask all at once.

1. **Primary metric?** — `activation_rate`, `trial_to_paid_conversion_rate`, or describe your own.
2. **Trial length in days?**
3. **Attribution window in days?** — Default: trial length + 7 days.
4. **Warehouse?** — BigQuery or Snowflake? (SQL syntax differs)
5. **Assignment unit?** — User-level or account-level?

## Step 2: Metric Taxonomy

Confirm with the user before writing SQL:

```
PRIMARY    → One per experiment. Win/loss decision made on this alone.
SECONDARY  → Directional signal. Cannot override primary.
GUARDRAIL  → Hard stops. Experiment fails if ANY guardrail worsens,
             even if the primary metric wins.
DIAGNOSTIC → Segment breakdowns used post-hoc to explain results.
```

## Step 3: Generate dbt Models

### 3a. Experiment Assignments Base

```sql
-- models/experiments/experiment_assignments.sql
SELECT
    user_id, account_id, experiment_id, variant,
    assigned_at, DATE(assigned_at) AS assignment_date
FROM {{ source('analytics_raw', 'tracks') }}
WHERE event = 'experiment_assigned'
```

### 3b. Primary: Activation Rate

```sql
-- models/metrics/activation_rate.sql
WITH assigned AS (
    SELECT user_id, account_id, variant, assigned_at
    FROM {{ ref('experiment_assignments') }}
    WHERE experiment_id = '{{ var("experiment_id") }}'
),
activations AS (
    SELECT user_id, MIN(timestamp) AS activated_at
    FROM {{ source('analytics_raw', 'tracks') }}
    WHERE event = 'activation_achieved'
    GROUP BY 1
)
SELECT
    a.variant,
    COUNT(DISTINCT a.user_id) AS total_assigned,
    COUNT(DISTINCT CASE
        WHEN TIMESTAMP_DIFF(act.activated_at, a.assigned_at, HOUR)
             <= {{ var("activation_window_hours", 336) }}
        THEN a.user_id END)   AS activated_users,
    SAFE_DIVIDE(
        COUNT(DISTINCT CASE
            WHEN TIMESTAMP_DIFF(act.activated_at, a.assigned_at, HOUR)
                 <= {{ var("activation_window_hours", 336) }}
            THEN a.user_id END),
        COUNT(DISTINCT a.user_id)
    ) AS activation_rate
FROM assigned a
LEFT JOIN activations act USING (user_id)
GROUP BY 1
```

### 3c. Primary: Trial-to-Paid Conversion Rate

```sql
-- models/metrics/trial_conversion_rate.sql
WITH assigned AS (
    SELECT user_id, account_id, variant, assigned_at
    FROM {{ ref('experiment_assignments') }}
    WHERE experiment_id = '{{ var("experiment_id") }}'
),
conversions AS (
    SELECT user_id, MIN(timestamp) AS converted_at,
           MAX(CAST(JSON_VALUE(properties, '$.mrr') AS FLOAT64)) AS mrr
    FROM {{ source('analytics_raw', 'tracks') }}
    WHERE event = 'subscription_created'
    GROUP BY 1
)
SELECT
    a.variant,
    COUNT(DISTINCT a.user_id) AS total_assigned,
    COUNT(DISTINCT CASE
        WHEN TIMESTAMP_DIFF(c.converted_at, a.assigned_at, DAY)
             <= {{ var("conversion_window_days", 21) }}
        THEN a.user_id END)   AS converted_users,
    SAFE_DIVIDE(
        COUNT(DISTINCT CASE
            WHEN TIMESTAMP_DIFF(c.converted_at, a.assigned_at, DAY)
                 <= {{ var("conversion_window_days", 21) }}
            THEN a.user_id END),
        COUNT(DISTINCT a.user_id)
    ) AS conversion_rate,
    AVG(CASE
        WHEN TIMESTAMP_DIFF(c.converted_at, a.assigned_at, DAY)
             <= {{ var("conversion_window_days", 21) }}
        THEN c.mrr END) AS avg_mrr_converted
FROM assigned a
LEFT JOIN conversions c USING (user_id)
GROUP BY 1
```

### 3d. Secondary: Day-7 Retention

```sql
-- models/metrics/day7_retention.sql
WITH assigned AS (
    SELECT user_id, variant, assigned_at
    FROM {{ ref('experiment_assignments') }}
    WHERE experiment_id = '{{ var("experiment_id") }}'
),
day7 AS (
    SELECT DISTINCT user_id
    FROM {{ source('analytics_raw', 'tracks') }}
    WHERE event = 'session_started'
      AND CAST(JSON_VALUE(properties, '$.days_since_signup') AS INT64) BETWEEN 6 AND 8
)
SELECT
    a.variant,
    COUNT(DISTINCT a.user_id) AS total_assigned,
    COUNT(DISTINCT d.user_id) AS returned_day7,
    SAFE_DIVIDE(COUNT(DISTINCT d.user_id), COUNT(DISTINCT a.user_id)) AS day7_retention_rate
FROM assigned a LEFT JOIN day7 d USING (user_id)
GROUP BY 1
```

### 3e. Guardrail: Churn Rate

```sql
-- models/metrics/guardrail_churn.sql
WITH paid AS (
    SELECT user_id, variant FROM {{ ref('trial_conversion_rate') }}
    WHERE converted_users IS NOT NULL
),
cancels AS (
    SELECT DISTINCT user_id FROM {{ source('analytics_raw', 'tracks') }}
    WHERE event = 'subscription_cancelled'
)
SELECT
    p.variant,
    COUNT(DISTINCT p.user_id) AS paid_users,
    COUNT(DISTINCT c.user_id) AS cancelled_users,
    SAFE_DIVIDE(COUNT(DISTINCT c.user_id), COUNT(DISTINCT p.user_id)) AS churn_rate
FROM paid p LEFT JOIN cancels c USING (user_id)
GROUP BY 1
```

### 3f. Guardrail: Support Ticket Rate

```sql
-- models/metrics/guardrail_support.sql
WITH assigned AS (
    SELECT user_id, variant FROM {{ ref('experiment_assignments') }}
    WHERE experiment_id = '{{ var("experiment_id") }}'
),
tickets AS (
    SELECT user_id, COUNT(*) AS ticket_count
    FROM {{ source('analytics_raw', 'tracks') }}
    WHERE event = 'support_ticket_created'
    GROUP BY 1
)
SELECT
    a.variant,
    COUNT(DISTINCT a.user_id) AS total_assigned,
    SUM(COALESCE(t.ticket_count, 0)) AS total_tickets,
    SAFE_DIVIDE(SUM(COALESCE(t.ticket_count, 0)), COUNT(DISTINCT a.user_id)) AS tickets_per_user
FROM assigned a LEFT JOIN tickets t USING (user_id)
GROUP BY 1
```

## Step 4: Metrics Summary Table

| Metric | Type | Model | Role |
|---|---|---|---|
| `activation_rate` | Primary option | `activation_rate.sql` | Win/loss |
| `trial_conversion_rate` | Primary option | `trial_conversion_rate.sql` | Win/loss |
| `day7_retention_rate` | Secondary | `day7_retention.sql` | Directional |
| `churn_rate` | Guardrail | `guardrail_churn.sql` | Fails experiment if increases |
| `tickets_per_user` | Guardrail | `guardrail_support.sql` | Fails experiment if increases |

Ask: "Which metric is your primary for the first experiment?" Confirm before moving on.

"Next step" → `/assignment`
