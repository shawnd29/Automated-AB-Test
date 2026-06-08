---
name: ab-presentation
description: Generates a stakeholder-ready PowerPoint slide deck summarizing A/B test results for SaaS subscription experiments. Use this skill when the user wants to present experiment findings, create a readout deck, share test results with leadership or investors, or communicate what was tested, what won, and what to do next. Trigger whenever the user says /presentation, "create a deck", "make slides", "stakeholder readout", "present the results", "summarize the A/B test", or asks to consolidate experiment findings into a presentation. The deck includes an executive summary, conversion and revenue comparison between control and treatment, winner highlight, and a full appendix covering the framework methodology, metrics, hypotheses, and statistical design.
---

# /presentation — A/B Test Stakeholder Deck

Your job is to generate a polished PowerPoint deck that tells the story of the experiment from hypothesis to decision. Stakeholders care about three things: **what changed, did it work, and what does it mean for revenue**. Everything else is appendix.

Read `pptxgenjs.md` before writing any code — use PptxGenJS to build the deck from scratch.

## Step 1: Collect Experiment Results

Ask these questions upfront. Tell the user they can paste numbers directly from their analysis SQL output.

```
EXPERIMENT RESULTS — paste or fill in:

1.  Experiment name / description (e.g., "Onboarding Step Reduction v2")
2.  What was changed? (one sentence — the treatment vs control)
3.  Experiment dates (start → end)
4.  Assignment unit (user / account)

CONVERSION RESULTS
5.  Control:   n = _____  conversions = _____  rate = _____%
6.  Treatment: n = _____  conversions = _____  rate = _____%
7.  Lift (absolute): _____ pp    Lift (relative): _____%
8.  p-value: _____   Significant? (yes/no)

REVENUE RESULTS
9.  Control avg MRR per converted user:   $______
10. Treatment avg MRR per converted user: $______
11. Total incremental MRR (if shipped):   $______  (or "unknown")
12. Projected annual revenue impact:      $______  (or "unknown")

GUARDRAILS
13. Churn rate — Control: _____%  Treatment: _____%  Status: PASS / FAIL
14. Support tickets per user — Control: _____  Treatment: _____  Status: PASS / FAIL
15. Any other guardrail breached? (describe or "none")

DECISION
16. Recommendation: SHIP / DO NOT SHIP / EXTEND
17. Primary reason for recommendation (one sentence)

EXPERIMENT CONTEXT (from framework layers — paste what you have)
18. Hypothesis stated before the experiment
19. Primary metric name and definition
20. Secondary metrics tracked
21. Baseline conversion rate (pre-experiment)
22. Target MDE and actual MDE achieved
23. Sample size required vs actual
24. Activation event / aha moment definition
25. Pipeline / warehouse stack used
```

If the user doesn't have all fields, use "N/A" or "TBD" placeholders — never block on missing data.

## Step 2: Build the Slide Deck

Use PptxGenJS. Color palette: **Midnight Executive** — navy `1E2761` (primary), ice blue `CADCFC` (secondary), white `FFFFFF` (accent). Dark title/conclusion slides, white content slides.

Font pairing: **Calibri Bold** for headers, **Calibri** for body. Consistent left-aligned body text.

---

### SLIDE STRUCTURE

#### Slide 1 — Title (dark background `1E2761`)
- Large white experiment name (40pt bold)
- Subtitle: product area + date range (18pt, ice blue `CADCFC`)
- Bottom-right: winner badge — large colored pill shape
  - SHIP → green `22C55E` pill: "✓ TREATMENT WINS"
  - DO NOT SHIP → red `EF4444` pill: "✗ NO WINNER"
  - EXTEND → amber `F59E0B` pill: "→ INCONCLUSIVE"
- Bottom-left: small label "Confidential — Internal Use"

#### Slide 2 — Executive Summary (white background)
- Title: "What We Found" (36pt navy)
- Three large stat callouts in a row (use big numbers 60pt, label 14pt below):
  - Left box (navy bg, white text): conversion lift e.g. "+2.1pp" with label "Conversion Rate Lift"
  - Center box (green or red bg): p-value significance badge "p = 0.021 ✓ Significant"
  - Right box (navy bg, white text): revenue impact "$47K ARR" with label "Projected Annual Impact"
- Below callouts: one-sentence plain-English summary of the result
- Bottom pill: recommendation badge (SHIP / DO NOT SHIP / EXTEND) matching slide 1

#### Slide 3 — What We Tested (white background)
- Title: "The Experiment" (36pt navy)
- Two-column layout:
  - Left column — "Control" box (light gray `F3F4F6` background):
    - Label "CONTROL" in navy, small caps
    - Description of control experience
    - n = [sample size]
  - Right column — "Treatment" box (ice blue `CADCFC` background):
    - Label "TREATMENT" in navy, small caps
    - Description of what changed
    - n = [sample size]
- Below columns: hypothesis stated before experiment (italic, 14pt)
- Bottom label: "Assignment unit: [user/account] | Duration: [N] days"

#### Slide 4 — Conversion Results (white background)
- Title: "Conversion Rate: Control vs Treatment" (36pt navy)
- Large side-by-side comparison — two tall bars or two big number blocks:
  - Control block (gray `6B7280`): big % number (52pt bold), "Control" label below, "n = X" subscript
  - Treatment block (green `16A34A` if winner, red `DC2626` if loser): big % number (52pt bold), "Treatment" label, "n = X"
- Between blocks: arrow with lift label "+2.1pp (+17.5% relative)"
- Below: significance strip — colored bar spanning full width
  - Green: "Statistically Significant — p = 0.021 (α = 0.05)"
  - Red: "Not Significant — p = 0.21 (α = 0.05)"
