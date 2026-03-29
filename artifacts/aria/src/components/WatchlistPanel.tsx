import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, RefreshCw, ExternalLink, AlertTriangle,
  TrendingUp, TrendingDown, Bell, Shield, Clock, ChevronDown,
  ChevronUp, Eye, Loader2, DollarSign, Zap, Megaphone, Search,
  CheckCircle2, XCircle, Circle
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  getWatchlist, addWatchlistItem, removeWatchlistItem,
  checkWatchlistItem, getWatchlistChanges,
  type WatchlistItemWithChanges, type WatchlistChange
} from "@/lib/api";

const WATCH_TYPES = [
  { value: "all", label: "Full Intelligence", icon: <Search className="w-3.5 h-3.5" />, desc: "Pricing, features, announcements" },
  { value: "pricing", label: "Pricing Only", icon: <DollarSign className="w-3.5 h-3.5" />, desc: "Price changes & plan updates" },
  { value: "features", label: "Features", icon: <Zap className="w-3.5 h-3.5" />, desc: "New capabilities & updates" },
  { value: "announcements", label: "News & Blog", icon: <Megaphone className="w-3.5 h-3.5" />, desc: "Announcements & launches" },
];

const FREQUENCIES = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  critical: { color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Critical", icon: <AlertTriangle className="w-3 h-3" /> },
  high: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", label: "High", icon: <TrendingUp className="w-3 h-3" /> },
  medium: { color: "#60A5FA", bg: "rgba(96,165,250,0.1)", label: "Medium", icon: <Bell className="w-3 h-3" /> },
  low: { color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", label: "Low", icon: <Shield className="w-3 h-3" /> },
};

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const ms = Date.now() - new Date(date).getTime();
  if (ms < 60000) return "Just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function StatusDot({ status }: { status: string }) {
  if (status === "checking") return <Loader2 className="w-2.5 h-2.5 animate-spin text-[#F59E0B]" />;
  if (status === "active") return <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse" />;
  if (status === "error") return <XCircle className="w-2.5 h-2.5 text-[#F87171]" />;
  return <Circle className="w-2.5 h-2.5 text-[#374151]" />;
}

