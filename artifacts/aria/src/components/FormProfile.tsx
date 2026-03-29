import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Github, Linkedin, FileText, Save, CheckCircle2, ChevronDown, ChevronUp, Pencil } from "lucide-react";

export interface FormProfileData {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  github: string;
  linkedin: string;
  extraContext: string;
}

const STORAGE_KEY = "aria-form-profile";

export function loadFormProfile(): FormProfileData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FormProfileData) : null;
  } catch {
    return null;
  }
}

export function saveFormProfile(data: FormProfileData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function buildFormContext(profile: FormProfileData): string {
  const lines: string[] = ["[FORM PROFILE — use this data to fill web forms]"];
  if (profile.fullName) lines.push(`Full Name: ${profile.fullName}`);
  if (profile.email) lines.push(`Email: ${profile.email}`);
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  if (profile.bio) lines.push(`Bio / About Me: ${profile.bio}`);
  if (profile.github) lines.push(`GitHub: ${profile.github}`);
  if (profile.linkedin) lines.push(`LinkedIn: ${profile.linkedin}`);
  if (profile.extraContext) lines.push(`Additional context: ${profile.extraContext}`);
  lines.push("[/FORM PROFILE]");
  return lines.join("\n");
}

const EMPTY: FormProfileData = {
  fullName: "",
  email: "",
  phone: "",
  bio: "",
  github: "",
  linkedin: "",
  extraContext: "",
};

interface FormProfileProps {
  onProfileReady: (profile: FormProfileData) => void;
}

export function FormProfile({ onProfileReady }: FormProfileProps) {
  const [profile, setProfile] = useState<FormProfileData>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const loaded = loadFormProfile();
    if (loaded) {
      setProfile(loaded);
      setHasProfile(true);
      onProfileReady(loaded);
    } else {
      setExpanded(true);
    }
  }, [onProfileReady]);

  const set = (key: keyof FormProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((p) => ({ ...p, [key]: e.target.value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveFormProfile(profile);
    setHasProfile(true);
    setSaved(true);
    setExpanded(false);
    onProfileReady(profile);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasRequired = profile.fullName.trim() && profile.email.trim();

  return (
    <div className="rounded-xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden">
      {/* Header — click to collapse/expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#111118] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shrink-0">
          {hasProfile ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
          ) : (
            <User className="w-3.5 h-3.5 text-[#F59E0B]" />
          )}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="text-xs font-mono font-medium text-[#F8FAFC]">
            {hasProfile ? `Profile: ${profile.fullName || profile.email}` : "Set up your form profile"}
          </div>
          <div className="text-[10px] text-[#4B5563] truncate">
            {hasProfile
              ? "Click to edit your details for auto-filling forms"
              : "Name & email required so ARIA knows what to fill"}
          </div>
        </div>
        <div className="shrink-0 text-[#4B5563]">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#1E1E2E]">
              {/* Row: Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                    Full Name *
                  </label>
                  <div className="flex items-center gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                    <User className="w-3 h-3 text-[#4B5563] shrink-0" />
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={set("fullName")}
                      placeholder="Your full name"
                      className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                    Email *
                  </label>
                  <div className="flex items-center gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                    <Mail className="w-3 h-3 text-[#4B5563] shrink-0" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={set("email")}
                      placeholder="your@email.com"
                      className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Phone + GitHub + LinkedIn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                    Phone
                  </label>
                  <div className="flex items-center gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                    <Phone className="w-3 h-3 text-[#4B5563] shrink-0" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={set("phone")}
                      placeholder="+1 (555) 000-0000"
                      className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                    GitHub
                  </label>
                  <div className="flex items-center gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                    <Github className="w-3 h-3 text-[#4B5563] shrink-0" />
                    <input
                      type="url"
                      value={profile.github}
                      onChange={set("github")}
                      placeholder="github.com/you"
                      className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                    LinkedIn
                  </label>
                  <div className="flex items-center gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                    <Linkedin className="w-3 h-3 text-[#4B5563] shrink-0" />
                    <input
                      type="url"
                      value={profile.linkedin}
                      onChange={set("linkedin")}
                      placeholder="linkedin.com/in/you"
                      className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                  Bio / About You
                </label>
                <div className="flex gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                  <FileText className="w-3 h-3 text-[#4B5563] shrink-0 mt-0.5" />
                  <textarea
                    value={profile.bio}
                    onChange={set("bio")}
                    placeholder="2-3 sentences about yourself — used for 'About you' or 'Project description' fields"
                    rows={2}
                    className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full resize-none"
                  />
                </div>
              </div>

              {/* Extra context for the current task */}
              <div>
                <label className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-1 block">
                  Extra Context (optional — specific to this task)
                </label>
                <div className="flex gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 focus-within:border-[#F59E0B]/50">
                  <Pencil className="w-3 h-3 text-[#4B5563] shrink-0 mt-0.5" />
                  <textarea
                    value={profile.extraContext}
                    onChange={set("extraContext")}
                    placeholder="e.g. 'Project name: ARIA, building an AI agent platform' or 'Applying as a solo founder'"
                    rows={2}
                    className="bg-transparent text-sm text-[#F8FAFC] placeholder-[#374151] outline-none w-full resize-none"
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!hasRequired}
                className="w-full py-2.5 rounded-lg text-sm font-mono font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: hasRequired ? "#F59E0B" : undefined,
                  border: hasRequired ? "none" : "1px solid #374151",
                  color: hasRequired ? "#0A0A0F" : "#4B5563",
                }}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Profile saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save profile & ready to fill forms
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
