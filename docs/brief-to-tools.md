# From the brief to the tools

The brief's "Key Synthesis Metrics Reference" table lists results. A result alone doesn't tell you what to do on Monday, so for each row I asked 3 questions:

1. What did the team actually *do* to get this number? (the mechanism, from the brief's own frameworks)
2. What inputs would a PMM or GTME need to do it again?
3. How would they know it worked?

The tool is the answer to all 3. Below is the reasoning per row.

---

## 1. Sales Engagement Growth → Launch Lift Planner

**The brief:** +31% engagement, +21% feature usage from Whoop's Dynamic Island heart rate zones launch.

**Mechanism:** The brief's "Know the User, Know the Magic, Connect the Two" framework plus the 6-phase GTM framework (goal, competitive intel, messaging, channels, assets, execution). Whoop put the value (your zone, at a glance) on the surface where the user already looks mid-workout. That's "connect the two" done well: the channel *is* the moment of use.

**What the tool does:**
- A brief builder that won't let you skip the ICP, the value prop or the channel choice, with a readiness score across all 6 phases.
- A target setter that turns "drive engagement" into baseline → target, and checks whether your holdout is big enough to detect it. Most launches skip this and can't prove anything afterward.
- A lift calculator for 2 metrics at once (engagement and feature usage, like the brief reports) with confidence intervals.

**How you know it worked:** the Measure tab says "Significant lift" against the holdout, and the number clears the target you set before launch.

## 2. Merchant Coupon Adoption → Adoption Campaign Builder

**The brief:** +16% coupon adoption and +$12K GMS from Etsy's seller educational lifecycle campaign.

**Mechanism:** Education, not promotion. Sellers didn't use coupons because they didn't see the job coupons do or how to set one up. A lifecycle sequence that teaches, shows, proves with a peer, then nudges at the moment of need moves the "never tried" group. A different angle wins back the "tried and stopped" group.

**What the tool does:**
- Generates a segment-aware sequence (never tried / lapsed / active) where every touch has one job, one CTA and one metric. Exports CSV for your ESP.
- A bottom-up impact model: segment size × expected conversion → new adopters → dollars. It reports the implied relative lift, which is how the brief states the result.
- A holdout readout so seasonality doesn't get the credit.

## 3. Wholesale Category Expansion → Positioning Test Lab

**The brief:** +50% category sales growth from Reebok's feminine graphic tee positioning test.

**Mechanism:** Positioning treated as a hypothesis. Reebok tested a different audience and emotional angle against the current one and scaled the winner. The brief's interview section makes the same point: lead with educated guesses ("the What"), then test.

**What the tool does:**
- A variant builder where each variant states audience, need, emotional angle, differentiator, headline and proof, plus a generated positioning statement per variant.
- Test planning with sample size and duration, corrected for multiple variants.
- A results analyzer that names a winner only when the stats support it, and translates the lift into category revenue for the wholesale sell-in conversation.

## 4. Inbound Sales Automation → Inbound Qualification Agent

**The brief:** Vercel went from 10 SDRs on inbound to 1 SDR doing QA on an agent. 9 SDRs moved to outbound. Lead-to-opportunity conversion stayed flat and response time improved. One GTME built it in 6 weeks.

**Mechanism:** The brief describes the GTME as someone who automates *legible, deterministic* GTM workflows. Inbound qualification is mostly rules (ICP fit + buying intent) plus a gray zone that needs judgment. The 1 remaining SDR handles the gray zone.

**What the tool does:**
- An editable rule set (ICP ranges, industries, countries, title seniority, disqualifiers, enterprise intent keywords, weights, thresholds).
- A batch router: paste last month's leads, see how every lead would route and why. The "Why" column is the audit trail an SDR manager will ask for.
- Guardrails that route to a human instead of guessing: near-threshold scores, high intent with weak fit, missing data.
- An LLM system prompt + JSON schema generated from the same rules, so a model-based agent and the deterministic code agree.
- A CLI (`bin/qualify-leads.js`) running the same logic for webhooks and batch jobs.
- An SDR capacity calculator: with the brief's volume assumptions it reproduces 10 → 1.

## 5. Inbound Agent Operating Cost → Agent Economics Model

**The brief:** ~$1,000 a year in compute for the inbound agent.

**Mechanism:** Model costs are small next to headcount. The business case is really about what the freed SDRs do next.

**What the tool does:**
- Bottom-up compute cost: leads × calls × tokens × your provider's prices. At 3,000 leads a month, 2 calls per lead, ~3,000 input and ~400 output tokens per call, it lands at ~$1,080 a year. Plug in your own rates.
- Before vs. after cost of inbound qualification, including the people who keep the agent running (QA SDR, GTME upkeep), plus build cost and payback.
- The redeployment model: meetings, opportunities, pipeline and bookings from SDRs moved to outbound. This is the slide that gets the project funded, and it frames the change as growth.
- Token sensitivity at 2x, 5x and 10x.

## 6. Competitive Win Rate → Competitive Win Room

**The brief:** 75% head-to-head win rate with AI-assisted narrative positioning (Atlin). The brief also describes Lostbots (an agent found a "lost on price" deal really died from no economic buyer and a weak ROI case) and Dealbots ("You are 30 days into this cycle and have not engaged an economic buyer").

**Mechanism:** Win rate moves when the narrative is sharp *and* deals are run well. You need to see both.

**What the tool does:**
- A deal log with head-to-head win rate by competitor and split by whether the new narrative was used. That split is how you prove a narrative moved the number.
- A Lostbot audit comparing each logged loss reason to 5 evidence fields (economic buyer, buyer-validated ROI, champion, technical win, mutual plan). Mismatches get flagged with the likely real driver.
- Dealbot alerts with day limits per step, formatted as Slack messages with a next step.
- Battlecards (their pitch, where each side wins, landmine questions, objection → response, proof) plus a prompt that pressure-tests the card against a simulated skeptical buyer. That's the "simulated persona feedback" pillar from the brief's AI-native PMM section.

## 7. Net Revenue Retention → Narrative Product Library

**The brief:** Asana scaled NRR from 107% to 120% in under 2 years with composable narrative products: discoverable, current, pre-approved messaging mapped to moments of truth.

**Mechanism:** Treat messaging like a data product. Approved blocks with owners, versions and review dates. CS and sales compose from them at the moments that move NRR (onboarding, first value, expansion, renewal, at-risk).

**What the tool does:**
- A block library with type, persona and moment tags, approval status, owner, version and a staleness flag.
- A composer that assembles a message for a persona at a moment from approved blocks only, and names the gaps.
- A persona × moment coverage matrix (your PMM backlog).
- An NRR model (1 + expansion − contraction − churn) with today vs. program and a solver for the expansion needed to hit a target. The example reproduces 107% → 120%.

## 8. Product Launch Segment Growth → Segment Opportunity Sizer

**The brief:** Adobe Express grew a young-creator segment past $1B ARR. The brief also gives the method: size markets by cohort (its US VR example: 320M people / 80 years = 4M per age cohort; Gen Z 32M × 50% + Millennials 32M × 25% = 24M) instead of a flat percentage, and segment on 3 axes (size, growth potential, workload/behavior attributes).

**What the tool does:**
- Cohort sizing that reproduces the brief's 24M example exactly, side by side with the flat-% estimate it replaces.
- An ARR funnel (addressable → reachable → paying → ARR) and the conversion an ARR goal requires.
- 3-axis segment scoring with weights and quadrant labels, so a 50-person startup growing 200% can outrank a flat 500-person firm, like the brief argues.

## 9. Buying Motivation Ratio → Risk-First Messaging Studio

**The brief:** ~80% of enterprise purchases are about avoiding pain and career risk, ~20% about upside. Sell de-risked implementation, protection from downtime-driven misses and protection from competitive displacement. Make discovery give value first (Stripe's whiteboarding, performance benchmarks, AEO insights).

**What the tool does:**
- A copy analyzer that highlights risk-avoidance vs. upside language, scores the mix against 80/20, and lists the risk angles you haven't used with how to add them.
- A feature → benefit → pain-avoided ladder (the brief's feature-to-benefit translation, including the "Alfred, the personal butler" naming move) that writes risk-first and upside lines and an 80/20 talk track.
- A discovery planner per buyer role with an 80/20 question split and the value-add asset to bring.

## 10. Customer Interview Certainty → Fast Five Research Kit

**The brief:** When quantitative data shows a problem, run 5 targeted, 50-minute unscripted interviews. 5 conversations surface population patterns with 97% certainty.

**Where 97% comes from:** if half your users share a problem, the chance at least one of 5 random interviews surfaces it is 1 − 0.5⁵ = 96.9%. The tool shows this so nobody oversells it. 5 interviews reliably *find* the common problems. They don't measure prevalence, and rarer problems need more conversations (29 for a 10% problem at 95% confidence).

**What the tool does:**
- Setup from a data signal and a falsifiable hypothesis, with a 50-minute unscripted guide built around it.
- A 5-slot interview notebook with tags, quotes and a "did the hypothesis hold?" call.
- Synthesis that counts tags across interviews (3+ = pattern, 2 = signal, 1 = anecdote) and calls the hypothesis supported, mixed or not supported.
- A detection calculator and table.
