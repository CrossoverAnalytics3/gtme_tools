# GTM Toolkit

10 interactive tools for product marketing managers (PMMs) and go-to-market engineers (GTMEs), built from the executive brief *Modern Product Marketing, Go-To-Market Strategy, and Organizational Architecture*.

The brief ends with a metrics table: 10 results like "+31% engagement", "10 SDRs down to 1 SDR + agent" and "NRR from 107% to 120%". A table of results is nice to read, but you can't run it. So each row became a tool that runs the method behind the number on your own data.

| # | Metric / objective | Outcome in the brief | Source context | Tool |
| --- | --- | --- | --- | --- |
| 1 | Sales Engagement Growth | +31% engagement, +21% feature usage | Whoop Dynamic Island launch | [Launch Lift Planner](tools/launch-lift.html) |
| 2 | Merchant Coupon Adoption | +16% adoption, +$12K GMS | Etsy seller lifecycle campaign | [Adoption Campaign Builder](tools/adoption-campaign.html) |
| 3 | Wholesale Category Expansion | +50% category sales | Reebok graphic tee positioning test | [Positioning Test Lab](tools/positioning-lab.html) |
| 4 | Inbound Sales Automation | 10 SDRs → 1 SDR + agent | Vercel GTME inbound agent | [Inbound Qualification Agent](tools/inbound-agent.html) |
| 5 | Inbound Agent Operating Cost | ~$1,000/year compute | Vercel AI Cloud | [Agent Economics Model](tools/agent-roi.html) |
| 6 | Competitive Win Rate | 75% head-to-head | Atlin AI-assisted narrative | [Competitive Win Room](tools/win-room.html) |
| 7 | Net Revenue Retention | 107% → 120% in < 2 years | Asana narrative products | [Narrative Product Library](tools/narrative-library.html) |
| 8 | Product Launch Segment Growth | > $1B ARR | Adobe Express young creators | [Segment Opportunity Sizer](tools/segment-sizer.html) |
| 9 | Buying Motivation Ratio | 80% risk avoidance vs. 20% upside | Enterprise buyer psychology | [Risk-First Messaging Studio](tools/risk-messaging.html) |
| 10 | Customer Interview Certainty | 97% certainty from 5 interviews | Fast Five research framework | [Fast Five Research Kit](tools/fast-five.html) |

Every tool opens on its case from the brief (and has a **Load example** button to get back to it), so you see a filled-in version before you touch your own data. The tests check that each example reproduces the brief's number (the Whoop example really computes +31%, the VR sizing really lands on 24M, and so on).

## Use it now: hosted versions

Every tool is also published as its own page on claude.ai, so you can work in it without cloning anything:

| Page | Link | Signal color |
| --- | --- | --- |
| Home (all tools) | https://claude.ai/artifact/B489vXxRZku7dJ5LxcAU9K | |
| 1. Launch Lift Planner | https://claude.ai/artifact/CfwsciC7jrQ954NH7L5GyF | Lift blue |
| 2. Adoption Campaign Builder | https://claude.ai/artifact/Qqc7oVr8LqDFhdNEHNvsKN | Adoption green |
| 3. Positioning Test Lab | https://claude.ai/artifact/Jc57Tdw35gPkBUnfx8Kw42 | Variant magenta |
| 4. Inbound Qualification Agent | https://claude.ai/artifact/8rWU4q5fWq9gTA1AXCWxtG | Agent teal |
| 5. Agent Economics Model | https://claude.ai/artifact/CXNnXwupNZmkTBzXhkY2xv | Ledger amber |
| 6. Competitive Win Room | https://claude.ai/artifact/HCs5wUWns5PoZC87VcU9ko | Bake-off orange |
| 7. Narrative Product Library | https://claude.ai/artifact/GXWJGXKpXUzkYtXXGvkJ8b | Narrative violet |
| 8. Segment Opportunity Sizer | https://claude.ai/artifact/WJsch48xXbJzeTFwvn4dvC | Cohort olive |
| 9. Risk-First Messaging Studio | https://claude.ai/artifact/SscnETXTUfqPmDUppuveJG | Risk red |
| 10. Fast Five Research Kit | https://claude.ai/artifact/GbvrTDRpR7poSvHmn3dtbP | Interview cyan |
| Design system | https://claude.ai/artifact/S4Bu3km2eoTYLCwWF7rsSu | |

