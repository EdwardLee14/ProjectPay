import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import s from "./home.module.css";
import shared from "@/styles/shared.module.css";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-guild-cream">
      {/* Navigation */}
      <header className={s.siteHeader}>
        <div className={s.headerInner}>
          <h1 className={s.logo}>VisiBill</h1>
          <nav className={s.navGroup}>
            <a href="#how-it-works" className={shared.navLink}>How It Works</a>
            <a href="#for-contractors" className={shared.navLink}>For Contractors</a>
            <a href="#for-clients" className={shared.navLink}>For Clients</a>
          </nav>
          <div className={s.navActions}>
            <Link href="/sign-in" className={shared.navLink}>Sign In</Link>
            <Button variant="pill-orange" size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className={s.hero}>
          <div className={s.heroGrid}>
            <div className={s.heroContent}>
              <p className={shared.eyebrowAccent}>
                Financial Transparency for Construction
              </p>
              <h1 className={shared.heroTitle}>
                Get paid faster.
                <br />
                Win more bids.
              </h1>
              <p className={s.heroDesc}>
                Replace invoices with live project budgets. Your clients see every
                dollar in real time — eliminating disputes before they start.
              </p>
              <div className={s.heroCtas}>
                <Button variant="pill" asChild>
                  <Link href="/sign-up">Start Your First Project &rarr;</Link>
                </Button>
                <a href="#how-it-works" className={shared.textCta}>
                  See how it works
                </a>
              </div>
            </div>

            <div className={shared.imageFrame}>
              <Image
                src="/images/hero-image.jpg"
                alt="Contractor reviewing live project budget on tablet"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className={s.stats}>
          <div className={s.statsGrid}>
            {[
              { label: "Fronting the Bill", stat: "85%", desc: "of contractors experience late or disputed payments." },
              { label: "Invoice Friction", stat: "29%", desc: "of invoices over $20K are paid late or disputed." },
              { label: "Manual Processes", stat: "49%", desc: "of companies still manage contractor billing via spreadsheets." },
            ].map((item) => (
              <div key={item.stat} className={s.statCell}>
                <p className={s.statLabel}>{item.label}</p>
                <p className={s.statValue}>{item.stat}</p>
                <p className={s.statDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className={s.howItWorks}>
          <svg className={s.howItWorksBg} viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-100 520 Q 400 -80, 900 300 T 1540 100" stroke="#E7651C" strokeWidth="20" fill="none" opacity="0.25" />
            <path d="M-50 580 Q 500 50, 1000 350 T 1540 180" stroke="#E7651C" strokeWidth="14" fill="none" opacity="0.15" />
            <path d="M-100 200 Q 300 500, 800 250 T 1540 450" stroke="#E7651C" strokeWidth="16" fill="none" opacity="0.12" />
          </svg>
          <div className={cn(shared.contentWrap, "relative z-10")}>
            <h2 className={cn(shared.sectionTitle, "mb-12")}>
              From budget to payment.
              <br />
              No invoices required.
            </h2>

            <div className={s.stepsGrid}>
              {/* Card 1: Define Your Budget */}
              <div className={s.stepCard}>
                <div className={s.stepTop}>
                  <div className={s.mockupScreen}>
                    <div className={s.mockupHeader}>
                      <span className={s.mockupTitle}>Kitchen Reno</span>
                      <span className={s.mockupBadge}>$48,000</span>
                    </div>
                    <div className="h-px bg-off-black my-1" />
                    {[
                      { name: "Materials", amt: "$22,000", w: "w-[46%]" },
                      { name: "Labor", amt: "$18,000", w: "w-[37%]" },
                      { name: "Permits", amt: "$8,000", w: "w-[17%]" },
                    ].map((cat) => (
                      <div key={cat.name} className="space-y-0.5">
                        <div className={s.mockupRow}>
                          <span className={s.mockupRowLabel}>{cat.name}</span>
                          <span className={s.mockupRowValue}>{cat.amt}</span>
                        </div>
                        <div className={s.mockupBar}>
                          <div className={cn(s.mockupBarFill, cat.w)} />
                        </div>
                      </div>
                    ))}
                    <div className={s.mockupDashedRow}>
                      <span className="text-[7px] text-off-black/40">+ Add Category</span>
                    </div>
                  </div>
                </div>
                <div className={s.stepBottom}>
                  <span className={cn(s.stepNum, s.textDarkFaded)}>01</span>
                  <h3 className={cn(s.stepTitle, s.textDark)}>Define Your Budget</h3>
                  <p className={cn(s.stepDesc, s.textDarkMuted)}>Create a project with 2-8 spending categories, each with a dollar cap.</p>
                </div>
              </div>

              {/* Card 2: Client Funds It — Donut Chart */}
              <div className={s.stepCard}>
                <div className={s.stepTop}>
                  <div className="flex flex-col items-center text-center">
                    {/* CSS donut chart */}
                    <div className="relative w-28 h-28 mb-3">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#170B0115" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E7651C" strokeWidth="3" strokeDasharray="46 100" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3A6B4A" strokeWidth="3" strokeDasharray="37 100" strokeDashoffset="-46" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#170B01" strokeWidth="3" strokeDasharray="17 100" strokeDashoffset="-83" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-headline text-sm font-extrabold text-off-black">$48k</span>
                        <span className="text-[6px] text-off-black/40 uppercase tracking-wider font-bold">Funded</span>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex gap-3">
                      {[
                        { color: "bg-primary", label: "Materials" },
                        { color: "bg-secondary", label: "Labor" },
                        { color: "bg-off-black", label: "Permits" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1">
                          <div className={cn("w-1.5 h-1.5", item.color)} />
                          <span className="text-[6px] text-off-black/50 font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 bg-secondary text-white text-[7px] font-bold px-4 py-1.5 rounded-full">
                      Approve &amp; Fund
                    </div>
                  </div>
                </div>
                <div className={s.stepBottom}>
                  <span className={cn(s.stepNum, s.textDarkFaded)}>02</span>
                  <h3 className={cn(s.stepTitle, s.textDark)}>Client Funds It</h3>
                  <p className={cn(s.stepDesc, s.textDarkMuted)}>Your client reviews, approves, and funds the project securely through Stripe.</p>
                </div>
              </div>

              {/* Card 3: Spend Transparently */}
              <div className={s.stepCard}>
                <div className={s.stepTop}>
                  <div className={s.mockupScreenDark}>
                    {/* Virtual Card */}
                    <div className={s.mockupCard}>
                      <div className="flex justify-between items-center">
                        <span className="text-[6px] font-bold text-white/60 tracking-widest">VISIBILL</span>
                        <span className="text-[6px] text-white/30 font-bold tracking-wider">VISA</span>
                      </div>
                      <div className="mt-4 mb-2">
                        <p className="text-[9px] text-white font-mono tracking-[0.15em]">4289 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 7103</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[6px] text-white/50 font-medium">Kitchen Reno</span>
                        <span className="text-[6px] text-white/50">12/27</span>
                      </div>
                    </div>
                    {/* Live Feed */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={s.mockupLiveDot} />
                      <span className="text-[6px] text-off-black/40 font-bold uppercase tracking-wider">Live</span>
                    </div>
                    {[
                      { merchant: "Home Depot", amt: "-$347" },
                      { merchant: "Lowe's", amt: "-$128" },
                    ].map((tx) => (
                      <div key={tx.merchant} className={s.mockupTxRow}>
                        <span className="text-[7px] text-off-black/70 font-medium">{tx.merchant}</span>
                        <span className="text-[7px] text-primary font-bold">{tx.amt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={s.stepBottom}>
                  <span className={cn(s.stepNum, s.textDarkFaded)}>03</span>
                  <h3 className={cn(s.stepTitle, s.textDark)}>Spend Transparently</h3>
                  <p className={cn(s.stepDesc, s.textDarkMuted)}>Virtual card for materials. Every transaction auto-categorized and visible.</p>
                </div>
              </div>

              {/* Card 4: Get Paid */}
              <div className={s.stepCard}>
                <div className={s.stepTop}>
                  <div className={cn(s.mockupScreen, "flex flex-col items-center justify-center text-center")}>
                    <div className={s.mockupCheckCircle}>
                      <span className="text-secondary text-sm font-bold">&#10003;</span>
                    </div>
                    <p className="text-[9px] font-bold text-off-black mt-1">Kitchen Reno</p>
                    <span className={s.mockupCompleteBadge}>Complete</span>
                    <p className="font-headline text-sm font-extrabold text-off-black tracking-tight mt-1.5">$48,000</p>
                    <p className="text-[7px] text-off-black/40">100% accounted for</p>
                    <div className="w-12 h-px bg-off-black my-2" />
                    <div className={s.mockupReleaseBar}>Payment Released &#10003;</div>
                    <p className={s.mockupTimestamp}>Apr 7, 2026</p>
                  </div>
                </div>
                <div className={s.stepBottom}>
                  <span className={cn(s.stepNum, s.textDarkFaded)}>04</span>
                  <h3 className={cn(s.stepTitle, s.textDark)}>Get Paid</h3>
                  <p className={cn(s.stepDesc, s.textDarkMuted)}>No invoicing. Your client has already watched every dollar. Payment is a formality.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value statement */}
        <section className={s.valueStatement}>
          <div className={s.valueStatementInner}>
            <p className={s.valueStatementText}>
              One platform. Shared visibility. Built for the way
              construction actually gets paid.
            </p>
          </div>
        </section>

        {/* For Contractors */}
        <section id="for-contractors" className={s.contractorsSection}>
          <div className={s.contractorsWrap}>
            {/* Left: Mini utilization card */}
            <div className={s.contractorsCards}>
              <div className={s.miniUtilCard}>
                {/* SVG geometric viz */}
                <div className={s.miniUtilViz}>
                  <svg viewBox="0 0 240 260" preserveAspectRatio="xMaxYMin slice">
                    <defs>
                      <pattern id="hatchLanding" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#1a1a1a" strokeWidth="0.7" />
                      </pattern>
                      <clipPath id="shapeClipLanding">
                        <path d="M0,260 L40,200 L70,120 L110,40 L135,80 L160,15 L195,70 L230,0 L240,0 L240,260 Z" />
                      </clipPath>
                    </defs>
                    <g transform="translate(8, 3)">
                      <path d="M60,260 L90,140 L120,55 L148,95 L174,22 L212,85 L250,8 L260,15 L260,260 Z" fill="#1a1a1a" opacity="0.1" />
                    </g>
                    <path d="M0,260 L40,200 L70,120 L110,40 L135,80 L160,15 L195,70 L230,0 L240,0 L240,260 Z" fill="#D65A0A" opacity="0.75" />
                    <rect x="0" y="0" width="240" height="260" fill="url(#hatchLanding)" opacity="0.35" clipPath="url(#shapeClipLanding)" />
                  </svg>
                </div>
                <div className={s.miniUtilContent}>
                  <p className={s.miniUtilEyebrow}>Your Company&apos;s</p>
                  <p className={s.miniUtilTitle}>Budget Utilization</p>
                  <div className={s.miniUtilDivider} />
                  <div className={s.miniUtilInner}>
                    <div className={s.miniUtilLeft}>
                      <p className={s.miniUtilLabel}>Overall Spend</p>
                      <div className={s.miniUtilBarRow}>
                        <div className={s.miniUtilTrack}>
                          <div className={s.miniUtilFill} style={{ width: "62%" }} />
                        </div>
                        <span className={s.miniUtilPct}>62%</span>
                      </div>
                      <p className={s.miniUtilMeta}>$29,760 spent &middot; $48,000 budget</p>
                    </div>
                    <div className={s.miniUtilDividerV} />
                    <div className={s.miniUtilRight}>
                      <svg viewBox="0 0 36 36" className="w-full h-full">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(0 0% 0% / 0.08)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(152 60% 40%)" strokeWidth="3" strokeDasharray="60.4 97" strokeDashoffset="24.3" strokeLinecap="round" />
                      </svg>
                      <div className={s.miniUtilDonutCenter}>
                        <span className={s.miniUtilScore}>78</span>
                        <span className={s.miniUtilScoreLabel}>Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini activity feed card */}
              <div className={s.miniActivityCard}>
                <div className={s.miniActivityHeader}>
                  <div className={s.miniActivityDot} />
                  <span className={s.miniActivityTitle}>Live Activity</span>
                </div>
                {[
                  { merchant: "Home Depot", cat: "Materials", amt: "-$347.20" },
                  { merchant: "Lowe\u0027s", cat: "Materials", amt: "-$128.50" },
                  { merchant: "City Permits", cat: "Permits", amt: "-$450.00" },
                ].map((tx) => (
                  <div key={tx.merchant} className={s.miniActivityRow}>
                    <div>
                      <p className={s.miniActivityMerchant}>{tx.merchant}</p>
                      <p className={s.miniActivityCat}>{tx.cat}</p>
                    </div>
                    <span className={s.miniActivityAmt}>{tx.amt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Image */}
            <div className={s.contractorsImage}>
              <Image
                src="/images/contractor.jpg"
                alt="Contractor on job site"
                fill
                sizes="(max-width: 1024px) 100vw, 340px"
                className="object-cover"
              />
            </div>

            {/* Right: Content block */}
            <div className={s.contractorsContent}>
              <div className={s.contractorsContentInner}>
                <p className={s.contractorsEyebrow}>For Contractors</p>
                <h2 className={s.contractorsHeading}>
                  Stop chasing payments.
                </h2>
                <div className={s.contractorsDesc}>
                  <p>
                    Get paid faster with real-time budget transparency. Your clients
                    watch every dollar as it&apos;s spent — eliminating disputes
                    before they start.
                  </p>
                  <p>
                    No more invoices, no more receipt tracking. Swipe your virtual
                    card, and everything logs automatically. Win more bids by
                    offering full visibility from day one.
                  </p>
                </div>
                <Button variant="pill" asChild>
                  <Link href="/sign-up">Start your first project &rarr;</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* For Clients */}
        <section id="for-clients" className={s.clientsSection}>
          <div className={s.clientsWrap}>
            {/* Left: Content block */}
            <div className={s.clientsContent}>
              <div className={s.clientsContentInner}>
                <p className={s.clientsEyebrow}>For Clients</p>
                <h2 className={s.clientsHeading}>
                  See where every dollar goes.
                </h2>
                <div>
                  <p className={s.clientsQuoteText}>
                    &ldquo;I finally know where my money goes. Every purchase shows
                    up in seconds — no more wondering, no more waiting for
                    invoices.&rdquo;
                  </p>
                  <p className={s.clientsQuoteAttrib}>
                    — Sarah M., Homeowner
                  </p>
                </div>
                <Button variant="pill" asChild>
                  <Link href="/sign-up">Get Started &rarr;</Link>
                </Button>
              </div>
            </div>

            {/* Center: Image */}
            <div className={s.clientsImage}>
              <Image
                src="/images/client.jpg"
                alt="Homeowner reviewing budget on phone"
                fill
                sizes="(max-width: 1024px) 100vw, 280px"
                className="object-cover"
              />
            </div>

            {/* Right: Stacked feature cards */}
            <div className={s.clientsCards}>
              {[
                { icon: "visibility", title: "Live Feed", desc: "Every purchase appears within seconds." },
                { icon: "lock", title: "Protected Funds", desc: "Money held by Stripe with category caps." },
                { icon: "swap_horiz", title: "Change Orders", desc: "Budget changes need your approval." },
                { icon: "verified_user", title: "Audit Trail", desc: "Receipts, transactions — all exportable." },
              ].map((item) => (
                <div key={item.title} className={s.clientCard}>
                  <Icon name={item.icon} className={s.clientCardIcon} />
                  <div>
                    <h4 className={s.clientCardTitle}>{item.title}</h4>
                    <p className={s.clientCardDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer (merged with trust/Stripe) */}
      <footer className={s.footer}>
        <div className={s.footerTrust}>
          <h2 className={s.trustTitle}>
            Powered by Stripe.
            <br />
            Bank-grade security.
          </h2>
          <p className={s.trustDesc}>
            All funds held in FDIC-insured accounts through Stripe — the same
            payments platform used by Amazon, Google, and millions of businesses.
          </p>
        </div>
        <div className={s.footerInner}>
          <div>
            <h2 className={s.footerBrand}>VisiBill</h2>
            <span className={s.footerSub}>Financial transparency for construction</span>
          </div>
          <div className={s.footerLinks}>
            <a href="#how-it-works" className={s.footerLink}>How It Works</a>
            <a href="#for-contractors" className={s.footerLink}>Contractors</a>
            <a href="#for-clients" className={s.footerLink}>Clients</a>
          </div>
          <p className={s.footerCopyright}>
            &copy; {new Date().getFullYear()} VisiBill Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