- Bottom note: attribution window used (e.g., "Measured within 21-day window post-assignment")

#### Slide 5 — Revenue Impact (white background)
- Title: "Revenue Impact" (36pt navy)
- Top row: three metric callouts
  - "Avg MRR / Converted User" — control vs treatment side by side
  - "Incremental MRR (if shipped)" — single large number
  - "Projected 12-Month ARR" — single large number (highlight in green if positive)
- Below: simple two-row table (14pt)
  | | Control | Treatment | Δ |
  |---|---|---|---|
  | Conversion Rate | X% | Y% | +Zpp |
  | Avg MRR | $X | $Y | +$Z |
  | Revenue / Assigned User | $X | $Y | +$Z |
- Bottom note: "Revenue projections based on current traffic volume. Assumes lift holds at scale."

#### Slide 6 — Guardrail Check (white background)
- Title: "Guardrail Metrics — Did Anything Break?" (36pt navy)
- Three rows, each with: icon + metric name + control value + treatment value + PASS/FAIL badge
  - Row 1: Churn Rate — values — green PASS or red FAIL pill
  - Row 2: Support Tickets / User — values — green PASS or red FAIL pill
  - Row 3: Any additional guardrail — values — badge
- If all PASS: green banner across bottom "All guardrails clear — safe to ship"
- If any FAIL: red banner "⚠ Guardrail breach — do not ship until resolved"

#### Slide 7 — Recommendation (dark background `1E2761`)
- Title: "Recommendation" (40pt white)
- Large centered verdict pill — SHIP / DO NOT SHIP / EXTEND (60pt, bold, colored)
- Below: 3-bullet rationale (white, 16pt):
  - Primary metric result
  - Guardrail status
  - Revenue case
- Bottom: "Next Steps" — 2-3 action items (ice blue `CADCFC`, 14pt)
  - e.g., "Ship to 100% of new signups by [date]"
  - e.g., "Monitor churn for 30 days post-ramp"
  - e.g., "Begin next experiment: [hypothesis]"

---

### APPENDIX SLIDES

Appendix title slide (dark `1E2761`): "Appendix — Methodology & Framework" in white, 36pt

#### Appendix A — Framework Overview (white background)
- Title: "How This Test Was Built" (30pt navy)
- 6-row table showing the framework layers:
  | Layer | Name | What It Produced |
  |---|---|---|
  | 1 | Identity Infrastructure | Anonymous ID, identity stitching, assignment unit |
  | 2 | Event Tracking Schema | [N] events, activation event: [name] |
  | 3 | Data Pipeline | [Stack used] → [Warehouse] |
  | 4 | Metric Store | Primary: [metric], Guardrails: churn, tickets |
  | 5 | Assignment Pipeline | [Tool], [unit]-level, deterministic hash |
  | 6 | Analysis Readiness | n=[X] per variant, α=0.05, power=0.80 |

#### Appendix B — Metric Definitions (white background)
- Title: "Metric Definitions" (30pt navy)
- Three sections with icons:
  - **Primary Metric** — name, formula, attribution window
  - **Secondary Metrics** — bullet list: Day-7 retention, feature adoption, etc.
  - **Guardrail Metrics** — bullet list: churn rate (threshold), tickets/user (threshold)
- Bottom box: "All metrics were defined before the experiment launched."

#### Appendix C — Hypothesis & Statistical Design (white background)
- Title: "Hypothesis & Statistical Design" (30pt navy)
- Hypothesis block (light blue background, italic):
  > "By changing [X], we expect [primary metric] to increase by [MDE] because [behavioral reason]."
- Two-column stats table:
  | Parameter | Value |
  |---|---|
  | Significance level (α) | 0.05 |
  | Statistical power (1-β) | 0.80 |
  | Test type | Two-tailed proportion z-test |
  | Required n per variant | [N] |
  | Actual n per variant | [N] |
  | Baseline conversion rate | [X]% |
  | Target MDE | [X]pp ([X]% relative) |
  | Achieved MDE | [X]pp |
  | Experiment duration | [N] days |

#### Appendix D — Activation & Instrumentation (white background)
- Title: "Activation Event & Instrumentation" (30pt navy)
- Left column: "Aha Moment Definition"
  - Event name: `activation_achieved`
  - Trigger: [their specific aha moment]
  - Fired: server-side, once per user
- Right column: "Key Events Tracked" — bulleted list of 6-8 core events from their schema
- Bottom: pipeline diagram (simplified ASCII or shapes): App → [Segment/Rudder] → [Warehouse] → dbt → Experiment tool

#### Appendix E — Pre-Experiment Checklist (white background)
- Title: "Pre-Launch Checklist" (30pt navy)
- Two-column checklist with checkmarks — reproduce the filled-in checklist from /analysis:
  - Instrumentation items
  - Assignment items
  - Metrics items
  - Statistical items
- All items shown with ✓ checked (green) to confirm experiment was properly set up

---

## Step 3: QA the Deck

After generating, run visual QA per the pptx skill instructions:
1. Convert to PDF → images
2. Spawn a subagent to visually inspect all slides
3. Fix any overflow, overlap, or missing content
4. Re-verify affected slides

Pay special attention to:
- Slide 4 and 5: numbers must not overflow their callout boxes
- Slide 6: PASS/FAIL pills must be clearly readable against background
- Appendix tables: all columns must fit within slide margins

## Step 4: Save and Deliver

Save the file as: `[experiment-name]-results-[YYYY-MM-DD].pptx`

Tell the user:
1. File path
2. How to edit: "All text boxes are editable — click any number or label to update"
3. Slide count breakdown: "X main slides + Y appendix slides"
4. Which slide to lead with in a live presentation (Slide 2 — Executive Summary)