On the hosted pages:

- Each tool opens on the brief's example, with a banner saying so. Edit it or hit **Start blank**.
- Your work saves to a private space on your claude.ai account as you type (the `db` capability, under `data/users/<you>/<tool>`), so it follows you across devices. Nobody else can see it, including the page owner. The browser keeps a local copy too.
- **Save .md**, **Export JSON** and CSV downloads go through claude.ai's download prompt. **Copy** buttons work everywhere.
- These pages are private until you share them from each page's **Share** menu. People you share with as Viewers can use the tools, but their work saves only in their own browser; give them Contributor access if their work should save to their account.

## Quick start

You need Node 18 or newer. There are no dependencies to install.

```bash
git clone https://github.com/CrossoverAnalytics3/gtme_tools.git
cd gtme_tools
npm start          # http://localhost:4173
npm test           # 41 tests, node's built-in runner
```

Opening `index.html` straight from disk won't work: browsers block JavaScript modules on `file://` URLs (the page tells you this if you try). Use `npm start` or the hosted version.

### Host it for your team

The repo ships with a GitHub Pages workflow (`.github/workflows/pages.yml`). Turn it on once under **Settings → Pages → Source: GitHub Actions**, push to `main`, and everyone gets a link. There's no backend, so anything that serves static files works too (Netlify, Vercel, S3, an internal web server).

## How the data works

- Everything saves as you type: to the browser's localStorage when you run the repo, and to your claude.ai account on the hosted pages. The repo version sends nothing anywhere.
- **Export JSON / Import JSON** moves a tool's state between people or machines. This is how you share a filled-in battlecard or a narrative library with a teammate.
- **Copy as Markdown / Download .md** turns the tool's current state into a document (launch brief, business case, readout) you can paste into Notion, Google Docs or Slack.
- CSV import/export where it matters: inbound leads, routed leads, the deal log, lifecycle sequences for your ESP.
- Example data reconstructs the brief's cases for illustration. It isn't real company data.

## The tools

### 1. Launch Lift Planner

**Brief outcome:** +31% engagement, +21% feature usage (Whoop Dynamic Island heart rate zones launch)  
**Framework:** Know the User, Know the Magic, Connect the Two + the 6-phase GTM framework  
**For:** Product marketing · [Open the tool](tools/launch-lift.html)

Plan a feature launch end to end, set engagement and usage targets before you ship, then prove the lift against a holdout.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Know User / Magic / Connect brief builder | Forces the ICP, the value prop and the channel choice onto one page before anyone writes copy. | Kickoff for a new feature launch so product, sales, marketing and CS agree on who it is for. |
| 6-phase readiness score | Shows exactly which phase (goal, intel, messaging, channels, assets, execution) is still empty. | Go/no-go review 1 week before launch. |
| Target setter + sample size check | Turns "drive engagement" into a number, and tells you if your audience is big enough to detect it. | Writing the success criteria section of a launch plan. |
| Holdout lift calculator (2 metrics) | Reports relative lift, confidence interval and p-value for engagement and feature usage side by side. | Post-launch readout: "did the launch cause the +31%, or was it noise?" |

### 2. Adoption Campaign Builder

**Brief outcome:** +16% adoption, +$12K GMS impact (Etsy seller educational lifecycle campaign)  
**Framework:** Educational lifecycle sequence by adoption segment  
**For:** Product marketing · [Open the tool](tools/adoption-campaign.html)

