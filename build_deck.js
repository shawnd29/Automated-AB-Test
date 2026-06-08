const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Website Version Pilot — A/B Test Results";

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY   = "1E2761";
const ICE    = "CADCFC";
const WHITE  = "FFFFFF";
const GREEN  = "22C55E";
const DKGRN  = "16A34A";
const GRAY   = "6B7280";
const LTGRAY = "F3F4F6";
const RED    = "EF4444";

// ── Reusable factories ────────────────────────────────────────────────────────
const shadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12 });

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  // Experiment name
  s.addText("Website Version Pilot", {
    x: 0.6, y: 1.4, w: 8.8, h: 1.0,
    fontSize: 42, bold: true, color: WHITE, fontFace: "Calibri",
    align: "left", margin: 0,
  });

  // Subtitle
  s.addText("A/B Test Results  ·  Group A vs Group B  ·  n = 200 per variant", {
    x: 0.6, y: 2.5, w: 8.8, h: 0.5,
    fontSize: 18, color: ICE, fontFace: "Calibri", align: "left", margin: 0,
  });

  // Winner pill (bottom-right)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.8, y: 4.5, w: 2.7, h: 0.72,
    fill: { color: GREEN }, line: { color: GREEN }, rectRadius: 0.12,
  });
  s.addText("✓  TREATMENT WINS", {
    x: 6.8, y: 4.5, w: 2.7, h: 0.72,
    fontSize: 15, bold: true, color: WHITE, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });

  // Confidential label
  s.addText("Confidential — Internal Use Only", {
    x: 0.5, y: 5.1, w: 3.5, h: 0.35,
    fontSize: 10, color: ICE, fontFace: "Calibri", align: "left", margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Executive Summary
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("What We Found", {
    x: 0.5, y: 0.3, w: 9, h: 0.65,
    fontSize: 36, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  // Three callout boxes
  const boxes = [
    { x: 0.4,  label: "Metric Lift (Absolute)", big: "+1.42", sub: "Group B vs Group A", bg: NAVY, tc: WHITE, sc: ICE },
    { x: 3.65, label: "Statistical Significance", big: "p < 0.0001", sub: "✓ Highly Significant (α = 0.05)", bg: DKGRN, tc: WHITE, sc: WHITE },
    { x: 6.9,  label: "Relative Improvement", big: "+47.4%", sub: "Treatment over Control", bg: NAVY, tc: WHITE, sc: ICE },
  ];

  boxes.forEach(b => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: b.x, y: 1.15, w: 2.9, h: 2.2,
      fill: { color: b.bg }, line: { color: b.bg }, shadow: shadow(),
    });
    s.addText(b.big, {
      x: b.x, y: 1.3, w: 2.9, h: 1.1,
      fontSize: 42, bold: true, color: b.tc, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(b.label, {
      x: b.x, y: 2.4, w: 2.9, h: 0.35,
      fontSize: 11, bold: true, color: b.sc, fontFace: "Calibri",
      align: "center", margin: 0,
    });
    s.addText(b.sub, {
      x: b.x, y: 2.75, w: 2.9, h: 0.4,
      fontSize: 10, color: b.sc, fontFace: "Calibri",
      align: "center", margin: 0,
    });
  });

  // One-sentence summary
  s.addText(
    "Group B (new website version) outperformed Group A by 47.4% on the primary metric with overwhelming statistical confidence — both parametric and non-parametric tests confirm the result.",
    {
      x: 0.5, y: 3.6, w: 9, h: 0.65,
      fontSize: 14, color: "374151", fontFace: "Calibri", align: "left", margin: 0,
    }
  );

  // Recommendation pill
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 3.65, y: 4.45, w: 2.7, h: 0.65,
    fill: { color: GREEN }, line: { color: GREEN }, rectRadius: 0.1,
  });
  s.addText("RECOMMENDATION: SHIP", {
    x: 3.65, y: 4.45, w: 2.7, h: 0.65,
    fontSize: 13, bold: true, color: WHITE, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — What We Tested
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("The Experiment", {
    x: 0.5, y: 0.3, w: 9, h: 0.65,
    fontSize: 36, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  // Control box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.15, w: 4.3, h: 2.8,
    fill: { color: LTGRAY }, line: { color: "E5E7EB" }, shadow: shadow(),
  });
  s.addText("CONTROL — Group A", {
    x: 0.5, y: 1.25, w: 4.1, h: 0.4,
    fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri",
    align: "left", margin: 0,
  });
  s.addText("Original website version\n\nUsers experienced the existing design and flow without any modifications. Served as the baseline for comparison.", {
    x: 0.5, y: 1.7, w: 4.1, h: 1.5,
    fontSize: 13, color: "374151", fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addText("n = 200 users", {
    x: 0.5, y: 3.55, w: 4.1, h: 0.3,
    fontSize: 12, bold: true, color: GRAY, fontFace: "Calibri", margin: 0,
  });

  // Treatment box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.15, w: 4.3, h: 2.8,
    fill: { color: ICE }, line: { color: "AABFF0" }, shadow: shadow(),
  });
  s.addText("TREATMENT — Group B", {
    x: 5.4, y: 1.25, w: 4.1, h: 0.4,
    fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri",
    align: "left", margin: 0,
  });
  s.addText("New website version\n\nUsers experienced the updated website design and flow. Changes were intended to improve the core user metric by enhancing the experience.", {
    x: 5.4, y: 1.7, w: 4.1, h: 1.5,
    fontSize: 13, color: "374151", fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addText("n = 200 users", {
    x: 5.4, y: 3.55, w: 4.1, h: 0.3,
    fontSize: 12, bold: true, color: GRAY, fontFace: "Calibri", margin: 0,
  });

  // VS label
  s.addShape(pres.shapes.OVAL, {
    x: 4.6, y: 2.2, w: 0.7, h: 0.7,
    fill: { color: NAVY }, line: { color: NAVY },
  });
  s.addText("VS", {
    x: 4.6, y: 2.2, w: 0.7, h: 0.7,
    fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });

  // Footer
  s.addText("Assignment unit: User  |  Both groups equally sized at 200 users each  |  Two-tailed hypothesis test", {
    x: 0.5, y: 5.2, w: 9, h: 0.28,
    fontSize: 10, color: GRAY, fontFace: "Calibri", align: "center", margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Metric Results (Continuous)
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("Primary Metric: Group A vs Group B", {
    x: 0.5, y: 0.3, w: 9, h: 0.65,
    fontSize: 34, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  // Control block
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.15, w: 3.8, h: 2.6,
    fill: { color: LTGRAY }, line: { color: "D1D5DB" }, shadow: shadow(),
  });
  s.addText("3.004", {
    x: 0.5, y: 1.25, w: 3.8, h: 1.4,
    fontSize: 62, bold: true, color: GRAY, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });
  s.addText("Group A  (Control)", {
    x: 0.5, y: 2.65, w: 3.8, h: 0.35,
    fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri", align: "center", margin: 0,
  });
  s.addText("Mean  ·  std = 0.970  ·  n = 200", {
    x: 0.5, y: 3.0, w: 3.8, h: 0.3,
    fontSize: 11, color: GRAY, fontFace: "Calibri", align: "center", margin: 0,
  });

  // Arrow + lift
  s.addShape(pres.shapes.LINE, {
    x: 4.4, y: 2.45, w: 1.2, h: 0,
    line: { color: NAVY, width: 2.5 },
  });
  s.addText("+1.42\n(+47.4%)", {
    x: 4.3, y: 1.8, w: 1.4, h: 0.9,
    fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri",
    align: "center", margin: 0,
  });

  // Treatment block
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.7, y: 1.15, w: 3.8, h: 2.6,
    fill: { color: "DCFCE7" }, line: { color: "86EFAC" }, shadow: shadow(),
  });
  s.addText("4.428", {
    x: 5.7, y: 1.25, w: 3.8, h: 1.4,
    fontSize: 62, bold: true, color: DKGRN, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });
  s.addText("Group B  (Treatment)", {
    x: 5.7, y: 2.65, w: 3.8, h: 0.35,
    fontSize: 13, bold: true, color: NAVY, fontFace: "Calibri", align: "center", margin: 0,
  });
  s.addText("Mean  ·  std = 0.968  ·  n = 200", {
    x: 5.7, y: 3.0, w: 3.8, h: 0.3,
    fontSize: 11, color: GRAY, fontFace: "Calibri", align: "center", margin: 0,
  });

  // Significance strip
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.0, w: 9, h: 0.65,
    fill: { color: DKGRN }, line: { color: DKGRN },
  });
  s.addText("Statistically Significant  —  Welch t-test: t = −14.69, p < 0.0001  |  Mann-Whitney U: p < 0.0001  |  Cohen's d = 1.47 (Large effect)", {
    x: 0.5, y: 4.0, w: 9, h: 0.65,
    fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });

  // Note
  s.addText("95% Confidence Interval for difference: [+1.23, +1.61]  |  Both groups passed Shapiro-Wilk normality test", {
    x: 0.5, y: 5.2, w: 9, h: 0.28,
    fontSize: 10, color: GRAY, fontFace: "Calibri", align: "center", margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Distribution Chart
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("Metric Distribution Comparison", {
    x: 0.5, y: 0.3, w: 9, h: 0.65,
    fontSize: 34, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  // Bar chart comparing means with error bars represented as a grouped column chart
  const chartData = [
    { name: "Group A (Control)",   labels: ["Mean"], values: [3.004] },
    { name: "Group B (Treatment)", labels: ["Mean"], values: [4.428] },
  ];

  s.addChart(pres.charts.BAR, chartData, {
    x: 0.4, y: 1.05, w: 9.2, h: 3.8,
    barDir: "col",
    barGrouping: "clustered",
    chartColors: [GRAY, DKGRN],
    chartArea: { fill: { color: WHITE }, roundedCorners: false },
    plotArea:  { fill: { color: WHITE } },
    catAxisLabelColor: "374151",
    valAxisLabelColor: "374151",
    valGridLine: { color: "E5E7EB", size: 0.5 },
    catGridLine: { style: "none" },
    showValue: true,
    dataLabelColor: "1E293B",
    dataLabelFontSize: 14,
    showLegend: true,
    legendPos: "b",
    legendFontSize: 12,
    valAxisMinVal: 0,
    valAxisMaxVal: 6,
    title: "Mean Metric Value by Group",
    showTitle: false,
  });

  s.addText("Group B mean is 47.4% higher than Group A — a large, statistically significant difference (p < 0.0001, Cohen's d = 1.47)", {
    x: 0.5, y: 5.0, w: 9, h: 0.5,
    fontSize: 11, color: GRAY, fontFace: "Calibri", align: "center", italic: true, margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — Statistical Design
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("Statistical Design & Robustness", {
    x: 0.5, y: 0.3, w: 9, h: 0.65,
    fontSize: 34, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  // Two-column layout
  // Left — test summary table
  const tableRows = [
    [
      { text: "Parameter", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
      { text: "Value", options:     { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
    ],
    ["Test used",            "Welch two-sample t-test (two-tailed)"],
    ["Sample sizes",         "n = 200 per group (400 total)"],
    ["Significance level α", "0.05"],
    ["t-statistic",          "−14.69"],
    ["p-value",              "< 0.0001"],
    ["95% CI (B − A)",       "[+1.23, +1.61]"],
    ["Cohen's d",            "1.47  (Large effect)"],
    ["Mann-Whitney U p",     "< 0.0001  (Non-parametric confirmation)"],
    ["Normality (Group A)",  "Shapiro-Wilk p = 0.398  ✓ Normal"],
    ["Normality (Group B)",  "Shapiro-Wilk p = 0.497  ✓ Normal"],
  ];

  s.addTable(tableRows, {
    x: 0.4, y: 1.1, w: 5.8, h: 3.9,
    fontSize: 11,
    fontFace: "Calibri",
    color: "374151",
    border: { pt: 0.5, color: "E5E7EB" },
    rowH: 0.33,
    colW: [2.9, 2.9],
    fill: { color: WHITE },
  });

  // Right — interpretation card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.5, y: 1.1, w: 3.1, h: 3.9,
    fill: { color: ICE }, line: { color: "AABFF0" }, shadow: shadow(),
  });

  s.addText("Key Takeaways", {
    x: 6.6, y: 1.2, w: 2.9, h: 0.4,
    fontSize: 14, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  const bullets = [
    "Both groups are normally distributed — parametric t-test is valid",
    "Non-parametric Mann-Whitney U confirms the result independently",
    "Cohen's d = 1.47 is well above the 'large' threshold of 0.8",
    "The entire 95% CI is positive — no scenario where A beats B",
    "Result is robust: p < 0.0001 vs threshold of 0.05",
  ];

  s.addText(
    bullets.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < bullets.length - 1, paraSpaceAfter: 6 } })),
    {
      x: 6.6, y: 1.65, w: 2.9, h: 3.1,
      fontSize: 11, color: "1E3A5F", fontFace: "Calibri", margin: 0,
    }
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Recommendation (dark)
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addText("Recommendation", {
    x: 0.5, y: 0.35, w: 9, h: 0.75,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Calibri", margin: 0,
  });

  // Large verdict pill
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 2.5, y: 1.25, w: 5, h: 1.0,
    fill: { color: GREEN }, line: { color: GREEN }, rectRadius: 0.15,
  });
  s.addText("✓  SHIP IT", {
    x: 2.5, y: 1.25, w: 5, h: 1.0,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0,
  });

  // Rationale bullets
  const rationale = [
    "Primary metric: Group B outperformed Group A by +1.42 (+47.4%) — p < 0.0001, large effect (Cohen's d = 1.47)",
    "Statistical robustness: Both parametric and non-parametric tests agree; 95% CI is entirely positive",
    "Sample adequacy: 200 users per group with both groups normally distributed — analysis is valid",
  ];

  s.addText(
    rationale.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < rationale.length - 1, paraSpaceAfter: 8 } })),
    {
      x: 0.6, y: 2.5, w: 8.8, h: 1.7,
      fontSize: 14, color: WHITE, fontFace: "Calibri", margin: 0,
    }
  );

  // Next steps
  s.addText("Next Steps", {
    x: 0.6, y: 4.25, w: 8.8, h: 0.35,
    fontSize: 14, bold: true, color: ICE, fontFace: "Calibri", margin: 0,
  });

  const steps = [
    "Roll out new website version (Group B) to 100% of users",
    "Monitor primary metric and guardrail KPIs for 30 days post-launch",
    "Document learnings and define hypothesis for the next experiment",
  ];

  s.addText(
    steps.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < steps.length - 1, paraSpaceAfter: 4 } })),
    {
      x: 0.6, y: 4.6, w: 8.8, h: 0.85,
      fontSize: 13, color: ICE, fontFace: "Calibri", margin: 0,
    }
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APPENDIX TITLE SLIDE
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addText("Appendix", {
    x: 0.5, y: 2.0, w: 9, h: 0.9,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Calibri", align: "center", margin: 0,
  });
  s.addText("Methodology & Statistical Detail", {
    x: 0.5, y: 3.0, w: 9, h: 0.5,
    fontSize: 20, color: ICE, fontFace: "Calibri", align: "center", margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// APPENDIX A — Descriptive Statistics
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("Appendix A — Full Descriptive Statistics", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  const rows = [
    [
      { text: "Statistic",     options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
      { text: "Group A (Control)", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
      { text: "Group B (Treatment)", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
      { text: "Difference (B − A)", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
    ],
    ["Sample size (n)", "200", "200", "—"],
    ["Mean",            "3.004", "4.428", "+1.424  (+47.4%)"],
    ["Std deviation",   "0.970", "0.968", "−0.002"],
    ["Median",          "2.955", "4.422", "+1.467"],
    ["Min",             "0.792", "1.123", "—"],
    ["Max",             "6.189", "7.270", "—"],
    ["Shapiro-Wilk p",  "0.398  ✓ Normal", "0.497  ✓ Normal", "—"],
  ];

  s.addTable(rows, {
    x: 0.4, y: 1.05, w: 9.2, h: 3.5,
    fontSize: 12,
    fontFace: "Calibri",
    color: "374151",
    border: { pt: 0.5, color: "E5E7EB" },
    rowH: 0.38,
    colW: [2.3, 2.3, 2.3, 2.3],
    fill: { color: WHITE },
  });

  s.addText("* Min/Max are approximate values from the raw data files.", {
    x: 0.5, y: 5.1, w: 9, h: 0.3,
    fontSize: 10, color: GRAY, fontFace: "Calibri", italic: true, margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// APPENDIX B — Hypothesis & Design
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: WHITE };

  s.addText("Appendix B — Hypothesis & Statistical Design", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: NAVY, fontFace: "Calibri", margin: 0,
  });

  // Hypothesis block
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.05, w: 9.2, h: 1.0,
    fill: { color: ICE }, line: { color: "AABFF0" },
  });
  s.addText(
    '"By deploying the new website version (Group B), we expect the primary user metric to increase significantly compared to the existing version (Group A)."',
    {
      x: 0.55, y: 1.1, w: 8.9, h: 0.9,
      fontSize: 13, italic: true, color: NAVY, fontFace: "Calibri",
      valign: "middle", margin: 0,
    }
  );

  // Design table
  const rows = [
    [
      { text: "Parameter",  options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
      { text: "Value",      options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 12 } },
    ],
    ["Significance level (α)", "0.05 (5% false positive rate)"],
    ["Statistical power (1−β)", "0.80 (80% — standard for A/B tests)"],
    ["Test type", "Welch two-sample t-test (two-tailed) + Mann-Whitney U backup"],
    ["Assignment unit", "User (individual-level randomisation)"],
    ["Sample size per variant", "200 users"],
    ["Observed effect size", "Cohen's d = 1.47 (Large — threshold is 0.8)"],
    ["Minimum runtime", "Data collected from both groups simultaneously"],
  ];

  s.addTable(rows, {
    x: 0.4, y: 2.2, w: 9.2, h: 2.9,
    fontSize: 11,
    fontFace: "Calibri",
    color: "374151",
    border: { pt: 0.5, color: "E5E7EB" },
    rowH: 0.35,
    colW: [3.0, 6.2],
    fill: { color: WHITE },
  });
}

// ── Write file ────────────────────────────────────────────────────────────────
const outPath = "D:\\shawn\\Desktop\\imp\\learning\\AI projects\\automated-AB-test\\website-pilot-results-2026-06-07.pptx";
pres.writeFile({ fileName: outPath })
  .then(() => console.log("✓ Saved:", outPath))
  .catch(e => { console.error(e); process.exit(1); });
