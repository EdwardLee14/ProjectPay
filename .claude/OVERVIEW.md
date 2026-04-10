
Executive Summary
A Financial Operating System for the Contractor Economy
VisiBill helps contractors get paid faster by replacing invoices with live project budgets—so clients always see exactly where their money goes, in real time, eliminating friction and disputes.
Target Launch: Q4 2026  •  Funding Sought: $250K  •  Year Founded: 2026


PROBLEM: The Invoice Black Box
When contractors are hired for home renovations, property management, or general project work, they immediately take on significant upfront costs to keep jobs moving. Materials, equipment rentals, and daily operating expenses add up fast, forcing contractors to front large amounts of capital well before any invoice goes out. For small to mid-sized operations, this pressure compounds across multiple active jobs, tying up cash across clients and squeezing already limited working capital.
At the same time, clients are reluctant to release funds without clear visibility into how that money is being spent. The result is a persistent cash flow squeeze: contractors slow down or absorb risk to keep projects moving, while clients hold back, leading to delays, friction, and strained working relationships.
Key Pain Points
Cash flow pressure: Delayed or disputed payments stall operations and make planning unpredictable.
No real-time visibility: Clients see vague line items like “Materials: $3,400” with no context—driving skepticism and slow approvals.
Budget overruns become disputes: Most construction projects exceed their budgets. In a study of over 16,000 projects, less than half finished within budget, with an average overrun of 65% and extreme cases exceeding 1,800%. Without real-time tracking, these issues often emerge late, causing disputes and delays.
Payment delayed or denied: Clients scrutinize invoices line-by-line. One disputed item freezes the entire payment.
Manual processes waste time: Contractors track receipts by hand; clients reconcile line items manually. Neither side has a real-time view.

Market Evidence
Metric
Source
85% of contractors experience late payments
Remote, 2026
29% of invoices over $20K are paid late or disputed
Bonsai
49% of companies manage contractor billing via spreadsheets
Remote, 2026
73 million independent contractors in the U.S. (45% of labor force)
MBO Partners, 2026
Poor communication causes 1 in 3 project failures
PMI
Only 47.9% of projects are completed within budget
How Big Things Get Done


SOLUTION: Live Budgets from Day One
VisiBill replaces the invoice-at-the-end model with real-time visibility from the start. Instead of explaining costs weeks later, contractors and clients align on a structured budget that’s securely funded upfront, with every dollar tracked live as the project progresses. Each expense appears on the client’s dashboard in real time as the contractor spends—eliminating surprises and reducing friction. Payment happens faster because clients have already seen the spend unfold.
How It Works
The contractor builds a project budget with 2 to 8 spending categories, each with a defined dollar cap. The client reviews and approves everything upfront, so both sides are aligned before work begins.
The client funds the project securely through Stripe. Money is held independently, accessible only through a dedicated project card, and never withdrawable as cash. Milestone-based funding is also available.
The contractor spends using a virtual card tied to the approved budget. Every transaction is auto-categorized in real time via merchant codes and appears on the client dashboard within seconds. The card declines automatically if a category limit is reached.
When overruns happen, the contractor submits a change order with a justification. The client approves and funds the additional amount, and both sides have a documented record. Issues get resolved on day 3, not day 30.
MVP Philosophy
Start with contractors only → fastest adoption, no two-sided onboarding required.
Deliver instant client value without requiring client sign-up.
Focus on one critical workflow first: materials spend tracking.
Expand to labor, milestones, and subcontractors in Q3–Q4 2026.

MARKET ANALYSIS
Primary Customer: Small General Contractors
2–10 person teams running 2–5 projects per year. They manage budgets in spreadsheets or their heads. A single bad review or payment dispute can damage their business. They recognize ‘I use VisiBill—you’ll see every dollar’ as a competitive pitch that wins bids and builds a reputation.
Secondary Users: Anyone Who Hires Contractors
Homeowners (residential renovations)
Property managers (maintenance, capital projects)
Business owners (office buildouts, repairs)
Agencies managing subcontractors and freelancers





