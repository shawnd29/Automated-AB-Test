---
name: ab-assignment
description: Layer 5 of the SaaS A/B testing framework — Experiment Assignment Pipeline. Use this skill when the user wants to set up variant assignment, build bucketing/hashing logic for A/B tests, configure GrowthBook or Statsig, define the experiment_assigned event, or design how users get placed into control vs treatment. Trigger whenever the user says /assignment, mentions "variant assignment", "bucketing logic", "feature flags", "GrowthBook", "Statsig", "LaunchDarkly", "how do users get into experiments", or asks about splitting traffic between variants.
---

# Layer 5: Experiment Assignment Pipeline

Your job is to design how users are deterministically placed into experiment variants and how that assignment is logged. This is the most critical layer for data integrity — a bucketing bug or logging gap invalidates an entire experiment.

The golden rule: **assignment must be logged at exposure, not at conversion.** If you log assignment only when a user converts, your denominators are wrong and every metric is biased.

## Step 1: Ask These Questions First

Ask all at once.

1. **Assignment unit?** — User-level (`user_id`) or account-level (`account_id`)? B2B with collaboration → almost always account-level.
2. **Experimentation tool?** — GrowthBook (open source), Statsig, LaunchDarkly, Optimizely, or roll your own?
3. **Where does assignment happen?** — Server-side (recommended), client-side, or edge/CDN?
4. **Traffic allocation?** — 50/50 default, or holdback (e.g., 90/10 for risky changes)?
5. **Multiple simultaneous experiments?** — Need mutual exclusion between experiments?

## Step 2: Recommend Assignment Architecture

### Why Server-Side Is Preferred

| | Client-side | Server-side |
|---|---|---|
| Security | ✗ Visible in DevTools | ✓ Not exposed |
| Reliability | ✗ Can be blocked by extensions | ✓ 100% delivery |
| Flicker | ✗ UI can flicker before variant loads | ✓ None |
| Consistency | ✗ Can vary across devices | ✓ Always consistent |
| Latency | ✓ No server roundtrip | ✗ Adds ~10-50ms |

Assign server-side at session start or experiment trigger point, then pass the variant to the client as part of the API response or session object.

## Step 3: Generate Assignment Logic

### 3a. Deterministic Hashing Function

```typescript
// assignment.ts
import { createHash } from 'crypto';

/**
 * Assigns a user/account to a variant deterministically.
 * Salting with experimentId ensures independent assignment across experiments.
 */
export function assignVariant(
  unitId: string,
  experimentId: string,
  variants: { name: string; weight: number }[]  // weights must sum to 100
): string {
  const hash   = createHash('md5').update(`${unitId}:${experimentId}`).digest('hex');
  const bucket = parseInt(hash.substring(0, 8), 16) % 100;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.name;
  }
  return variants[variants.length - 1].name;
}

// Example: 50/50 split
const variant = assignVariant('acc_abc123', 'exp_onboarding_v2', [
  { name: 'control',   weight: 50 },
  { name: 'treatment', weight: 50 },
]);
```

### 3b. Assignment Service (with idempotency)

```typescript
// assignment-service.ts
export async function getOrAssignVariant(
  userId: string,
  accountId: string | undefined,
  experiment: { experiment_id: string; variants: { name: string; weight: number }[]; assignment_unit: 'user' | 'account' }
): Promise<{ variant: string; isNewAssignment: boolean }> {

  const unitId = experiment.assignment_unit === 'account' && accountId ? accountId : userId;

  const existing = await db.query(
    'SELECT variant FROM experiment_assignments WHERE unit_id = $1 AND experiment_id = $2',
    [unitId, experiment.experiment_id]
  );
  if (existing.rows[0]) return { variant: existing.rows[0].variant, isNewAssignment: false };

  const variant = assignVariant(unitId, experiment.experiment_id, experiment.variants);

  await db.query(`
    INSERT INTO experiment_assignments (unit_id, user_id, account_id, experiment_id, variant, assigned_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (unit_id, experiment_id) DO NOTHING
  `, [unitId, userId, accountId, experiment.experiment_id, variant]);

  return { variant, isNewAssignment: true };
}
```

### 3c. Experiment Assignments Table

```sql
CREATE TABLE experiment_assignments (
    id              BIGSERIAL PRIMARY KEY,
    unit_id         VARCHAR(36)  NOT NULL,
    user_id         VARCHAR(36)  NOT NULL,
    account_id      VARCHAR(36),
    experiment_id   VARCHAR(100) NOT NULL,
    variant         VARCHAR(50)  NOT NULL,
    assigned_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(unit_id, experiment_id)
);

CREATE INDEX idx_exp_unit       ON experiment_assignments(unit_id, experiment_id);
CREATE INDEX idx_exp_experiment ON experiment_assignments(experiment_id, variant);
```

### 3d. experiment_assigned Event

```json
{
  "event_name": "experiment_assigned",
  "user_id":    "usr_xyz789",
  "account_id": "acc_def456",
  "properties": {
    "experiment_id":    "exp_onboarding_v2",
    "variant":          "treatment",
    "assignment_unit":  "account",
    "unit_id":          "acc_def456",
    "is_new_assignment": true,
    "assigned_at":      "2026-06-07T10:00:00.000Z"
  }
}
```

### 3e. GrowthBook Integration (if selected)

```typescript
import { GrowthBook } from '@growthbook/growthbook';

export function createGrowthBook(userId: string, accountId?: string) {
  return new GrowthBook({
    apiHost:   'https://cdn.growthbook.io',
    clientKey: process.env.GROWTHBOOK_CLIENT_KEY,
    attributes: { id: userId, account_id: accountId },
    trackingCallback: (experiment, result) => {
      analytics.track('experiment_assigned', {
        experiment_id:    experiment.key,
        variant:          result.variationId === 0 ? 'control' : 'treatment',
        is_new_assignment: true,
      });
    },
  });
}
```

For Statsig, generate the equivalent `StatsigClient` initialization.

## Step 4: Daily SRM Check

```sql
-- Sample Ratio Mismatch — if actual split deviates >1% from intended, halt and investigate
SELECT
    variant,
    COUNT(*) AS n,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS actual_pct,
    50.0 AS expected_pct,
    ABS(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () - 50.0) AS deviation_pct,
    CASE WHEN ABS(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () - 50.0) > 1.0
         THEN 'SRM DETECTED — DO NOT SHIP'
         ELSE 'OK' END AS status
FROM experiment_assignments
WHERE experiment_id = 'exp_onboarding_v2'
GROUP BY 1;
```

Run this daily from day 1. An SRM means the bucketing has a bug — results are invalid until resolved.

## Step 5: Summary

1. Assignment unit confirmed + rationale
2. SRM monitoring reminder
3. "Next step" → `/analysis`
