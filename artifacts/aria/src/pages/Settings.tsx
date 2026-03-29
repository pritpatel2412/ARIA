import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useUser } from "@/lib/useUser";
import { useTheme } from "@/context/ThemeContext";
import { getUserKeys, saveUserKey, deleteUserKey, type UserApiKeyStatus } from "@/lib/api";
import {
  User, Key, Eye, EyeOff, Check, Trash2, Zap, ExternalLink,
  ShieldCheck, AlertTriangle, ChevronRight, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Service = "tinyfish" | "groq";

interface ServiceConfig {
  id: Service;
  label: string;
  description: string;
  docsUrl: string;
  getKeyUrl: string;
  placeholder: string;
  color: string;
  icon: string;
  priority: string;
}

const SERVICES: ServiceConfig[] = [
  {
    id: "tinyfish",
    label: "TinyFish API Key",
    description: "Powers real web browsing — ARIA sends live browser agents to websites. When you set your own key, your quota is separate from the shared pool.",
    docsUrl: "https://tinyfish.ai/docs",
    getKeyUrl: "https://tinyfish.ai/dashboard",
    placeholder: "tf-••••••••••••••••",
    color: "#22D3EE",
    icon: "🐟",
    priority: "Used first for all browsing tasks",
  },
  {
    id: "groq",
    label: "Groq API Key",
    description: "Drives intent parsing and AI simulation fallback. Your own key means your rate limits are independent from the platform.",
    docsUrl: "https://console.groq.com/docs",
    getKeyUrl: "https://console.groq.com/keys",
    placeholder: "gsk_••••••••••••••••",
    color: "#F97316",
    icon: "⚡",
    priority: "Used first for all AI reasoning tasks",
  },
];

function KeyCard({
  service,
  status,
  onSaved,
  onDeleted,
}: {
  service: ServiceConfig;
  status: UserApiKeyStatus | undefined;
  onSaved: (hint: string) => void;
  onDeleted: () => void;
}) {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const isSet = status?.set ?? false;

  const handleSave = async () => {
    if (!inputValue.trim() || inputValue.trim().length < 8) {
      setErrorMsg("Key must be at least 8 characters");
      setSaveResult("error");
      return;
    }
    setSaving(true);
    setSaveResult(null);
    setErrorMsg("");
    try {
      const result = await saveUserKey(service.id, inputValue.trim());
      if (result.ok) {
        setSaveResult("success");
        setInputValue("");
        setEditing(false);
        onSaved(result.hint);
        setTimeout(() => setSaveResult(null), 3000);
      } else {
        setErrorMsg(result.error ?? "Failed to save key");
        setSaveResult("error");
      }
    } catch {
      setErrorMsg("Network error — please try again");
      setSaveResult("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      await deleteUserKey(service.id);
      setConfirmDelete(false);
      onDeleted();
    } catch {
      setErrorMsg("Failed to delete key");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#1E1E2E]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `${service.color}15`, border: `1px solid ${service.color}30` }}
          >
            {service.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">{service.label}</h3>
            <p className="text-[10px] font-mono text-[#4B5563] mt-0.5">{service.priority}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {isSet ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              ACTIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full bg-[#1E1E2E] text-[#4B5563]">
              NOT SET
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{service.description}</p>

        {/* Current key hint */}
        {isSet && !editing && (
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-[#111118] border border-[#1E1E2E]">
            <div>
              <p className="text-[10px] text-[#4B5563] font-mono mb-0.5">SAVED KEY</p>
              <p className="text-xs font-mono text-[#9CA3AF]">{status?.hint}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] font-mono px-2.5 py-1 rounded border border-[#2A2A3A] text-[#9CA3AF] hover:border-[#3A3A4A] hover:text-[#F8FAFC] transition-colors"
              >
                Replace
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
                  confirmDelete
                    ? "border-red-500/50 text-red-400 bg-red-500/10"
                    : "border-[#2A2A3A] text-[#6B7280] hover:border-red-500/30 hover:text-red-400"
                }`}
              >
                {deleting ? "..." : confirmDelete ? "Confirm?" : <Trash2 className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        {(!isSet || editing) && (
          <div className="mb-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={service.placeholder}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-full bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-2.5 pr-10 text-sm font-mono text-[#F8FAFC] placeholder-[#374151] focus:outline-none focus:border-[#2A2A3A] transition-colors"
                  style={{ fontSize: "13px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !inputValue.trim()}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all disabled:opacity-40"
                style={{ background: service.color, color: "#0A0A0F" }}
              >
                {saving ? "..." : saveResult === "success" ? <Check className="w-3.5 h-3.5" /> : "Save"}
              </button>
              {editing && (
                <button
                  onClick={() => { setEditing(false); setInputValue(""); setSaveResult(null); }}
                  className="px-3 py-2.5 rounded-xl border border-[#1E1E2E] text-[#6B7280] hover:text-[#9CA3AF] text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Result feedback */}
            <AnimatePresence>
              {saveResult === "success" && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[11px] text-green-400 font-mono mt-2 flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Key saved and encrypted securely
                </motion.p>
              )}
              {saveResult === "error" && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[11px] text-red-400 font-mono mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Get key link */}
        <a
          href={service.getKeyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-mono transition-colors hover:opacity-80"
          style={{ color: service.color }}
        >
          Get API key from {service.id === "tinyfish" ? "TinyFish dashboard" : "Groq console"}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

export function Settings() {
  const { user, loading } = useUser();
  const { colors } = useTheme();
  const [keys, setKeys] = useState<Record<string, UserApiKeyStatus>>({});
  const [keysLoading, setKeysLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "keys">("profile");

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const result = await getUserKeys();
      setKeys(result);
    } catch {
      // ignore
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadKeys();
  }, [user, loadKeys]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt as string).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const planLabel = (user?.plan as string) === "pro" ? "Pro" : (user?.plan as string) === "team" ? "Team" : "Free";
  const planColor = planLabel === "Pro" ? colors.primary : planLabel === "Team" ? colors.secondary : "#9CA3AF";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#1E1E2E] border-t-current animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B7280]">You must be signed in to view settings.</p>
        <Link href="/" className="text-sm font-mono" style={{ color: colors.primary }}>← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/app" className="flex items-center gap-1 text-xs font-mono text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to app
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#2A2A3A]" />
          <span className="text-xs font-mono text-[#6B7280]">Settings</span>
        </div>

        <h1 className="text-3xl font-bold mb-2 tracking-tight">Account Settings</h1>
        <p className="text-[#6B7280] text-sm mb-8">Manage your profile and API integrations</p>

        {/* Tab strip */}
        <div className="flex gap-1 p-1 rounded-xl border border-[#1E1E2E] bg-[#0D0D14] mb-8 w-fit">
          {(["profile", "keys"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-[#1E1E2E] text-[#F8FAFC]" : "text-[#4B5563] hover:text-[#9CA3AF]"
              }`}
            >
              {tab === "profile" ? <User className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              {tab === "profile" ? "Profile" : "API Keys"}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Avatar + name card */}
            <div className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D14] p-6 mb-5">
              <div className="flex items-center gap-4 mb-6">
                {user.profileImage ? (
                  <img
                    src={user.profileImage as string}
                    alt="Profile"
                    className="w-16 h-16 rounded-2xl object-cover border border-[#1E1E2E]"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border border-[#1E1E2E]"
                    style={{ background: `${colors.primary}15`, color: colors.primary }}
                  >
                    {((user.name as string) ?? (user.email as string) ?? "U")[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold">{(user.name as string) ?? "User"}</h2>
                  <p className="text-sm text-[#6B7280]">{(user.email as string) ?? "—"}</p>
                  {user.username && (
                    <p className="text-xs font-mono text-[#4B5563] mt-0.5">@{user.username as string}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Plan",
                    value: (
                      <span className="font-bold" style={{ color: planColor }}>
                        {planLabel}
                      </span>
                    ),
                  },
                  {
                    label: "Queries used",
                    value: <span className="font-bold">{String((user.queryCount as number) ?? 0)}</span>,
                  },
                  {
                    label: "Member since",
                    value: <span className="font-bold">{memberSince}</span>,
                  },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-[#111118] border border-[#1E1E2E]">
                    <p className="text-[10px] font-mono text-[#4B5563] mb-1">{item.label.toUpperCase()}</p>
                    <p className="text-sm text-[#F8FAFC]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan upgrade CTA */}
            {planLabel === "Free" && (
              <div
                className="rounded-2xl border p-5 flex items-center justify-between"
                style={{ borderColor: `${colors.primary}30`, background: `${colors.primary}05` }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: colors.primary }}>Upgrade to Pro</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">500 queries/day, resume storage, job auto-apply, and more</p>
                </div>
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all"
                  style={{ background: colors.primary, color: "#0A0A0F" }}
                >
                  Upgrade <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* API Keys tab */}
        {activeTab === "keys" && (
          <motion.div key="keys" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Security info banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#1E1E2E] bg-[#0D0D14]">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#F8FAFC] mb-0.5">Your keys are encrypted at rest</p>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  Keys are encrypted with AES-256-GCM before being stored. We only show a masked hint — your full key is never exposed after saving.
                  When set, your key is used with <strong className="text-[#9CA3AF]">priority over the shared pool</strong> — so your quota is always yours.
                </p>
              </div>
            </div>

            {/* Priority diagram */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#1E1E2E] bg-[#0D0D14] text-[11px] font-mono">
              <span className="text-[#4B5563]">Priority order:</span>
              <span className="px-2 py-0.5 rounded-full border border-green-500/30 text-green-400">Your key</span>
              <span className="text-[#2A2A3A]">→</span>
              <span className="px-2 py-0.5 rounded-full border border-[#2A2A3A] text-[#4B5563]">Platform primary</span>
              <span className="text-[#2A2A3A]">→</span>
              <span className="px-2 py-0.5 rounded-full border border-[#2A2A3A] text-[#4B5563]">Platform backup</span>
            </div>

            {keysLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-[#1E1E2E] border-t-current animate-spin" style={{ color: colors.primary }} />
              </div>
            ) : (
              SERVICES.map((service) => (
                <KeyCard
                  key={service.id}
                  service={service}
                  status={keys[service.id]}
                  onSaved={(hint) => setKeys((prev) => ({ ...prev, [service.id]: { set: true, hint } }))}
                  onDeleted={() => setKeys((prev) => ({ ...prev, [service.id]: { set: false, hint: "" } }))}
                />
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