Market Opportunity
Metric
Figure
General contractors employees in the U.S.
~7 mil 
Total Construction companies
~740K
% of <10 employee firms
~82%
Total small crew contractors (Target Market SAM)
~600K
Annual U.S. commercial contractor spend
$1.2T+
Average project value
$50K
VisiBill take rate
1.5%
Revenue per project
~$500–750
ARR per 5-project contractor
~$2,500–3,750
ARR at 10% small contractor capture (~45K)
~$170M


COMPETITIVE STRATEGY
Why Existing Solutions Fail
Procore, Buildr, Touchplan: Enterprise project management at $100–$300/month. Designed for commercial scale—overkill and unaffordable for 2–5 person teams.
QuickBooks, Xero, FreshBooks: Accounting and invoicing tools. Capture costs after the fact. No real-time visibility, no shared client interface, no budget controls.
Stripe Connect, PayPal, Square: Move money and issue cards, but offer no domain expertise, no budget framework, and no transparency layer for clients.
VisiBill’s Competitive Advantage
Contractor-first, single-sided adoption: No two-sided onboarding. Contractors sign up and use it today; clients benefit immediately via a no-login shared link.
Live budgets, not post-facto invoices: Clients watch spending happen in real time. The mental model is ‘controlled budget,’ not ‘invoice I have to scrutinize.’ Disputes are eliminated before they start.
Built on Stripe infrastructure: 99.99% uptime. FCA regulated. Homeowners recognize and trust Stripe. Virtual cards work immediately.
Minimal friction to adoption: Contractor creates a project, defines budget, invites client via link. No complex integrations. No training required.
Defense Strategy
Each project generates a financial paper trail that both contractors and clients have a vested interest in preserving, creating meaningful switching costs over time.
Contractors build a VisiBill track record that carries weight when bidding on new work. "I use VisiBill" becomes a signal of professionalism that wins jobs.
A single contractor typically brings multiple clients onto the platform, and those clients go on to recommend VisiBill to other contractors they hire, compounding growth organically.
The goal is to reach 500+ active contractors by the end of 2026, establishing a dominant position before larger platforms can build a comparable offering.

PRODUCT SUMMARY
Core Features
Project creation & budget proposal: Contractor creates a project with 2–8 spending categories, each with a dollar cap. Client reviews the proposal and approves or requests adjustments before any card is activated. Neither party can spend until both sides agree on the budget.
Flexible funding: Clients fund projects via a pre-funded wallet or pay-as-you-go. Guardrails include daily spending limits, identity verification, and balance checks. Pay-as-you-go requires a verified payment method on file before the card is activated.
Virtual card (Stripe Issuing): One virtual card is issued per project, active only after client approval. Transactions are auto-categorized by vendors. If a transaction cannot be confidently categorized, it is flagged for contractor review before being assigned to a budget line. Spending is enforced at the category level – a transaction that would exceed a category cap is declined automatically.
Budget alerts & top-up requests: When a category reaches 90% of its cap, the contractor receives an alert with the option to submit a top-up request specifying an amount. The client must explicitly approve every request before funds are added. If a refund restores the category balance below 90%, any pending top-up request is automatically cancelled.
Refunds: Refunds credited to the virtual card restore the corresponding category budget. The 90% alert threshold is re-evaluated on every balance change – pending top-up requests are only auto-cancelled if the refund brings the balance below 90%.
Real-time transaction feed: Every transaction appears on the client dashboard within seconds: vendor, amount, category, and running balance per category. Push notifications are sent for transactions above a configurable threshold.
Budget dashboard: Displays total spent and remaining across all categories, per-category progress bars, burn-rate indicators, and color-coded status (green / yellow / red). Both parties see the same data in real time.
Change orders: Contractor submits a change order with written justification. Client approves, denies, or counters. If countered, the contractor has a set window to accept or re-negotiate. No response within 48 hours triggers defaults to rejection. Auto-approval thresholds configurable per project.
Receipt & documentation: Contractors upload a photo receipt per transaction with an optional note. Clients can request docs on any line item with one tap. Unreceipted transactions are flagged on the dashboard.
Labor payments: Funded separately from the project card. Milestone-based or recurring. Contractor submits a request; client releases with one click via ACH (1–3 business days). Partial milestone releases not supported.
Project close & summary: Either party can initiate close. All open change orders and top-up requests must be resolved first. Card deactivates at close. Both parties receive a full PDF summary: category totals, all transactions with receipts, and labor payments.
User Experience
Contractor: Create project → define budget → issue card → swipe for expenses. Mobile app shows live balances. No invoicing labor. Faster payment. Competitive pitch to win bids.
Client: Accept invite → review budget → link bank → fund. Check dashboard when curious. Push notifications for large transactions. Every dollar explained by vendor and category—before the invoice ever arrives.
Roadmap
Phase
Timeline
Scope
MVP
Q2 2026
Materials wallet, virtual card, client dashboard (no login), live transaction feed
Beta
Q3 2026
Mobile app (iOS/Android), labor & milestone payments, spend requests, 50 contractors
GA
Q4 2026
Full project cash flow, change orders, subcontractors, 500+ live projects