Build an educational lifecycle sequence that moves existing users onto a feature, then size the revenue it adds.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Segment-aware sequence generator | Writes different steps for people who never tried the feature vs. people who tried and lapsed. | Drafting a 5-touch email + in-product campaign for an underused feature. |
| Educate, Show, Prove, Nudge, Reinforce stages | Each touch has one job, one CTA and one metric, so you can see which step leaks. | Handing a lifecycle brief to the CRM/ESP team. |
| Adoption impact model | Converts an adoption lift into new adopters and dollars (GMS, revenue or ARR). | Getting budget or lifecycle send slots approved. |
| Holdout readout | Proves the campaign caused the adoption change instead of seasonality. | Reporting the result back to leadership with confidence. |

### 3. Positioning Test Lab

**Brief outcome:** +50% category sales growth (Reebok feminine graphic tee positioning test)  
**Framework:** Hypothesis-driven positioning variants + controlled test  
**For:** Product marketing · [Open the tool](tools/positioning-lab.html)

Write competing positioning variants, size the test properly, then pick the winner with real statistics.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Positioning variant builder | Each variant states audience, emotional angle, headline and proof, so variants differ on purpose. | Testing a new audience angle for an existing product line. |
| Positioning statement generator | Produces a clean "For / who / is the / that / unlike" statement per variant. | Aligning merchandising, sales and creative on one sentence per variant. |
| Sample size + duration planner | Tells you how many visitors and days you need before results mean anything (with multi-variant correction). | Deciding if a test is worth running on current traffic. |
| Results analyzer + category impact | Calls a winner with p-values and translates the lift into category revenue. | Making the wholesale sell-in case to a buyer with numbers. |

### 4. Inbound Qualification Agent

**Brief outcome:** Reduced from 10 SDRs to 1 SDR + agent (Vercel GTME inbound agent deployment)  
**Framework:** Legible, deterministic GTM workflow encoded as an agent with human QA  
**For:** GTM engineering · [Open the tool](tools/inbound-agent.html)

Encode your inbound qualification rules once, route every lead with reasons, and send only the gray zone to a human.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Configurable fit + intent scoring rules | Your ICP and buying signals live in one editable config instead of 10 SDRs' heads. | Replacing manual inbound triage with a consistent, auditable rule set. |
| Batch router with reasons and confidence | Every lead gets a route (AE, QA, nurture, disqualify) plus the exact reasons why. | Running last month's inbound CSV to see how the agent would have routed it. |
| LLM agent prompt + JSON schema export | Generates the system prompt for an LLM qualifier that follows the same rules. | A GTME wiring the agent into a form webhook, CRM or Slack. |
| SDR capacity calculator + CLI | Shows how many SDRs are still needed for QA, and runs the same logic from the command line. | Planning the redeployment of SDRs to outbound. |

### 5. Agent Economics Model

**Brief outcome:** ~$1,000 per year in compute cost (Vercel AI Cloud infrastructure)  
**Framework:** Unit economics of an AI agent vs. headcount, plus redeployment upside  
**For:** GTM engineering · [Open the tool](tools/agent-roi.html)

Model what an agent really costs to run per lead and per year, what it saves, and what the freed-up SDRs can produce.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Per-lead token cost model | Builds the compute bill bottom-up from calls, tokens and your provider's rates. | Answering finance's "what does this agent cost us?" with a defensible number. |
| Before vs. after team cost | Compares SDR payroll to agent + QA + GTME build and maintenance. | Business case for funding a GTME role. |
| Redeployment pipeline model | Shows the outbound pipeline and bookings the freed SDRs can generate. | Pitching the change as growth, so it isn't read as a headcount cut. |
| Token sensitivity table | Stress-tests the cost at 2x, 5x and 10x token usage. | Checking the case still holds if prompts get longer or you add tools. |

### 6. Competitive Win Room

