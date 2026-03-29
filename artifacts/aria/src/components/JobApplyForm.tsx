import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ChevronRight, ChevronLeft, Rocket, Briefcase, MapPin,
  User, Mail, Phone, Linkedin, Globe, FileText, Sparkles,
  Check, Building2, Clock
} from "lucide-react";

interface JobApplyFormProps {
  onLaunch: (goalStr: string) => void;
  isProcessing: boolean;
}

type Step = 1 | 2 | 3;

const EXPERIENCE_OPTIONS = [
  { value: "Fresher (0-1 year)", label: "Fresher", sub: "0–1 yr" },
  { value: "1-3 years", label: "1–3 yrs", sub: "Junior" },
  { value: "3-5 years", label: "3–5 yrs", sub: "Mid-level" },
  { value: "5-10 years", label: "5–10 yrs", sub: "Senior" },
  { value: "10+ years", label: "10+ yrs", sub: "Lead/Staff" },
];

const JOB_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Remote", label: "Remote" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
];

const COMPANY_TYPE_OPTIONS = [
  { value: "Startup", label: "Startup" },
  { value: "MNC/Enterprise", label: "MNC" },
  { value: "MAANG/FAANG", label: "MAANG" },
  { value: "Any company", label: "Any" },
];

const COVER_STYLES = [
  { value: "enthusiastic", label: "Enthusiastic", desc: "Energetic and passionate" },
  { value: "professional", label: "Professional", desc: "Formal and polished" },
  { value: "technical", label: "Technical", desc: "Skills-first, no fluff" },
  { value: "brief", label: "Brief", desc: "Short and punchy" },
];

const JOB_SITES = [
  { name: "Indeed", icon: "🔍", desc: "Easy Apply jobs" },
  { name: "LinkedIn", icon: "💼", desc: "Company career pages" },
  { name: "Greenhouse", icon: "🌱", desc: "ATS applications" },
  { name: "Lever", icon: "⚡", desc: "Startup ATS forms" },
  { name: "Naukri", icon: "🇮🇳", desc: "India's #1 job site" },
  { name: "Wellfound", icon: "🚀", desc: "Startup jobs" },
];

