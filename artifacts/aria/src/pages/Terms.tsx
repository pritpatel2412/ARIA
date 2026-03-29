import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Zap } from "lucide-react";

export function Terms() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC]">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-[#4B5563] font-mono text-sm mb-10">Last updated: March 26, 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            content: `By accessing or using ARIA ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.\n\nARIA is provided by ARIA Inc. ("we," "us," or "our"). These Terms constitute a legally binding agreement between you and ARIA Inc.`,
          },
          {
            title: "2. Description of Service",
            content: `ARIA is an AI-powered autonomous agent platform that browses the web, processes information, and performs digital tasks on your behalf. The Service includes:\n\n- AI-powered web research and synthesis\n- Autonomous job search and application assistance\n- Financial data analysis\n- Form completion automation\n- Content creation assistance\n- Calendar and email management (where integrated)`,
          },
          {
            title: "3. Account Requirements",
            content: `To use ARIA, you must:\n\n- Have a valid Replit account\n- Be at least 13 years of age (18+ for financial features)\n- Provide accurate account information\n- Maintain the security of your account\n\nYou are responsible for all activity that occurs under your account. Notify us immediately at security@aria-agent.ai if you suspect unauthorized access.`,
          },
          {
            title: "4. Acceptable Use",
            content: `You may not use ARIA to:\n\n- Violate any applicable law or regulation\n- Infringe on the intellectual property rights of others\n- Submit fraudulent job applications or misrepresent your identity\n- Scrape or extract data from websites in violation of their terms of service\n- Send spam, phishing emails, or other unsolicited communications\n- Attempt to circumvent rate limits or access controls\n- Use the Service to harm, harass, or deceive others\n- Generate or distribute malicious content\n\nWe reserve the right to suspend or terminate accounts that violate these terms.`,
          },
          {
            title: "5. Job Application and Automation Features",
            content: `When using ARIA's Career Copilot or Form Executor features:\n\n- You are responsible for the accuracy of your resume and any information submitted on your behalf\n- ARIA acts as your agent; you remain legally responsible for all applications submitted\n- You must ensure all applications comply with the target employer's requirements\n- Do not use auto-apply features to submit fraudulent or misleading applications\n- We do not guarantee job placement or application success`,
          },
          {
            title: "6. Subscription and Billing",
            content: `Paid plans are billed monthly in advance. By subscribing, you authorize us to charge your payment method on a recurring basis.\n\n- Free plans: Subject to daily query limits\n- Paid plans: Billed on the same date each month\n- Cancellation: Effective at the end of the current billing period\n- Refunds: 7-day money-back guarantee on first payment only\n- Price changes: 30-day notice via email before any price increases`,
          },
          {
            title: "7. Disclaimer of Warranties",
            content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT:\n\n- The Service will be uninterrupted or error-free\n- AI-generated research or answers will be accurate or complete\n- Autonomous agents will successfully complete all tasks\n- The Service will meet your specific requirements\n\nAI systems can make mistakes. Always verify important information independently.`,
          },
          {
            title: "8. Limitation of Liability",
            content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARIA INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS OR DATA, ARISING FROM YOUR USE OF THE SERVICE.\n\nOur total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.`,
          },
          {
            title: "9. Intellectual Property",
            content: `- ARIA's platform, code, branding, and AI models are owned by ARIA Inc.\n- Content you create using ARIA remains yours\n- Research outputs and synthesized answers are generated for your use\n- You grant us a license to process your inputs to provide the Service`,
          },
          {
            title: "10. Modifications and Termination",
            content: `We may modify these Terms at any time. We will provide 30 days notice for material changes. Continued use constitutes acceptance.\n\nWe may terminate or suspend your account for violations of these Terms, with or without notice. You may delete your account at any time from your account settings.`,
          },
          {
            title: "11. Governing Law",
            content: `These Terms are governed by the laws of Delaware, USA. Any disputes shall be resolved through binding arbitration in Delaware, except for injunctive relief which may be sought in any court of competent jurisdiction.`,
          },
          {
            title: "12. Contact",
            content: `For questions about these Terms, contact:\n\nlegal@aria-agent.ai\n\nARIA Inc., 1234 Innovation Way, San Francisco, CA 94105`,
          },
        ].map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-[#00FF88]">{section.title}</h2>
            <div className="text-[#9CA3AF] text-sm leading-relaxed space-y-2">
              {section.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="border-t border-[#1E1E2E] px-4 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00FF88]" />
            <span className="font-mono font-bold text-sm">ARIA</span>
          </div>
          <div className="flex gap-6 text-sm font-mono text-[#4B5563]">
            <Link href="/privacy" className="hover:text-[#9CA3AF]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
