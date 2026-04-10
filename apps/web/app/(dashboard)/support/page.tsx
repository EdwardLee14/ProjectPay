import { redirect } from "next/navigation";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import s from "./support.module.css";
import shared from "@/styles/shared.module.css";

const gettingStartedSteps = [
  {
    icon: "add_circle",
    title: "Create a Project",
    description:
      "Define your project budget with categories, set spending limits, and organize everything before work begins.",
  },
  {
    icon: "share",
    title: "Share with Client",
    description:
      "Invite your client to review the budget breakdown. They can approve and fund the project directly.",
  },
  {
    icon: "visibility",
    title: "Track Spending",
    description:
      "Every transaction is tracked in real time. Both you and your client can see exactly where every dollar goes.",
  },
];

const faqs = [
  {
    question: "How do I create a new project?",
    answer:
      "Navigate to Projects from the sidebar and click New Project. You can define your budget by adding categories with individual spending limits. Once your budget is set, share it with your client for approval.",
  },
  {
    question: "How does the virtual card work?",
    answer:
      "Each project gets a dedicated Stripe Issuing virtual card. When you make a purchase, the transaction is automatically categorized and tracked against your budget categories in real time.",
  },
  {
    question: "What happens when a budget category runs out?",
    answer:
      "When a budget category is fully spent, the card will decline transactions in that category. As a contractor, you can submit a top-up request to your client explaining why additional funds are needed.",
  },
  {
    question: "How do change orders work?",
    answer:
      "Contractors can submit change orders with a justification for budget adjustments. The client receives a notification and can approve or reject the request. Approved changes update the budget immediately.",
  },
  {
    question: "How does my client see spending?",
    answer:
      "Clients have access to a real-time dashboard showing all transactions, budget utilization, and spending trends. They also receive push notifications for large transactions and budget threshold alerts.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Absolutely. Stripe handles all payment processing and card issuing. Your data is protected with bank-level encryption and full PCI compliance. Funds are securely held by Stripe until spent.",
  },
];

export default async function SupportPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  return (
    <main className={shared.dashboardPage}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={shared.eyebrow}>Support</p>
          <h1 className={shared.pageTitle}>
            <span className="font-normal">Help &amp;</span>{" "}
            <strong>Support</strong>
          </h1>
        </div>
      </div>

      {/* Getting Started */}
      <section>
        <h2 className={s.sectionTitle}>Getting Started</h2>
        <div className={s.stepsGrid}>
          {gettingStartedSteps.map((step, i) => (
            <div key={step.title} className={s.stepCard}>
              <div className={s.stepInner}>
                <p className={s.stepNumber}>Step {i + 1}</p>
                <div className="flex items-center gap-2">
                  <Icon
                    name={step.icon}
                    className="text-xl text-primary flex-shrink-0"
                  />
                  <p className={s.stepTitle}>{step.title}</p>
                </div>
                <p className={s.stepDesc}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className={s.sectionTitle}>Frequently Asked Questions</h2>
        <div className={s.faqGrid}>
          {faqs.map((faq) => (
            <div key={faq.question} className={s.faqCard}>
              <div className={s.faqAccent} />
              <div className={s.faqBody}>
                <p className={s.faqQuestion}>{faq.question}</p>
                <p className={s.faqAnswer}>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className={s.contactCard}>
          <div className="flex items-center gap-3 mb-3">
            <Icon name="mail" className="text-2xl text-white" />
          </div>
          <h2 className={s.contactTitle}>Need more help?</h2>
          <p className={s.contactDesc}>Reach out to our team</p>
          <a href="mailto:support@visibill.co" className={s.contactLink}>
            <Icon name="mail" className="text-lg" />
            support@visibill.co
          </a>
        </div>
      </section>
    </main>
  );
}
