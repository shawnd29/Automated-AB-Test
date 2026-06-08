---
name: ab-pipeline
description: Layer 3 of the SaaS A/B testing framework — Data Pipeline Architecture. Use this skill when the user wants to choose and configure their event collection stack, connect events to a data warehouse, or design the data flow from client/server instrumentation through to queryable storage. Trigger whenever the user says /pipeline, mentions "Segment", "RudderStack", "BigQuery", "Snowflake", "data pipeline", "event collection", "warehouse setup", or asks how events get from their app to somewhere they can query them.
---

# Layer 3: Data Pipeline Architecture

Your job is to help the user select and configure the right event collection → warehouse pipeline. The wrong choice creates years of migration pain; the right choice is the one they'll actually maintain.

## Step 1: Ask These Questions First

Ask all at once.

1. **Team size / eng resources?** — Solo founder, small startup (<10 eng), or scaling team (10+)?
2. **Monthly active users (MAU)?** — Current or near-term target.
3. **Budget preference?** — Minimize cost, pay for managed reliability, or no preference?
4. **Preferred warehouse?** — BigQuery, Snowflake, Redshift, or no preference?
5. **Server-side language?** — Node.js, Python, Ruby, Go, Java, etc.?
6. **Privacy / compliance concerns?** — GDPR, HIPAA, SOC 2?

## Step 2: Recommend a Stack

Based on answers, recommend one tier:

**Tier 1 — Lean / Open Source** (small team, cost-sensitive, <50K MAU)
```
RudderStack (self-hosted or Cloud Free) → BigQuery (generous free tier)
dbt Core (free) → Metabase (open source) → GrowthBook (open source)
```

**Tier 2 — Managed / Balanced** (50K–500K MAU, ~$500-2000/mo)
```
Segment (Team plan) → Snowflake or BigQuery
dbt Cloud (developer free tier) → Metabase or Looker Studio → Statsig or GrowthBook Cloud
```

**Tier 3 — Scale** (500K+ MAU, compliance requirements, dedicated data team)
```
Segment or in-house Kafka → Snowflake
dbt Cloud → Looker or Tableau → LaunchDarkly or Statsig Enterprise
```

Explain the recommendation in 2-3 sentences specific to their answers, including estimated monthly cost.

## Step 3: Generate Configuration

### 3a. ASCII Architecture Diagram

Fill in the bracketed tools with the user's specific choices:

```
┌──────────────────────────────────────────────────────────────────┐
│                    EVENT FLOW ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Browser/App           Collection Layer        Warehouse           │
│  ─────────────         ────────────────        ─────────           │
│                                                                    │
│  analytics.js  ───────► [Segment/Rudder] ──────► [BigQuery/        │
│  (client events)              │                   Snowflake]        │
│                               │                        │            │
│  Server SDK    ───────►       │               dbt transformation    │
│  (server events)              │                        │            │
│                         [Raw Event Tables]      Metric Store        │
│                                                                    │
│  Experimentation        Identity Layer                             │
│  ─────────────────      ──────────────                             │
│  [GrowthBook/           identity_stitching                         │
│   Statsig]  ◄────       table (anon → user)                       │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 3b. SDK Initialization Code

Generate for their chosen tool and server language.

**Segment — browser:**
```javascript
import { AnalyticsBrowser } from '@segment/analytics-next';

export const analytics = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY,
});

export function identifyUser(userId, traits) {
  analytics.identify(userId, traits);
}

export function identifyAccount(accountId, traits) {
  analytics.group(accountId, traits);  // B2B
}
```

**Segment — server-side (Node.js):**
```typescript
import { Analytics } from '@segment/analytics-node';

const analytics = new Analytics({ writeKey: process.env.SEGMENT_WRITE_KEY });

export function trackServer(userId: string, event: string, properties: object) {
  analytics.track({ userId, event, properties });
}
```

Adapt to the user's server language (Python: `analytics-python`, Ruby: `analytics-ruby`, etc.).

### 3c. Warehouse Destination Config

**BigQuery:**
```json
{
  "type": "BIGQUERY",
  "project_id": "<your-gcp-project>",
  "dataset": "analytics_raw",
  "credentials": "<service-account-json>",
  "sync_frequency": "every_30_mins"
}
```

**Snowflake:**
```json
{
  "type": "SNOWFLAKE",
  "account":   "<org>-<account>",
  "warehouse": "COMPUTE_WH",
  "database":  "ANALYTICS",
  "schema":    "RAW",
  "username":  "<service-user>",
  "role":      "TRANSFORMER"
}
```

### 3d. Raw Table Structure

```sql
-- What lands in the warehouse after Segment/Rudderstack syncs
-- Use received_at (server time) for ordering — timestamp is client time and can be wrong
SELECT
    id,               -- Segment event UUID
    anonymous_id,
    user_id,
    event,            -- event_name
    timestamp,        -- client time
    received_at,      -- server receipt time (authoritative)
    context_page_url,
    context_campaign_source,
    properties        -- JSON blob of event properties
FROM analytics_raw.tracks
LIMIT 5;
```

### 3e. Daily Data Quality Check

```sql
-- Alert if any event drops >50% vs 7-day average — catches silent failures
WITH daily_counts AS (
  SELECT DATE(received_at) AS event_date, event AS event_name, COUNT(*) AS n
  FROM analytics_raw.tracks
  WHERE received_at >= CURRENT_DATE - 14
  GROUP BY 1, 2
),
avg_counts AS (
  SELECT event_name, AVG(n) AS avg_7d
  FROM daily_counts
  WHERE event_date BETWEEN CURRENT_DATE - 8 AND CURRENT_DATE - 1
  GROUP BY 1
)
SELECT d.event_name, d.n AS today, ROUND(a.avg_7d) AS avg_7d,
       ROUND(d.n / a.avg_7d * 100, 1) AS pct_of_avg
FROM daily_counts d JOIN avg_counts a USING (event_name)
WHERE d.event_date = CURRENT_DATE - 1
  AND d.n < a.avg_7d * 0.5
ORDER BY pct_of_avg;
```

## Step 4: Summary

1. Chosen stack with cost estimate at their MAU
2. "Next step" → `/metrics`