**Brief outcome:** 75% in head-to-head evaluations (Atlin AI-assisted narrative positioning)  
**Framework:** Battlecards + win/loss + Lostbot and Dealbot agents  
**For:** PMM + GTME · [Open the tool](tools/win-room.html)

Track head-to-head win rate by competitor, audit why deals really died, flag open deals at risk, and keep battlecards current.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Head-to-head win rate tracker | Win rate by competitor and by whether the new narrative was used, measured against your target. | Proving a new positioning narrative moves win rate. |
| Lostbot audit | Compares the seller's logged loss reason to deal evidence and names the real driver. | Quarterly win/loss review where every loss says "price". |
| Dealbot risk alerts | Flags open deals missing an economic buyer, champion, ROI or plan past your day limits, as copy-ready Slack alerts. | Weekly pipeline review or a deal-channel bot. |
| Battlecard builder + buyer simulation prompt | Exports a clean battlecard and a prompt to pressure-test it against a simulated buyer. | Enabling reps before a bake-off against a named competitor. |

### 7. Narrative Product Library

**Brief outcome:** Scaled from 107% to 120% in < 2 years (Asana composable narrative products)  
**Framework:** Composable, pre-approved messaging blocks mapped to moments of truth  
**For:** Product marketing · [Open the tool](tools/narrative-library.html)

Store messaging as approved, versioned blocks, compose them by persona and moment of truth, and model their effect on NRR.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Versioned block library with approval + staleness | Everyone pulls from approved, dated messaging; stale blocks get flagged. | Ending the "which deck is current?" Slack thread. |
| Persona x moment composer | Assembles a message for a persona at onboarding, expansion, renewal or at-risk from approved blocks. | A CSM preparing a renewal or expansion conversation in 2 minutes. |
| Coverage matrix | Shows which persona and moment combinations have no approved message. | Planning next quarter's PMM content backlog. |
| NRR lever model + target solver | Breaks NRR into expansion, contraction and churn, and solves for what it takes to hit a target. | Setting the expansion and churn goals the narrative program owns. |

### 8. Segment Opportunity Sizer

**Brief outcome:** Scaled to > $1 Billion ARR (Adobe Express young creator segment strategy)  
**Framework:** Cohort-based market sizing + 3-axis segmentation (size, growth, attributes)  
**For:** Product marketing · [Open the tool](tools/segment-sizer.html)

Size a segment bottom-up by cohort instead of a flat percentage, project ARR, and rank segments on size, growth and fit.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Cohort-based sizing | Replaces "2.5% of everyone" with cohort sizes and adoption rates you can defend. | Sizing a new audience segment for a launch or a case interview. |
| ARR funnel projection | Walks from addressable users to reachable, paying and ARR, with every assumption visible. | Deciding if a segment can plausibly become a $1B line. |
| 3-axis segment scoring | Ranks segments on size, growth and workload/model fit with weights you control. | Prioritizing a 50-person startup growing 200% over a flat 500-person firm. |
| Quadrant labels | Tags each segment as land now, bet on growth, nurture or deprioritize. | Territory and campaign planning with sales leadership. |

### 9. Risk-First Messaging Studio

**Brief outcome:** 80% risk avoidance vs. 20% upside (Enterprise sales decision-making psychology)  
**Framework:** Risk-reduction psychology + feature-to-benefit translation + value-add discovery  
**For:** PMM + GTME · [Open the tool](tools/risk-messaging.html)

Check if your copy speaks to the risk buyers are trying to avoid, translate features into benefits and risks removed, and plan discovery that gives value first.

| Feature | Benefit | Use case |
| --- | --- | --- |
| Copy risk/upside analyzer | Highlights risk-avoidance vs. upside language and scores the mix against 80/20. | Reviewing an enterprise email, landing page or deck before it ships. |
| Feature -> benefit -> risk removed ladder | Turns each raw feature into an emotional benefit and the specific pain it prevents. | Writing launch messaging or a sales one-pager. |
| Role-based discovery planner | Builds an 80/20 question plan per buyer role, plus a value-add asset to bring. | Prepping a first call with an economic buyer or security reviewer. |

