import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Linkedin, Twitter, CheckCircle2, Link2, BarChart2, TrendingUp } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SocialAccount {
  platform: string;
  platformUsername?: string;
  platformName?: string;
  expiresAt?: string;
}

interface AccountsResponse {
  accounts: SocialAccount[];
  linkedinConfigured: boolean;
  twitterConfigured: boolean;
}

interface ContentConnectProps {
  onAccountsLoaded?: (accounts: SocialAccount[], configured: { linkedin: boolean; twitter: boolean }) => void;
}

export function ContentConnect({ onAccountsLoaded }: ContentConnectProps) {
  const { colors } = useTheme();
  const [data, setData] = useState<AccountsResponse>({ accounts: [], linkedinConfigured: false, twitterConfigured: false });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  const fetchAccounts = () => {
    fetch(`${BASE_URL}/api/content/accounts`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: AccountsResponse) => {
        setData(d);
        setLoading(false);
        onAccountsLoaded?.(d.accounts, { linkedin: d.linkedinConfigured, twitter: d.twitterConfigured });
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
    pollRef.current = window.setInterval(fetchAccounts, 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const linkedinAccount = data.accounts.find((a) => a.platform === "linkedin");
  const twitterAccount = data.accounts.find((a) => a.platform === "twitter");
  const anyConnected = !!linkedinAccount || !!twitterAccount;

  const platforms = [
    {
      id: "linkedin" as const,
      label: "LinkedIn",
      icon: <Linkedin className="w-4 h-4" />,
      color: "#0A66C2",
      account: linkedinAccount,
      configured: data.linkedinConfigured,
      oauthPath: "/api/content/oauth/linkedin/start",
      description: "Post thought leadership, career updates, and professional content",
    },
    {
      id: "twitter" as const,
      label: "Twitter / X",
      icon: <Twitter className="w-4 h-4" />,
      color: "#1DA1F2",
      account: twitterAccount,
      configured: data.twitterConfigured,
      oauthPath: "/api/content/oauth/twitter/start",
      description: "Publish threads, news takes, and real-time engagement",
    },
  ];

  if (loading) {
    return (
      <div className="w-full rounded-xl border border-[#1E1E2E] bg-[#0D0D14] p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-[#1E1E2E] rounded w-1/3" />
          <div className="h-12 bg-[#1E1E2E] rounded" />
          <div className="h-12 bg-[#1E1E2E] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Status banner */}
      <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-xs font-mono ${
        anyConnected
          ? "border-[#00FF88]/20 bg-[#00FF88]/5 text-[#00FF88]"
          : "border-[#1E1E2E] bg-[#0D0D14] text-[#6B7280]"
      }`}>
        {anyConnected ? (
          <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Social accounts connected — ARIA will publish directly after creating content</>
        ) : (
          <><Link2 className="w-3.5 h-3.5 shrink-0" /> Connect LinkedIn or Twitter to enable 1-click publishing</>
        )}
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {platforms.map((p) => (
          <div key={p.id} className="rounded-xl border border-[#1E1E2E] bg-[#0D0D14] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}
              >
                <span style={{ color: p.color }}>{p.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-semibold text-[#F8FAFC]">{p.label}</span>
                  {p.account && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                      connected
                    </span>
                  )}
                </div>
                {p.account ? (
                  <p className="text-[10px] font-mono text-[#4B5563] truncate">
                    {p.account.platformName ?? p.account.platformUsername ?? p.id}
                  </p>
                ) : (
                  <p className="text-[10px] font-mono text-[#374151] truncate">{p.description}</p>
                )}
              </div>
            </div>

            {!p.account && (
              p.configured ? (
                <a
                  href={`${BASE_URL}${p.oauthPath}`}
                  className="block w-full text-center py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all"
                  style={{
                    background: `${p.color}15`,
                    border: `1px solid ${p.color}30`,
                    color: p.color,
                  }}
                >
                  Connect {p.label}
                </a>
              ) : (
                <div className="text-[9px] font-mono text-[#374151] bg-[#0A0A0F] rounded-lg px-2 py-1.5 text-center">
                  Set {p.id === "linkedin" ? "LINKEDIN_CLIENT_ID" : "TWITTER_CLIENT_ID"} in Secrets
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* What ARIA can do */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { icon: <TrendingUp className="w-3 h-3" />, label: "Research trends", live: true },
          { icon: <Linkedin className="w-3 h-3" />, label: "Write LinkedIn posts", live: true },
          { icon: <Twitter className="w-3 h-3" />, label: "Create X threads", live: true },
          { icon: <BarChart2 className="w-3 h-3" />, label: "Track analytics", live: anyConnected },
        ].map(({ icon, label, live }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-mono"
            style={{
              borderColor: live ? `rgba(${colors.primaryRgb},0.2)` : "rgba(55,65,81,0.5)",
              color: live ? colors.primary : "#374151",
              background: live ? `rgba(${colors.primaryRgb},0.05)` : "transparent",
            }}
          >
            {icon}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
