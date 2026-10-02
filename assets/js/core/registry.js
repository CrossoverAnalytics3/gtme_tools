// Single source of truth for the toolkit. The hub page, every tool header,
// the README check and the tests all read from this list.
//
// Each tool maps to one row of the brief's "Key Synthesis Metrics Reference"
// table and lists its features as feature -> benefit -> use case.

export const ROLES = {
  pmm: 'Product marketing',
  gtme: 'GTM engineering',
  both: 'PMM + GTME',
};

export const TOOLS = [
  {
    id: 'launch-lift',
    n: 1,
    title: 'Launch Lift Planner',
    role: 'pmm',
    metric: 'Sales Engagement Growth',
    outcome: '+31% engagement, +21% feature usage',
    source: 'Whoop Dynamic Island heart rate zones launch',
    framework: 'Know the User, Know the Magic, Connect the Two + the 6-phase GTM framework',
    summary: 'Plan a feature launch end to end, set engagement and usage targets before you ship, then prove the lift against a holdout.',
    features: [
      {
        feature: 'Know User / Magic / Connect brief builder',
        benefit: 'Forces the ICP, the value prop and the channel choice onto one page before anyone writes copy.',
        useCase: 'Kickoff for a new feature launch so product, sales, marketing and CS agree on who it is for.',
      },
      {
        feature: '6-phase readiness score',
        benefit: 'Shows exactly which phase (goal, intel, messaging, channels, assets, execution) is still empty.',
        useCase: 'Go/no-go review 1 week before launch.',
      },
      {
        feature: 'Target setter + sample size check',
        benefit: 'Turns "drive engagement" into a number, and tells you if your audience is big enough to detect it.',
        useCase: 'Writing the success criteria section of a launch plan.',
      },
      {
        feature: 'Holdout lift calculator (2 metrics)',
        benefit: 'Reports relative lift, confidence interval and p-value for engagement and feature usage side by side.',
        useCase: 'Post-launch readout: "did the launch cause the +31%, or was it noise?"',
      },
    ],
  },
  {
    id: 'adoption-campaign',
    n: 2,
    title: 'Adoption Campaign Builder',
    role: 'pmm',
    metric: 'Merchant Coupon Adoption',
    outcome: '+16% adoption, +$12K GMS impact',
    source: 'Etsy seller educational lifecycle campaign',
    framework: 'Educational lifecycle sequence by adoption segment',
    summary: 'Build an educational lifecycle sequence that moves existing users onto a feature, then size the revenue it adds.',
    features: [
      {
        feature: 'Segment-aware sequence generator',
        benefit: 'Writes different steps for people who never tried the feature vs. people who tried and lapsed.',
        useCase: 'Drafting a 5-touch email + in-product campaign for an underused feature.',
      },
      {
        feature: 'Educate, Show, Prove, Nudge, Reinforce stages',
        benefit: 'Each touch has one job, one CTA and one metric, so you can see which step leaks.',
        useCase: 'Handing a lifecycle brief to the CRM/ESP team.',
      },
      {
        feature: 'Adoption impact model',
        benefit: 'Converts an adoption lift into new adopters and dollars (GMS, revenue or ARR).',
        useCase: 'Getting budget or lifecycle send slots approved.',
      },
      {
        feature: 'Holdout readout',
        benefit: 'Proves the campaign caused the adoption change instead of seasonality.',
        useCase: 'Reporting the result back to leadership with confidence.',
      },
    ],
  },
  {
    id: 'positioning-lab',
    n: 3,
    title: 'Positioning Test Lab',
    role: 'pmm',
    metric: 'Wholesale Category Expansion',
    outcome: '+50% category sales growth',
    source: 'Reebok feminine graphic tee positioning test',
    framework: 'Hypothesis-driven positioning variants + controlled test',
    summary: 'Write competing positioning variants, size the test properly, then pick the winner with real statistics.',
    features: [
      {
        feature: 'Positioning variant builder',
        benefit: 'Each variant states audience, emotional angle, headline and proof, so variants differ on purpose.',
        useCase: 'Testing a new audience angle for an existing product line.',
      },
      {
        feature: 'Positioning statement generator',
        benefit: 'Produces a clean "For / who / is the / that / unlike" statement per variant.',
        useCase: 'Aligning merchandising, sales and creative on one sentence per variant.',
      },
      {
        feature: 'Sample size + duration planner',
        benefit: 'Tells you how many visitors and days you need before results mean anything (with multi-variant correction).',
        useCase: 'Deciding if a test is worth running on current traffic.',
      },
      {
        feature: 'Results analyzer + category impact',
        benefit: 'Calls a winner with p-values and translates the lift into category revenue.',
        useCase: 'Making the wholesale sell-in case to a buyer with numbers.',
      },
    ],
  },
  {
    id: 'inbound-agent',
    n: 4,
    title: 'Inbound Qualification Agent',
    role: 'gtme',
    metric: 'Inbound Sales Automation',
    outcome: 'Reduced from 10 SDRs to 1 SDR + agent',
    source: 'Vercel GTME inbound agent deployment',
    framework: 'Legible, deterministic GTM workflow encoded as an agent with human QA',
    summary: 'Encode your inbound qualification rules once, route every lead with reasons, and send only the gray zone to a human.',
    features: [
      {
        feature: 'Configurable fit + intent scoring rules',
        benefit: 'Your ICP and buying signals live in one editable config instead of 10 SDRs\' heads.',
        useCase: 'Replacing manual inbound triage with a consistent, auditable rule set.',
      },
      {
        feature: 'Batch router with reasons and confidence',
        benefit: 'Every lead gets a route (AE, QA, nurture, disqualify) plus the exact reasons why.',
        useCase: 'Running last month\'s inbound CSV to see how the agent would have routed it.',
      },
      {
        feature: 'LLM agent prompt + JSON schema export',
        benefit: 'Generates the system prompt for an LLM qualifier that follows the same rules.',
        useCase: 'A GTME wiring the agent into a form webhook, CRM or Slack.',
      },
      {
        feature: 'SDR capacity calculator + CLI',
        benefit: 'Shows how many SDRs are still needed for QA, and runs the same logic from the command line.',
        useCase: 'Planning the redeployment of SDRs to outbound.',
      },
    ],
  },
  {
    id: 'agent-roi',
    n: 5,
    title: 'Agent Economics Model',
    role: 'gtme',
    metric: 'Inbound Agent Operating Cost',
    outcome: '~$1,000 per year in compute cost',
    source: 'Vercel AI Cloud infrastructure',
    framework: 'Unit economics of an AI agent vs. headcount, plus redeployment upside',
    summary: 'Model what an agent really costs to run per lead and per year, what it saves, and what the freed-up SDRs can produce.',
    features: [
      {
        feature: 'Per-lead token cost model',
        benefit: 'Builds the compute bill bottom-up from calls, tokens and your provider\'s rates.',
        useCase: 'Answering finance\'s "what does this agent cost us?" with a defensible number.',
      },
      {
        feature: 'Before vs. after team cost',
        benefit: 'Compares SDR payroll to agent + QA + GTME build and maintenance.',
        useCase: 'Business case for funding a GTME role.',
      },
      {
        feature: 'Redeployment pipeline model',
        benefit: 'Shows the outbound pipeline and bookings the freed SDRs can generate.',
        useCase: 'Pitching the change as growth, so it isn\'t read as a headcount cut.',
      },
      {
        feature: 'Token sensitivity table',
        benefit: 'Stress-tests the cost at 2x, 5x and 10x token usage.',
        useCase: 'Checking the case still holds if prompts get longer or you add tools.',
      },
    ],
  },
  {
    id: 'win-room',
    n: 6,
    title: 'Competitive Win Room',
    role: 'both',
    metric: 'Competitive Win Rate',
    outcome: '75% in head-to-head evaluations',
    source: 'Atlin AI-assisted narrative positioning',
    framework: 'Battlecards + win/loss + Lostbot and Dealbot agents',
    summary: 'Track head-to-head win rate by competitor, audit why deals really died, flag open deals at risk, and keep battlecards current.',
    features: [
      {
        feature: 'Head-to-head win rate tracker',
        benefit: 'Win rate by competitor and by whether the new narrative was used, measured against your target.',
        useCase: 'Proving a new positioning narrative moves win rate.',
      },
      {
        feature: 'Lostbot audit',
        benefit: 'Compares the seller\'s logged loss reason to deal evidence and names the real driver.',
        useCase: 'Quarterly win/loss review where every loss says "price".',
      },
      {
        feature: 'Dealbot risk alerts',
        benefit: 'Flags open deals missing an economic buyer, champion, ROI or plan past your day limits, as copy-ready Slack alerts.',
        useCase: 'Weekly pipeline review or a deal-channel bot.',
      },
      {
        feature: 'Battlecard builder + buyer simulation prompt',
        benefit: 'Exports a clean battlecard and a prompt to pressure-test it against a simulated buyer.',
        useCase: 'Enabling reps before a bake-off against a named competitor.',
      },
    ],
  },
  {
    id: 'narrative-library',
    n: 7,
    title: 'Narrative Product Library',
    role: 'pmm',
    metric: 'Net Revenue Retention (NRR)',
    outcome: 'Scaled from 107% to 120% in < 2 years',
    source: 'Asana composable narrative products',
    framework: 'Composable, pre-approved messaging blocks mapped to moments of truth',
    summary: 'Store messaging as approved, versioned blocks, compose them by persona and moment of truth, and model their effect on NRR.',
    features: [
      {
        feature: 'Versioned block library with approval + staleness',
        benefit: 'Everyone pulls from approved, dated messaging; stale blocks get flagged.',
        useCase: 'Ending the "which deck is current?" Slack thread.',
      },
      {
        feature: 'Persona x moment composer',
        benefit: 'Assembles a message for a persona at onboarding, expansion, renewal or at-risk from approved blocks.',
        useCase: 'A CSM preparing a renewal or expansion conversation in 2 minutes.',
      },
      {
        feature: 'Coverage matrix',
        benefit: 'Shows which persona and moment combinations have no approved message.',
        useCase: 'Planning next quarter\'s PMM content backlog.',
      },
      {
        feature: 'NRR lever model + target solver',
        benefit: 'Breaks NRR into expansion, contraction and churn, and solves for what it takes to hit a target.',
        useCase: 'Setting the expansion and churn goals the narrative program owns.',
      },
    ],
  },
  {
    id: 'segment-sizer',
    n: 8,
    title: 'Segment Opportunity Sizer',
    role: 'pmm',
    metric: 'Product Launch Segment Growth',
    outcome: 'Scaled to > $1 Billion ARR',
    source: 'Adobe Express young creator segment strategy',
    framework: 'Cohort-based market sizing + 3-axis segmentation (size, growth, attributes)',
    summary: 'Size a segment bottom-up by cohort instead of a flat percentage, project ARR, and rank segments on size, growth and fit.',
    features: [
      {
        feature: 'Cohort-based sizing',
        benefit: 'Replaces "2.5% of everyone" with cohort sizes and adoption rates you can defend.',
        useCase: 'Sizing a new audience segment for a launch or a case interview.',
      },
      {
        feature: 'ARR funnel projection',
        benefit: 'Walks from addressable users to reachable, paying and ARR, with every assumption visible.',
        useCase: 'Deciding if a segment can plausibly become a $1B line.',
      },
      {
        feature: '3-axis segment scoring',
        benefit: 'Ranks segments on size, growth and workload/model fit with weights you control.',
        useCase: 'Prioritizing a 50-person startup growing 200% over a flat 500-person firm.',
      },
      {
        feature: 'Quadrant labels',
        benefit: 'Tags each segment as land now, bet on growth, nurture or deprioritize.',
        useCase: 'Territory and campaign planning with sales leadership.',
      },
    ],
  },
  {
    id: 'risk-messaging',
    n: 9,
    title: 'Risk-First Messaging Studio',
    role: 'both',
    metric: 'Buying Motivation Ratio',
    outcome: '80% risk avoidance vs. 20% upside',
    source: 'Enterprise sales decision-making psychology',
    framework: 'Risk-reduction psychology + feature-to-benefit translation + value-add discovery',
    summary: 'Check if your copy speaks to the risk buyers are trying to avoid, translate features into benefits and risks removed, and plan discovery that gives value first.',
    features: [
      {
        feature: 'Copy risk/upside analyzer',
        benefit: 'Highlights risk-avoidance vs. upside language and scores the mix against 80/20.',
        useCase: 'Reviewing an enterprise email, landing page or deck before it ships.',
      },
      {
        feature: 'Feature -> benefit -> risk removed ladder',
        benefit: 'Turns each raw feature into an emotional benefit and the specific pain it prevents.',
        useCase: 'Writing launch messaging or a sales one-pager.',
      },
      {
        feature: 'Role-based discovery planner',
        benefit: 'Builds an 80/20 question plan per buyer role, plus a value-add asset to bring.',
        useCase: 'Prepping a first call with an economic buyer or security reviewer.',
      },
    ],
  },
  {
    id: 'fast-five',
    n: 10,
    title: 'Fast Five Research Kit',
    role: 'pmm',
    metric: 'Customer Interview Certainty',
    outcome: '97% certainty from 5 interviews',
    source: 'Fast Five qualitative research framework',
    framework: '5 unscripted 50-minute interviews triggered by a quantitative signal',
    summary: 'Run 5 focused customer interviews off a data signal, capture notes, and synthesize patterns with the math behind "97%".',
    features: [
      {
        feature: 'Signal + hypothesis setup with interview guide',
        benefit: 'Generates a 50-minute unscripted guide built around your hypothesis.',
        useCase: 'A metric dropped and you need to know why by Friday.',
      },
      {
        feature: '5-slot interview notebook',
        benefit: 'One place for notes, quotes, tags and a "did the hypothesis hold?" call per interview.',
        useCase: 'Running interviews with a PM or designer taking notes.',
      },
      {
        feature: 'Pattern synthesis',
        benefit: 'Counts tags across interviews and labels them pattern (3+), signal (2) or anecdote (1).',
        useCase: 'Writing the readout and deciding what to change.',
      },
      {
        feature: 'Detection probability calculator',
        benefit: 'Shows what "97%" actually means and how many interviews you need for rarer problems.',
        useCase: 'Defending a 5-interview study to a skeptical exec.',
      },
    ],
  },
];

export function getTool(id) {
  return TOOLS.find((t) => t.id === id);
}