export function JobApplyForm({ onLaunch, isProcessing }: JobApplyFormProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>(1);

  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("3-5 years");
  const [jobType, setJobType] = useState("Full-time");
  const [companyTypes, setCompanyTypes] = useState<string[]>(["Startup", "Any company"]);
  const [salary, setSalary] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [resume, setResume] = useState("");
  const [coverStyle, setCoverStyle] = useState("professional");
  const [notes, setNotes] = useState("");

  const toggleCompanyType = (val: string) => {
    setCompanyTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const canNext1 = role.trim().length > 0 && location.trim().length > 0;
  const canNext2 = fullName.trim().length > 0 && email.trim().includes("@") && phone.trim().length > 0;
  const canLaunch = resume.trim().length > 50;

  const handleLaunch = () => {
    const parts = [
      `JOB_APPLY_V1`,
      `ROLE:${role}`,
      `LOCATION:${location}`,
      `EXPERIENCE:${experience}`,
      `JOB_TYPE:${jobType}`,
      `COMPANY_TYPE:${companyTypes.join("|")}`,
      salary ? `SALARY:${salary}` : null,
      `NAME:${fullName}`,
      `EMAIL:${email}`,
      `PHONE:${phone}`,
      linkedin ? `LINKEDIN:${linkedin}` : null,
      portfolio ? `PORTFOLIO:${portfolio}` : null,
      `RESUME:${resume.replace(/::/g, " ").slice(0, 800)}`,
      `COVER_STYLE:${coverStyle}`,
      notes ? `NOTES:${notes}` : null,
    ].filter(Boolean);

    onLaunch(parts.join("::"));
  };

  const primaryStyle = { color: colors.primary };
  const borderActive = { borderColor: `rgba(${colors.primaryRgb},0.5)`, backgroundColor: `rgba(${colors.primaryRgb},0.08)` };
  const borderInactive = { borderColor: "#1E1E2E" };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => { if (s < step || (s === 2 && canNext1) || (s === 3 && canNext2)) setStep(s); }}
              className="flex items-center justify-center w-7 h-7 rounded-full border text-xs font-mono font-bold transition-all"
              style={s === step ? borderActive : s < step ? { borderColor: `rgba(${colors.primaryRgb},0.3)`, backgroundColor: `rgba(${colors.primaryRgb},0.15)` } : { borderColor: "#1E1E2E", color: "#374151" }}
            >
              {s < step ? <Check className="w-3.5 h-3.5" style={primaryStyle} /> : (
                <span style={s === step ? primaryStyle : undefined}>{s}</span>
              )}
            </button>
            <span className="text-xs font-mono" style={s === step ? primaryStyle : { color: "#374151" }}>
              {s === 1 ? "Job" : s === 2 ? "You" : "Resume"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-[#1E1E2E]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Job preferences */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5" style={primaryStyle} />
              <h2 className="text-lg font-bold">What role are you looking for?</h2>
            </div>
            <p className="text-[#6B7280] text-sm font-mono">ARIA will apply across 6 platforms simultaneously</p>
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 block">Job Title / Role *</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior React Developer, Product Manager..."
              className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none transition-colors"
              style={{ borderColor: role ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
              onFocus={(e) => { e.target.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
              onBlur={(e) => { e.target.style.borderColor = role ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E"; }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, Mumbai, Remote, San Francisco..."
              className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none transition-colors"
              style={{ borderColor: location ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
              onFocus={(e) => { e.target.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
              onBlur={(e) => { e.target.style.borderColor = location ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E"; }}
            />
          </div>

          {/* Experience */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />Experience Level
            </label>
            <div className="flex gap-2 flex-wrap">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className="flex-1 min-w-[80px] px-3 py-2.5 rounded-lg border text-center transition-all"
                  style={experience === opt.value ? borderActive : borderInactive}
                >
                  <div className="text-xs font-mono font-bold" style={experience === opt.value ? primaryStyle : { color: "#9CA3AF" }}>{opt.label}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: experience === opt.value ? colors.primary : "#4B5563", opacity: 0.8 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Job type */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 block">Job Type</label>
            <div className="flex gap-2">
              {JOB_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setJobType(opt.value)}
                  className="flex-1 px-3 py-2 rounded-lg border text-xs font-mono transition-all"
                  style={jobType === opt.value ? borderActive : borderInactive}
                >
                  <span style={jobType === opt.value ? primaryStyle : { color: "#9CA3AF" }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Company type */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />Company Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {COMPANY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleCompanyType(opt.value)}
                  className="px-4 py-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5"
                  style={companyTypes.includes(opt.value) ? borderActive : borderInactive}
                >
                  {companyTypes.includes(opt.value) && <Check className="w-3 h-3" style={primaryStyle} />}
                  <span style={companyTypes.includes(opt.value) ? primaryStyle : { color: "#9CA3AF" }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Salary (optional) */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 block">Expected Salary <span className="text-[#374151]">(optional)</span></label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. 15-25 LPA, $120k-$150k, Open to negotiation..."
              className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none"
              style={{ borderColor: "#1E1E2E" }}
            />
          </div>

          <button
            onClick={() => { if (canNext1) setStep(2); }}
            disabled={!canNext1}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: canNext1 ? colors.primary : "#1E1E2E",
              color: canNext1 ? "#0A0A0F" : "#374151",
              cursor: canNext1 ? "pointer" : "not-allowed",
            }}
          >
            Next: Your Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Contact info */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 mb-2">
              <User className="w-5 h-5" style={primaryStyle} />
              <h2 className="text-lg font-bold">Your contact details</h2>
            </div>
            <p className="text-[#6B7280] text-sm font-mono">ARIA will fill these into every application form</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3" />Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none transition-colors"
                style={{ borderColor: fullName ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
                onFocus={(e) => { e.target.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
                onBlur={(e) => { e.target.style.borderColor = fullName ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E"; }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none transition-colors"
                style={{ borderColor: email.includes("@") ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
                onFocus={(e) => { e.target.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
                onBlur={(e) => { e.target.style.borderColor = email.includes("@") ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E"; }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3" />Phone *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none transition-colors"
                style={{ borderColor: phone ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
                onFocus={(e) => { e.target.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
                onBlur={(e) => { e.target.style.borderColor = phone ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E"; }}
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Linkedin className="w-3 h-3" />LinkedIn <span className="text-[#374151]">(optional)</span>
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/you"
                className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none"
                style={{ borderColor: "#1E1E2E" }}
              />
            </div>

            {/* Portfolio */}
            <div>
              <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />Portfolio/GitHub <span className="text-[#374151]">(optional)</span>
              </label>
              <input
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://github.com/you"
                className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none"
                style={{ borderColor: "#1E1E2E" }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-xl font-mono text-sm border border-[#1E1E2E] text-[#6B7280] hover:text-[#9CA3AF] transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />Back
            </button>
            <button
              onClick={() => { if (canNext2) setStep(3); }}
              disabled={!canNext2}
              className="flex-1 py-3 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: canNext2 ? colors.primary : "#1E1E2E",
                color: canNext2 ? "#0A0A0F" : "#374151",
                cursor: canNext2 ? "pointer" : "not-allowed",
              }}
            >
              Next: Resume <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Resume + cover letter */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5" style={primaryStyle} />
              <h2 className="text-lg font-bold">Your resume & preferences</h2>
            </div>
            <p className="text-[#6B7280] text-sm font-mono">This will be used to fill resume fields and generate cover letters</p>
          </div>

          {/* Resume text */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 block">
              Resume Summary *<span className="text-[#374151] ml-2 normal-case">(paste key sections or summarize your experience)</span>
            </label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder={`E.g.:
Senior React Developer with 4 years at Y Combinator-backed startups. Led a team of 5 engineers. Built real-time dashboards processing 1M+ events/day using React, TypeScript, Node.js, PostgreSQL, AWS. Increased platform performance by 60%. Previously at TechCorp as SDE-2. B.Tech CS from IIT Bombay. Key projects: ...`}
              rows={7}
              className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none resize-none transition-colors"
              style={{ borderColor: resume.length > 50 ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
              onFocus={(e) => { e.target.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
              onBlur={(e) => { e.target.style.borderColor = resume.length > 50 ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E"; }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-mono text-[#374151]">Minimum 50 characters</span>
              <span className="text-[10px] font-mono" style={{ color: resume.length > 50 ? colors.primary : "#374151" }}>{resume.length} chars</span>
            </div>
          </div>

          {/* Cover letter style */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />Cover Letter Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COVER_STYLES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCoverStyle(opt.value)}
                  className="p-2.5 rounded-lg border text-left transition-all"
                  style={coverStyle === opt.value ? borderActive : borderInactive}
                >
                  <div className="text-xs font-mono font-bold" style={coverStyle === opt.value ? primaryStyle : { color: "#9CA3AF" }}>{opt.label}</div>
                  <div className="text-[10px] font-mono mt-0.5 text-[#4B5563]">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Special notes */}
          <div>
            <label className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1.5 block">
              Special Preferences <span className="text-[#374151]">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefer startups, open to equity, no service companies, want equity compensation..."
              className="w-full px-4 py-3 rounded-xl border bg-[#0D0D14] text-sm font-mono text-[#F8FAFC] placeholder-[#374151] outline-none"
              style={{ borderColor: "#1E1E2E" }}
            />
          </div>

          {/* Launch preview */}
          {canLaunch && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: `rgba(${colors.primaryRgb},0.2)`, backgroundColor: `rgba(${colors.primaryRgb},0.04)` }}
            >
              <p className="text-xs font-mono uppercase tracking-wider mb-3" style={primaryStyle}>
                🚀 ARIA will apply across these platforms
              </p>
              <div className="grid grid-cols-3 gap-2">
                {JOB_SITES.map((site) => (
                  <div key={site.name} className="flex items-center gap-1.5 text-xs font-mono">
                    <span>{site.icon}</span>
                    <div>
                      <div className="text-[#F8FAFC] font-bold">{site.name}</div>
                      <div className="text-[#4B5563] text-[10px]">{site.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1E1E2E] text-[10px] font-mono text-[#4B5563]">
                Applying for <span style={primaryStyle} className="font-bold">{role}</span> · {location} · {experience}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3 rounded-xl font-mono text-sm border border-[#1E1E2E] text-[#6B7280] hover:text-[#9CA3AF] transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />Back
            </button>
            <button
              onClick={handleLaunch}
              disabled={!canLaunch || isProcessing}
              className="flex-1 py-3 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: canLaunch && !isProcessing ? colors.primary : "#1E1E2E",
                color: canLaunch && !isProcessing ? "#0A0A0F" : "#374151",
                cursor: canLaunch && !isProcessing ? "pointer" : "not-allowed",
              }}
            >
              <Rocket className="w-4 h-4" />
              Launch {JOB_SITES.length} Applications Simultaneously
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
