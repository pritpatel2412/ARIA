import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Zap } from "lucide-react";

export function Privacy() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC]">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-[#4B5563] font-mono text-sm mb-10">Last updated: March 26, 2026</p>

        {[
          {
            title: "1. Information We Collect",
            content: `When you use ARIA, we collect information necessary to provide our service:\n\n- **Account information**: When you sign in with Replit, we receive your user ID, display name, username, email address, and profile image from your Replit account.\n- **Usage data**: We store your ARIA session history, including the goals you submit, agent tasks generated, and synthesized answers.\n- **Resume data**: If you use the Career Copilot feature, we store your uploaded resume and the structured data extracted from it.\n- **Application data**: Records of job applications submitted through ARIA.\n- **Log data**: Standard server logs including timestamps and IP addresses for security and debugging purposes.`,
          },
          {
            title: "2. How We Use Your Information",
            content: `We use your information solely to provide and improve the ARIA service:\n\n- To authenticate you and maintain your session\n- To personalize agent responses based on your history\n- To store and retrieve your session history and resume data\n- To track your query usage for plan enforcement\n- To improve our AI models and service quality (in anonymized, aggregated form only)\n- To communicate important service updates`,
          },
          {
            title: "3. Data Storage and Security",
            content: `Your data is stored in encrypted PostgreSQL databases hosted on Replit's infrastructure. We implement industry-standard security measures including:\n\n- Encryption at rest and in transit (TLS)\n- Secure session management with HTTP-only cookies\n- No storage of API keys or sensitive credentials on the client\n- Regular security audits\n\nYour resume content and session data are never shared with third parties or used to train AI models without your explicit consent.`,
          },
          {
            title: "4. Third-Party Services",
            content: `ARIA uses the following third-party AI services to process your requests:\n\n- **Groq** (Llama 3.3 70B): For intent parsing and fallback synthesis. Your goals are sent to Groq's API for processing.\n- **Google Gemini**: For synthesizing research results. Aggregated research data may be sent to Google's API.\n- **TinyFish**: For autonomous web browsing tasks. URLs and goals are sent to TinyFish's API.\n\nEach third-party service has its own privacy policy. We recommend reviewing them. We do not sell your data to any third party.`,
          },
          {
            title: "5. Cookies and Sessions",
            content: `We use a single session cookie to maintain your login state. This cookie is:\n\n- HTTP-only (not accessible to JavaScript)\n- Scoped to our domain\n- Set to expire after 7 days of inactivity\n- Required for authenticated features\n\nWe do not use tracking cookies, analytics cookies, or advertising cookies.`,
          },
          {
            title: "6. Your Rights",
            content: `You have the right to:\n\n- **Access**: Request a copy of all data we hold about you\n- **Deletion**: Request deletion of your account and all associated data\n- **Portability**: Export your session history in JSON format\n- **Correction**: Update inaccurate information\n\nTo exercise any of these rights, contact us at privacy@aria-agent.ai`,
          },
          {
            title: "7. Data Retention",
            content: `- Session history: Retained for 1 year or until you delete your account\n- Resume data: Retained until you delete it or your account\n- Job applications: Retained for 2 years\n- Log data: Retained for 30 days\n\nWhen you delete your account, all personal data is permanently deleted within 30 days.`,
          },
          {
            title: "8. Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by displaying a prominent notice in the app. Continued use of ARIA after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: "9. Contact",
            content: `If you have questions about this Privacy Policy or our data practices, contact us at:\n\nprivacy@aria-agent.ai\n\nWe aim to respond to all privacy inquiries within 72 hours.`,
          },
        ].map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-[#00FF88]">{section.title}</h2>
            <div className="text-[#9CA3AF] text-sm leading-relaxed space-y-2">
              {section.content.split("\n\n").map((para, i) => (
                <p key={i}>{para.replace(/\*\*(.+?)\*\*/g, "$1")}</p>
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
            <Link href="/terms" className="hover:text-[#9CA3AF]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