function ChangeCard({ change }: { change: WatchlistChange }) {
  const sev = SEVERITY_CONFIG[change.severity] ?? SEVERITY_CONFIG["medium"];
  return (
    <div
      className="rounded-lg border p-3 space-y-1.5"
      style={{ borderColor: `${sev.color}30`, backgroundColor: sev.bg }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: sev.color }}>{sev.icon}</span>
        <span className="text-xs font-mono font-bold" style={{ color: sev.color }}>{sev.label}</span>
        <span className="text-[10px] font-mono text-[#4B5563] ml-auto">{timeAgo(change.detectedAt)}</span>
      </div>
      <p className="text-sm font-mono font-bold text-[#F8FAFC]">{change.changeTitle}</p>
      <p className="text-xs font-mono text-[#9CA3AF] leading-relaxed">{change.changeDescription}</p>
      {change.oldValue && change.newValue && (
        <div className="flex gap-2 mt-1">
          <div className="flex-1 bg-[#F87171]/10 border border-[#F87171]/20 rounded px-2 py-1">
            <span className="text-[10px] font-mono text-[#F87171]">Before</span>
            <p className="text-xs font-mono text-[#F8FAFC] truncate">{change.oldValue}</p>
          </div>
          <div className="flex-1 bg-[#00FF88]/10 border border-[#00FF88]/20 rounded px-2 py-1">
            <span className="text-[10px] font-mono text-[#00FF88]">After</span>
            <p className="text-xs font-mono text-[#F8FAFC] truncate">{change.newValue}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorCard({
  item, onCheck, onDelete, primaryRgb, primary,
}: {
  item: WatchlistItemWithChanges;
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
  primaryRgb: string;
  primary: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [allChanges, setAllChanges] = useState<WatchlistChange[] | null>(null);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [isChecking, setIsChecking] = useState(item.status === "checking");

  const watchTypeInfo = WATCH_TYPES.find((t) => t.value === item.watchType) ?? WATCH_TYPES[0];
  const hasNewChanges = (item.recentChanges?.length ?? 0) > 0;
  const domain = (() => { try { return new URL(item.url).hostname.replace("www.", ""); } catch { return item.url; } })();

  useEffect(() => {
    if (item.status === "checking") {
      setIsChecking(true);
      const timer = setInterval(async () => {
        try {
          const data = await getWatchlist();
          const updated = data.items.find((i: WatchlistItemWithChanges) => i.id === item.id);
          if (updated && updated.status !== "checking") {
            setIsChecking(false);
            clearInterval(timer);
          }
        } catch {
          clearInterval(timer);
        }
      }, 3000);
      return () => clearInterval(timer);
    } else {
      setIsChecking(false);
    }
  }, [item.status, item.id]);

  const handleExpand = async () => {
    if (!expanded && !allChanges) {
      setLoadingChanges(true);
      try {
        const data = await getWatchlistChanges(item.id);
        setAllChanges(data.changes);
      } catch {
        setAllChanges([]);
      } finally {
        setLoadingChanges(false);
      }
    }
    setExpanded((v) => !v);
  };

  const handleCheck = () => {
    setIsChecking(true);
    onCheck(item.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: hasNewChanges ? `rgba(245,158,11,0.4)` : "#1E1E2E",
        backgroundColor: "#0D0D14",
        boxShadow: hasNewChanges ? `0 0 20px rgba(245,158,11,0.08)` : undefined,
      }}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Screenshot thumbnail */}
          {item.lastScreenshot ? (
            <img
              src={item.lastScreenshot}
              alt={item.name}
              className="w-14 h-10 rounded object-cover object-top border border-[#1E1E2E] flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-10 rounded border border-[#1E1E2E] bg-[#111118] flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-[#374151]" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusDot status={isChecking ? "checking" : item.status} />
              <span className="text-sm font-mono font-bold text-[#F8FAFC] truncate">{item.name}</span>
              {hasNewChanges && (
                <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                  {item.recentChanges?.length} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#4B5563] hover:text-[#6B7280] transition-colors flex items-center gap-0.5">
                {domain} <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border"
                style={{ color: primary, borderColor: `rgba(${primaryRgb},0.25)`, backgroundColor: `rgba(${primaryRgb},0.05)` }}>
                {watchTypeInfo.label}
              </span>
              <span className="text-[10px] font-mono text-[#374151]">
                <Clock className="w-2.5 h-2.5 inline mr-0.5" />{item.checkFrequency}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1E1E2E]">
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-[#F8FAFC]">{item.changeCount}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">changes</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-[#F8FAFC]">{timeAgo(item.lastCheckedAt)}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">last check</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all"
              style={{
                borderColor: isChecking ? "#1E1E2E" : `rgba(${primaryRgb},0.3)`,
                color: isChecking ? "#374151" : primary,
                backgroundColor: isChecking ? "transparent" : `rgba(${primaryRgb},0.06)`,
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Checking..." : "Check Now"}
            </button>
            <button
              onClick={() => handleExpand()}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#1E1E2E] text-[10px] font-mono text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              History
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg border border-[#1E1E2E] text-[#374151] hover:text-[#F87171] hover:border-[#F87171]/30 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Latest changes preview */}
        {item.recentChanges && item.recentChanges.length > 0 && (
          <div className="mt-3 space-y-2">
            {item.recentChanges.slice(0, 2).map((change) => (
              <ChangeCard key={change.id} change={change} />
            ))}
          </div>
        )}

        {/* No changes yet (fresh or no changes detected) */}
        {item.status === "active" && item.changeCount === 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-[#374151]">
            <CheckCircle2 className="w-3 h-3 text-[#00FF88]/40" />
            No changes detected since monitoring began
          </div>
        )}
      </div>

      {/* Expanded change history */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#1E1E2E] overflow-hidden"
          >
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-3">Full Change History</p>
              {loadingChanges && (
                <div className="flex items-center gap-2 text-[#4B5563] text-xs font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />Loading...
                </div>
              )}
              {allChanges && allChanges.length === 0 && (
                <p className="text-xs font-mono text-[#374151] text-center py-4">No changes detected yet</p>
              )}
              {allChanges?.map((c) => <ChangeCard key={c.id} change={c} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function WatchlistPanel() {
  const { colors } = useTheme();
  const [items, setItems] = useState<WatchlistItemWithChanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newWatchType, setNewWatchType] = useState("all");
  const [newFrequency, setNewFrequency] = useState("daily");

  const load = useCallback(async () => {
    try {
      const data = await getWatchlist();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Poll for status updates when any item is "checking"
  useEffect(() => {
    const hasChecking = items.some((i) => i.status === "checking");
    if (!hasChecking) return;
    const timer = setInterval(() => { void load(); }, 4000);
    return () => clearInterval(timer);
  }, [items, load]);

  const handleAdd = async () => {
    if (!newUrl.trim() || !newName.trim()) return;
    setAdding(true);
    try {
      await addWatchlistItem({ url: newUrl, name: newName, watchType: newWatchType, checkFrequency: newFrequency });
      setNewUrl(""); setNewName(""); setNewWatchType("all"); setNewFrequency("daily");
      setShowAddForm(false);
      await load();
    } finally {
      setAdding(false);
    }
  };

  const handleCheck = async (id: string) => {
    await checkWatchlistItem(id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "checking" } : i));
    setTimeout(() => { void load(); }, 8000);
  };

  const handleDelete = async (id: string) => {
    await removeWatchlistItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalChanges = items.reduce((sum, i) => sum + (i.changeCount ?? 0), 0);
  const activeCount = items.filter((i) => i.status === "active").length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-mono">Competitor Intelligence</h2>
          {items.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-mono text-[#4B5563]">
                <span style={{ color: colors.primary }}>{activeCount}</span> monitored
              </span>
              {totalChanges > 0 && (
                <span className="text-xs font-mono text-[#F59E0B]">
                  {totalChanges} changes detected
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all"
          style={{ backgroundColor: `rgba(${colors.primaryRgb},0.12)`, border: `1px solid rgba(${colors.primaryRgb},0.3)`, color: colors.primary }}
        >
          <Plus className="w-4 h-4" />
          Add Competitor
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: `rgba(${colors.primaryRgb},0.25)`, backgroundColor: `rgba(${colors.primaryRgb},0.04)` }}
            >
              <p className="text-xs font-mono uppercase tracking-wider" style={{ color: colors.primary }}>Add Competitor to Watch</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#6B7280] uppercase mb-1 block">Competitor Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder='e.g. "Stripe Pricing Page"'
                    className="w-full px-3 py-2 rounded-lg border bg-[#0D0D14] text-xs font-mono text-[#F8FAFC] placeholder-[#374151] outline-none"
                    style={{ borderColor: newName ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#6B7280] uppercase mb-1 block">URL to Monitor</label>
                  <input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://stripe.com/pricing"
                    className="w-full px-3 py-2 rounded-lg border bg-[#0D0D14] text-xs font-mono text-[#F8FAFC] placeholder-[#374151] outline-none"
                    style={{ borderColor: newUrl ? `rgba(${colors.primaryRgb},0.4)` : "#1E1E2E" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6B7280] uppercase mb-1.5 block">What to Watch</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WATCH_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNewWatchType(t.value)}
                      className="p-2 rounded-lg border text-left transition-all"
                      style={newWatchType === t.value
                        ? { borderColor: `rgba(${colors.primaryRgb},0.5)`, backgroundColor: `rgba(${colors.primaryRgb},0.08)` }
                        : { borderColor: "#1E1E2E" }}
                    >
                      <div className="flex items-center gap-1 mb-0.5" style={{ color: newWatchType === t.value ? colors.primary : "#9CA3AF" }}>
                        {t.icon}
                        <span className="text-[10px] font-mono font-bold">{t.label}</span>
                      </div>
                      <p className="text-[9px] font-mono text-[#4B5563]">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6B7280] uppercase mb-1.5 block">Check Frequency</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setNewFrequency(f.value)}
                      className="flex-1 py-1.5 rounded-lg border text-xs font-mono transition-all"
                      style={newFrequency === f.value
                        ? { borderColor: `rgba(${colors.primaryRgb},0.5)`, backgroundColor: `rgba(${colors.primaryRgb},0.08)`, color: colors.primary }
                        : { borderColor: "#1E1E2E", color: "#9CA3AF" }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg border border-[#1E1E2E] text-xs font-mono text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newUrl || !newName || adding}
                  className="flex-1 py-2 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: newUrl && newName && !adding ? colors.primary : "#1E1E2E",
                    color: newUrl && newName && !adding ? "#0A0A0F" : "#374151",
                  }}
                >
                  {adding ? <><Loader2 className="w-3 h-3 animate-spin" />Adding...</> : <><Plus className="w-3 h-3" />Start Monitoring</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[#4B5563]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div
          className="rounded-xl border p-10 text-center"
          style={{ borderColor: `rgba(${colors.primaryRgb},0.1)`, borderStyle: "dashed" }}
        >
          <Eye className="w-8 h-8 mx-auto mb-3 text-[#1E1E2E]" />
          <h3 className="text-sm font-bold font-mono mb-1">No competitors being monitored</h3>
          <p className="text-xs font-mono text-[#4B5563] mb-4">
            Add a competitor's pricing or features page.<br />
            ARIA will check it daily and alert you to any changes.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-[10px] font-mono text-[#374151]">
            {["stripe.com/pricing", "notion.so/pricing", "linear.app/pricing", "vercel.com/pricing"].map((ex) => (
              <button
                key={ex}
                onClick={() => { setNewUrl(`https://${ex}`); setNewName(ex.split(".")[0]!.charAt(0).toUpperCase() + ex.split(".")[0]!.slice(1)); setShowAddForm(true); }}
                className="px-2.5 py-1 rounded-full border border-[#1E1E2E] hover:border-[#374151] transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Competitor cards */}
      <AnimatePresence>
        {items.map((item) => (
          <CompetitorCard
            key={item.id}
            item={item}
            onCheck={handleCheck}
            onDelete={handleDelete}
            primaryRgb={colors.primaryRgb}
            primary={colors.primary}
          />
        ))}
      </AnimatePresence>

      {/* Info footer */}
      {items.length > 0 && (
        <div className="text-center text-[10px] font-mono text-[#374151] pt-2">
          ARIA uses real browser agents to check pages · Scheduled checks run automatically
        </div>
      )}
    </div>
  );
}