### 10. Fast Five Research Kit

**Brief outcome:** 97% certainty from 5 interviews (Fast Five qualitative research framework)  
**Framework:** 5 unscripted 50-minute interviews triggered by a quantitative signal  
**For:** Product marketing · [Open the tool](tools/fast-five.html)

Run 5 focused customer interviews off a data signal, capture notes, and synthesize patterns with the math behind "97%".

| Feature | Benefit | Use case |
| --- | --- | --- |
| Signal + hypothesis setup with interview guide | Generates a 50-minute unscripted guide built around your hypothesis. | A metric dropped and you need to know why by Friday. |
| 5-slot interview notebook | One place for notes, quotes, tags and a "did the hypothesis hold?" call per interview. | Running interviews with a PM or designer taking notes. |
| Pattern synthesis | Counts tags across interviews and labels them pattern (3+), signal (2) or anecdote (1). | Writing the readout and deciding what to change. |
| Detection probability calculator | Shows what "97%" actually means and how many interviews you need for rarer problems. | Defending a 5-interview study to a skeptical exec. |

## Plays: running the tools in sequence

Each tool works alone, but the outcomes in the brief came from methods stacked together. These are the orders I'd use (also on the home page):

1. **Launch a feature that moves a number.** Fast Five (learn why users care) → Segment Sizer (pick and size the segment) → Risk-First Messaging (write the message) → Launch Lift (plan, set targets, measure) → Adoption Campaign (move existing users onto it).
2. **Fix a slipping win rate.** Win Room Lostbot audit → Fast Five with 5 lost buyers → Narrative Library (publish the approved counter-narrative) → Positioning Lab (test the angle before rollout).
3. **Stand up a GTM engineering function.** Inbound Agent (encode the rules, QA the gray zone) → Agent Economics (price it, model the redeployed SDRs) → Win Room Dealbot (alerts in deal channels).
4. **Grow NRR.** Narrative Library (model the levers, fill coverage gaps) → Adoption Campaign (sticky features) → Risk-First Messaging (renewal talk tracks for CS).

See [docs/brief-to-tools.md](docs/brief-to-tools.md) for why each tool is shaped the way it is, traced back to the brief.

## Design system

The toolkit has its own design system: an instrument panel for revenue teams. Cool slate neutrals, mono numerals for readouts, hairlines instead of shadows, and **one signal color per tool** chosen for what the tool does (Risk red for the risk messaging studio, Ledger amber for the agent business case, Adoption green for the lifecycle campaign...). All ten signals sit at one OKLCH lightness, spaced around the hue wheel, and clear 5:1 contrast as text in light and dark.