GO-TO-MARKET STRATEGY
Launch Roadmap
Q2 2026 – MVP Validation: 5–10 pilot projects. Direct contractor outreach. Milestone: 3/5 contractor interviews confirm billing friction is top-three pain point.
Q3 2026 – Beta Growth: Mobile app. Labor + milestone payments. Expand to 50 contractors, 30–50 live projects. Milestone: NPS above 50.
Q4 2026 – General Availability: Marketing campaign. Partnerships with NAHB and local contractor associations. Target: 500+ live projects, $1M+ monthly transaction volume.
Customer Acquisition
Direct outreach: LinkedIn, chamber of commerce, contractor forums. Pitch: ‘Get paid faster, win more bids.’ Free trial on first project.
Supply chain partnerships: Home Depot, Lowe’s, local lumber yards. Co-market VisiBill as a transparency tool at point of purchase.
Content & thought leadership: How-to guides and case studies on HomeAdvisor, Angi. Podcast appearances targeting contractor audiences.
Referral incentives: Contractor who refers another receives $500 VisiBill credit, scaling network effects organically.
Pricing & Revenue Model
1.5% of project value, charged to the contractor. Clients use the platform for free—all adoption friction removed on the client side. Percentage pricing scales with project size and covers Stripe processing costs (~2.9% + per-transaction + issuing fees) as volume grows. For a contractor running five $50K projects per year, the total annual cost is $3,750–$5,000—a straightforward business expense that wins bids and eliminates the administrative burden of invoicing.

TIMELINE & MILESTONES
Quarter
Deliverables
Success Metrics
Q2 2026
MVP, Stripe integration, 10–15 contractor interviews, pilot projects
3/5 interviews confirm pain; 5–10 pilots live
Q3 2026
Mobile app, pay-as-you-go, spend requests, beta launch
50 beta contractors, 30–50 live projects, NPS >50
Q4 2026
GA, marketing campaign, NAHB + supply chain partnerships
500+ projects, $1M+ monthly volume, 80% retention


FINANCIALS
Unit Economics (Per Project)
Metric
Amount
Average project value
$50,000
VisiBill take rate
1.5%
Revenue per project
$750
Payment cost (% GMV) to Stripe
~2.0% → ~1.1%
Payment cost / project
$1000 → $550
Infra + support / project
~$150 → $200
CAC/project (blended)
~$50–$100 (declines with growth)


Early revenue is negative per project as payment costs exceed the 1.5% take rate. As scale increases, contractors drive higher project volume (6–8 projects/year), CAC declines through referral-driven growth, and payment costs compress with volume. This improves contribution margin from negative to positive on a per-project basis, with full business profitability achieved as operating leverage spreads fixed costs across a growing transaction base.

2026 Projections
Metric
Y1
Y2
Y3
Y4
Y5
Live projects (cumulative)
600
1800
3600
7200
14000
GMV ($)
$30M
$90M
$180M
$360M
$700M
Revenue (1.5%)
$450K
$1.35M
$2.70M
$5.40M
$10.50M
OpEx
($805K)
(1.15M)
($2.10M)
($4.00M)
($7.60M)
Net Profit
($343K)
$200K
$600K
$1.40M
$2.90M
Status
Validation
Growth
Scaling






