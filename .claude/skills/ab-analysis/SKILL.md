---
name: ab-analysis
description: Layer 6 of the SaaS A/B testing framework — Analysis Readiness. Use this skill when the user wants to calculate sample size for an A/B test, run a pre-experiment checklist, check for sample ratio mismatch, determine how long to run an experiment, calculate statistical significance, or verify an experiment is ready to call. Trigger whenever the user says /analysis, mentions "sample size", "statistical significance", "p-value", "MDE", "minimum detectable effect", "how long should I run", "is my experiment ready", "SRM check", or asks how to decide if an A/B test won or lost.
---

# Layer 6: Analysis Readiness

Your job is to help the user calculate sample sizes, verify readiness before launch, and produce the SQL and scripts needed to call results rigorously. Premature calls and ignored guardrails are the two most common ways experiments produce false confidence.

## Step 1: Ask These Questions First

Ask all at once.

1. **Baseline conversion rate?** — What % of users currently hit the primary metric? (e.g., "12% of trial users convert to paid")
2. **Minimum detectable effect (MDE)?** — Smallest lift worth caring about. (e.g., "+2 percentage points" or "15% relative lift")
3. **Significance level (α)?** — Default: 0.05 (5% false positive rate)
4. **Statistical power (1-β)?** — Default: 0.80 (80% — 20% false negative rate)
5. **One-tailed or two-tailed?** — Default: two-tailed (detects both increases and decreases)
6. **Daily new user / account volume?** — How many enter the experiment per day?

## Step 2: Sample Size Calculator

Explain the formula briefly, then generate a runnable Python script with their numbers filled in:

```python
# sample_size.py
import math
from scipy.stats import norm

def sample_size(baseline_rate, mde_absolute, alpha=0.05, power=0.80, two_tailed=True):
    z_alpha = norm.ppf(1 - alpha / (2 if two_tailed else 1))
    z_beta  = norm.ppf(power)
    p1, p2  = baseline_rate, baseline_rate + mde_absolute
    n = math.ceil((z_alpha + z_beta)**2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)**2)
    return {
        "n_per_variant":  n,
        "n_total":        n * 2,
        "baseline_rate":  f"{p1:.1%}",
        "expected_rate":  f"{p2:.1%}",
        "mde_relative":   f"+{mde_absolute/p1:.1%}",
    }

# Fill in with their actual numbers
result = sample_size(baseline_rate=0.12, mde_absolute=0.02)
print(result)
```

### Duration Calculation

```python
import math
from datetime import datetime, timedelta

daily_users   = 150   # their number
n_per_variant = result["n_per_variant"]
days_needed   = max(math.ceil(n_per_variant / (daily_users / 2)), 14)  # min 2 full weeks

end_date = datetime.today() + timedelta(days=days_needed)
print(f"Run for at least {days_needed} days ({days_needed/7:.1f} weeks)")
print(f"Earliest call date: {end_date.strftime('%Y-%m-%d')}")
```

### Sensitivity Table

Show a table using their baseline rate across different MDE assumptions so they understand the trade-off between sensitivity and experiment length.

## Step 3: Pre-Launch Checklist

Generate this checklist pre-filled with their experiment context:

```
PRE-LAUNCH CHECKLIST — Experiment: ________________________

INSTRUMENTATION
□ activation_achieved / subscription_created fires reliably
□ experiment_assigned fires at exposure (not at conversion)
□ Server-side events in place for revenue events
□ No instrumentation deploys planned during experiment window

ASSIGNMENT
□ Assignment unit confirmed (user / account)
□ Same input always returns same variant (tested)
□ No cross-contamination possible

METRICS
□ Primary metric SQL model reviewed
□ Secondary metrics defined
□ Guardrail thresholds documented:
    - Churn rate: must not increase
    - Support tickets: must not increase >10%
□ Attribution window documented: _____ days

STATISTICAL
□ Sample size calculated: _____ per variant
□ Minimum runtime: _____ days
□ Planned end date: _____
□ No early stopping / peeking planned

DOCUMENTATION
□ Hypothesis written: "By changing X, we expect Y to increase by Z% because..."
□ Expected direction of primary metric stated
□ Owner and stakeholders notified
```

## Step 4: During-Experiment Monitoring SQL

### SRM Check (run daily)

```sql
SELECT
    variant,
    COUNT(*) AS n,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS actual_pct,
    50.0 AS expected_pct,
    CASE WHEN ABS(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () - 50.0) > 1.0
         THEN 'SRM DETECTED'
         ELSE 'OK' END AS status
FROM experiment_assignments
WHERE experiment_id = '{{ experiment_id }}'
GROUP BY 1;
```

### Guardrail Pulse (run daily)

```sql
SELECT
    a.variant,
    COUNT(DISTINCT a.user_id) AS assigned,
    SAFE_DIVIDE(COUNT(DISTINCT t.user_id), COUNT(DISTINCT a.user_id)) AS ticket_rate,
    SAFE_DIVIDE(COUNT(DISTINCT c.user_id), COUNT(DISTINCT a.user_id)) AS cancel_rate
FROM experiment_assignments a
LEFT JOIN (SELECT DISTINCT user_id FROM analytics_raw.tracks WHERE event = 'support_ticket_created') t USING (user_id)
LEFT JOIN (SELECT DISTINCT user_id FROM analytics_raw.tracks WHERE event = 'subscription_cancelled') c USING (user_id)
WHERE a.experiment_id = '{{ experiment_id }}'
GROUP BY 1;
```

## Step 5: Calling the Experiment

### Decision Framework

```
At end of planned runtime (never before):

1. SRM check → if detected, investigate before reading results
2. Guardrails → if ANY worsen in treatment, FAIL regardless of primary
3. Primary metric:
   - p < α AND direction matches hypothesis → SHIP
   - p < α AND negative direction → FAIL, investigate
   - p ≥ α → INCONCLUSIVE — do not ship
4. Review secondary metrics for directional consistency
5. Document decision with p-value, lift, and CI
```

### Final Analysis — Python

```python
from scipy.stats import proportions_ztest

# Fill in from your final SQL query
control_n,   control_conversions   = 950, 114   # example
treatment_n, treatment_conversions = 950, 133

stat, p_value = proportions_ztest(
    [treatment_conversions, control_conversions],
    [treatment_n, control_n]
)

lift_pp  = (treatment_conversions/treatment_n) - (control_conversions/control_n)
lift_pct = lift_pp / (control_conversions/control_n) * 100

print(f"p-value: {p_value:.4f}")
print(f"Lift: +{lift_pp:.1%} absolute (+{lift_pct:.1f}% relative)")
print(f"Decision: {'SHIP' if p_value < 0.05 and lift_pp > 0 else 'DO NOT SHIP'}")
```

## Step 6: Summary

1. Sample size and duration filled in with their numbers
2. The three conditions to ship: SRM clear + guardrails OK + primary significant
3. Congratulate them — they now have a complete, production-ready A/B testing framework across all 6 layers
