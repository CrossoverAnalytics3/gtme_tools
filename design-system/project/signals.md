# Tool signals

Every tool owns one signal color. It is picked for what the tool does, spaced about 35 degrees apart around the OKLCH hue wheel at one lightness, so all ten read as one family and each clears 5:1 as text in both themes.

Set `data-tool="<id>"` on a page root and `accent` / `accent-wash` follow that tool. Use a tool's signal outside its own page only as a navigation dot.

| Tool | Signal | Token | Light | Dark | Why this color |
| --- | --- | --- | --- | --- | --- |
| 1. Launch Lift Planner | Lift blue | `sig-launch-lift` | `#2a5fb7` | `#8eb8fe` | Blue reads as signal and go-live. It's the launch-day color. |
| 2. Adoption Campaign Builder | Adoption green | `sig-adoption-campaign` | `#057743` | `#6cd092` | Green for growth and habit: users moving from never-tried to active. |
| 3. Positioning Test Lab | Variant magenta | `sig-positioning-lab` | `#903d8b` | `#e698df` | A test color. Magenta stays clear of status colors, so a variant never looks like a warning. |
| 4. Inbound Qualification Agent | Agent teal | `sig-inbound-agent` | `#02736e` | `#21d1ca` | Machine-cool teal for the automated workflow the GTME owns. |
| 5. Agent Economics Model | Ledger amber | `sig-agent-roi` | `#7e5e01` | `#ddb049` | The color of money and ledgers: this tool is a business case. |
| 6. Competitive Win Room | Bake-off orange | `sig-win-room` | `#9c4700` | `#fa9d68` | Competitive heat. Orange signals pressure without reading as a loss. |
| 7. Narrative Product Library | Narrative violet | `sig-narrative-library` | `#6b4cae` | `#bda7fe` | Editorial violet for the approved messaging library. |
| 8. Segment Opportunity Sizer | Cohort olive | `sig-segment-sizer` | `#5b6c02` | `#adc35e` | Earthy olive for markets, populations and territory. |
| 9. Risk-First Messaging Studio | Risk red | `sig-risk-messaging` | `#a73447` | `#fe949d` | Red names the risk buyers are trying to avoid. It's the subject of the tool. |
| 10. Fast Five Research Kit | Interview cyan | `sig-fast-five` | `#036e8b` | `#41c8f6` | Clear cyan for listening and research. |

## How the signals were built

- Light theme: OKLCH lightness 0.50, chroma up to 0.15 (reduced where the hue leaves the sRGB gamut). White text on every light signal is 5.6:1 or better.
- Dark theme: lightness 0.78, chroma up to 0.13, with `on-accent` (deep ink) as text on fills, 8.9:1 or better.
- Washes: lightness 0.955 (light) and 0.27 (dark) at low chroma, for banners and info pills behind signal text (5:1 or better).
- Hues: risk 15, bake-off 50, ledger 85, cohort 120, adoption 155, agent 190, interview 225, lift 260, narrative 295, variant 330.