Assumptions reflect a transaction-driven model where growth is driven by increasing live project volume and contractor usage rather than pricing changes: projects scale rapidly through contractor adoption and repeat use (5 → ~6.5+ projects per contractor by Year 2), with an average project value of ~$50K and a fixed 1.5% take rate generating revenue directly from GMV. Cost structure includes payment processing (declining as a % of GMV with scale), infrastructure, and customer acquisition, which grow more slowly than transaction volume, creating operating leverage. The table shows how faster project growth increases GMV and revenue disproportionately relative to OPEX, enabling profitability as fixed and semi-variable costs are spread across a larger transaction base.

RISK & MITIGATION
Contractor adoption resistance: Some contractors may perceive transparency as monitoring. Position VisiBill as a payment accelerator and bid-winning tool. Contractor controls execution, client simply observes.
Client hesitation to fund a new platform: Money is held by Stripe (FCA regulated, $100B+ in transaction volume), not VisiBill. Funds accessible only via card. Milestone funding available.
Stripe integration or fee increases: Engage Stripe account team early. Lock in card issuance/ACH pricing via volume commitment. Develop a contingency processor (Adyen, Checkout.com).
Regulatory: state money transmission: Stripe holds funds in FDIC-insured accounts; VisiBill does not hold client money directly. Launch in low-friction states first (CA, NY, TX); register for licenses incrementally.
Competition from large platforms: Move fast to establish network effects and vertical expertise. Large platforms won’t replicate contractor domain knowledge quickly. Lock in supply-chain partnerships early.

LONG-TERM VISION & SOCIAL IMPACT
VisiBill’s mission: enable 73 million independent contractors in the U.S. to operate with trust, transparency, and economic security. By 2030, VisiBill is the financial operating system for the contractor economy—eliminating the invoice black box and giving every contractor a reputation and cash-flow advantage.

3–5 Year Roadmap
Multi-trade project management: plumbing, electrical, HVAC on the same project with a unified budget and transparency layer.
Supplier integration: direct data feeds from Home Depot, Lowe’s, and local suppliers—material costs auto-populate without manual entry.
Contractor reputation & scoring: anonymized on-budget, on-time, and client satisfaction data becomes a verifiable hiring signal.
Marketplace: browse and hire contractors by VisiBill track record. Proven performers earn premium positioning and higher rates.

Social Impact
Faster payments → improved contractor cash flow, enabling sustainable hiring and investment in tools.
Real-time visibility → disputes become factual, not subjective, protecting both contractors and clients.
Transparency-driven professionalism → on-budget, on-time contractors earn more work and command better rates.
Market efficiency → reduced friction enables contractors to pitch with confidence and clients to make informed decisions.

CONCLUSION
VisiBill solves a fundamental problem in a $1.2T+ market: the lack of real-time financial transparency between contractors and clients. By starting contractor-first and shipping a tightly scoped MVP, VisiBill unlocks fast adoption, natural distribution via contractor-to-client referral loops, and immediate value for both sides.
Strategy in one sentence: Win contractors by solving cash flow and admin pain—win clients indirectly through transparency.


MANAGEMENT TEAM
Evan Chang is a software engineer, Informatics student, and founder with several years of industry experience. He has worked across organizations ranging from Seeq Corporation to Tesla to Nurocor, and founded ProtoScore, which was later acquired. Through that journey, he's built a strong foundation in shipping production-level software and collaborating closely with clients to deliver enterprise applications that scale.





Nam Le is a Bachelor of Science in Computer Science candidate at the University of Washington, class of 2027, and an esteemed Allen Scholar. He is a full-stack engineer with deep, hands-on expertise in fintech, specializing in payment and card issuing systems—the very infrastructure that drives ProjectPay.








Edward Lee is a software engineer, Informatics student, and co-founder, whose work on ProtoScore led to its acquisition by Nurocor. He also contributed to innovative AI-driven solutions at Robert Half, combining full-stack and scalable system expertise across startup and enterprise environments.







Jamie Yue is a senior business marketing and finance Foster guru full of initiative, passion, and spark. She has been a part of many self-starting brands both consumer-facing and tech, with AI-scaling and implementation experience in biotech and fintech industries.