- Hosted, browsable version with live component previews: see the table above.
- Source in this repo: [`design-system/project/`](design-system/project/): `README.md` (the brand book: voice, color, type, spacing, iconography), `signals.md` (each tool's color and why), `tokens.json` (every token with light and dark values and a usage note), and `components/` (15 components with guidelines, live previews, a `GTMKit` bundle and types).
- `assets/css/app.css` is the source of truth. The design system's `bundle.css` is a copy of it, and the tests fail if a token in `tokens.json` drifts from the stylesheet.
- Regenerate the component pages with `python3 design-system/build_components.py`.

## Publishing the hosted versions

`npm run build:hosted` writes one folder per page to `dist/hosted/<page>/`: a content-only `index.html` plus exactly the scripts and styles that page loads, with the claude.ai URLs from [`hosted/links.json`](hosted/links.json) baked into `assets/js/core/links.js` so the tool menu and hub link between hosted pages. Each folder publishes as one artifact; tool pages declare the `db`, `user` and `downloads` capabilities.

The code handles the claude.ai viewer's limits: no `confirm()` (an in-page dialog instead), no plain download links (the `downloads` capability instead), no print button, and the account-backed store in `assets/js/core/store.js`. Outside the viewer, the same code falls back to normal browser behavior.

## For GTM engineers: the lead agent CLI

The inbound qualification logic runs outside the browser with the same rules, so you can drop it into a webhook handler, a cron job or CI.

```bash
# Route a CSV of leads (stdout is CSV, summary goes to stderr)
npm run qualify -- examples/leads.csv
node bin/qualify-leads.js leads.csv --config my-rules.json --out routed.csv
node bin/qualify-leads.js leads.csv --json

# Print the LLM system prompt generated from your rules
node bin/qualify-leads.js --prompt --config my-rules.json --company "Acme" --product "a deploy platform"
```

Start from [`examples/lead-agent.config.json`](examples/lead-agent.config.json) (it matches the defaults; a test keeps them in sync) or export your edited rules from the tool's **Rules** tab. Partial configs work: anything you leave out falls back to the defaults.

```js
import { scoreLead } from './assets/js/lib/leadAgent.js';

const r = scoreLead({ email: 'cto@bigco.com', title: 'CTO', employees: 900, industry: 'Fintech', country: 'US', demo_requested: 'yes', message: 'Need SSO and an SLA' });
// r.route: 'ae_fast_track' | 'sdr_qa' | 'nurture' | 'disqualify'
// r.reasons: ['900 employees is inside the ICP range', 'Target industry (Fintech)', ...]
```

The design follows the brief's description of the GTME role: automate the *legible, deterministic* part of the workflow, keep a human on the gray zone. The agent sends a lead to SDR QA when it's within a few points of a threshold, when intent is high but fit is weak, or when key data is missing. It never guesses.

## Project layout

```
index.html                 Home: metrics table → tools, plays
tools/*.html               One page per tool
assets/css/app.css         Styles and design tokens (light + dark, per-tool signals)
assets/js/core/            Registry, page shell, DOM helpers, stats, CSV, formatting,
                           storage (browser + claude.ai account), links, runtime detection
assets/js/lib/             Pure logic per tool (no DOM, tested in node)
assets/js/tools/           UI controller per tool
assets/js/hub.js           Home page
bin/qualify-leads.js       Lead agent CLI
examples/                  Sample leads CSV + default agent config
docs/brief-to-tools.md     How each tool traces back to the brief
test/                      node --test suites
serve.js                   Zero-dependency static server for npm start
design-system/project/     The design system (brand book, tokens, components)
scripts/build-hosted.js    Builds the claude.ai hosted pages
hosted/links.json          Published URL for each hosted page
```

`assets/js/core/registry.js` is the single source of truth for tool names, outcomes and the feature → benefit → use case rows. The home page, every tool header and the README tables come from it.

### Adding or changing a tool

1. Put the math in `assets/js/lib/<tool>.js` with no DOM access, and add tests.
2. Build the UI in `assets/js/tools/<tool>.js` with `mountTool()` from `core/shell.js`. It gives you persistence, example loading, JSON import/export and Markdown export for free.
3. Add a `tools/<tool>.html` page (copy an existing one) and a registry entry.
4. `npm test` checks the page, controller, registry entry and README section all exist.

## A note on the stats

- Lift readouts use a two-proportion z-test with a 95% confidence interval. The Positioning Lab splits significance across variants (Bonferroni) so 3 variants don't give you 2 free shots at a false winner.
- Sample sizes assume 95% confidence and 80% power.
- "97% from 5 interviews" is the chance that a problem shared by half your users shows up at least once in 5 random interviews (1 − 0.5⁵ = 96.9%). The Fast Five tool shows the math and how many interviews rarer problems need. It's about finding common problems, not measuring how common they are.
- The risk/upside copy analyzer is a keyword heuristic. Treat it as a mirror for your draft, not a grade.
