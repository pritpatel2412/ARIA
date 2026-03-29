import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Linkedin, Twitter, Copy, Check, ExternalLink, Loader2,
  Image as ImageIcon, ChevronDown, ChevronUp, Sparkles, Send
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface ContentPackage {
  topic: string;
  insights: string[];
  contentPillar: string;
  imagePrompt: string;
  linkedin: { post: string; hashtags: string[]; charCount: number };
  twitter: { thread: string[] };
  summary: string;
}

interface SocialAccount {
  platform: string;
  platformUsername?: string;
  platformName?: string;
}

interface PublishState {
  linkedin: "idle" | "publishing" | "done" | "error";
  twitter: "idle" | "publishing" | "done" | "error";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="flex items-center gap-1 text-[10px] font-mono text-[#4B5563] hover:text-[#00FF88] transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-[#00FF88]" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

interface ContentPublisherProps {
  content: ContentPackage;
  accounts: SocialAccount[];
  linkedinConfigured: boolean;
  twitterConfigured: boolean;
}

export function ContentPublisher({ content, accounts, linkedinConfigured, twitterConfigured }: ContentPublisherProps) {
  const [activeTab, setActiveTab] = useState<"linkedin" | "twitter">("linkedin");
  const [publishState, setPublishState] = useState<PublishState>({ linkedin: "idle", twitter: "idle" });
  const [publishedUrls, setPublishedUrls] = useState<{ linkedin?: string; twitter?: string }>({});
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [publishError, setPublishError] = useState<{ platform: string; msg: string } | null>(null);

  const linkedinAccount = accounts.find((a) => a.platform === "linkedin");
  const twitterAccount = accounts.find((a) => a.platform === "twitter");

  const generateImage = async () => {
    setGeneratingImage(true);
    try {
      const res = await fetch(`${BASE_URL}/api/content/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: content.imagePrompt }),
      });
      const data = (await res.json()) as { success: boolean; imageBase64?: string; mimeType?: string };
      if (data.success && data.imageBase64) {
        setGeneratedImage(`data:${data.mimeType ?? "image/png"};base64,${data.imageBase64}`);
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  const publish = async (platform: "linkedin" | "twitter") => {
    setPublishState((s) => ({ ...s, [platform]: "publishing" }));
    setPublishError(null);

    const postContent = platform === "linkedin" ? content.linkedin.post : content.twitter.thread;

    try {
      const res = await fetch(`${BASE_URL}/api/content/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform, content: postContent, topic: content.topic }),
      });
      const data = (await res.json()) as { success?: boolean; url?: string; error?: string; message?: string };

      if (data.success) {
        setPublishState((s) => ({ ...s, [platform]: "done" }));
        if (data.url) setPublishedUrls((u) => ({ ...u, [platform]: data.url }));
      } else {
        throw new Error(data.message ?? data.error ?? "Publish failed");
      }
    } catch (err) {
      setPublishState((s) => ({ ...s, [platform]: "error" }));
      setPublishError({ platform, msg: (err as Error).message });
    }
  };

  const tabs = [
    { id: "linkedin" as const, label: "LinkedIn", icon: <Linkedin className="w-3.5 h-3.5" />, color: "#0A66C2" },
    { id: "twitter" as const, label: "Twitter / X", icon: <Twitter className="w-3.5 h-3.5" />, color: "#1DA1F2" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-sm font-bold text-[#F8FAFC] font-mono">{content.topic}</h3>
          </div>
          <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider">
            {content.contentPillar.replace(/_/g, " ")} · Ready to publish
          </p>
        </div>
        {/* Image generation */}
        <button
          onClick={generateImage}
          disabled={generatingImage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E1E2E] bg-[#0D0D14] text-[10px] font-mono text-[#4B5563] hover:border-[#F59E0B]/30 hover:text-[#F59E0B] transition-colors disabled:opacity-50"
        >
          {generatingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
          {generatingImage ? "Generating..." : generatedImage ? "Regenerate" : "AI Image"}
        </button>
      </div>

      {/* Insights */}
      {content.insights.length > 0 && (
        <div className="rounded-xl border border-[#1E1E2E] bg-[#0D0D14] p-3">
          <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-wider mb-2">Research insights</p>
          <div className="space-y-1">
            {content.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
                <p className="text-[11px] font-mono text-[#9CA3AF]">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated image */}
      <AnimatePresence>
        {generatedImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl overflow-hidden border border-[#1E1E2E]"
          >
            <img src={generatedImage} alt="AI-generated content image" className="w-full object-cover max-h-48" />
            <div className="px-3 py-2 bg-[#0D0D14] flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#4B5563]">AI-generated image · attach when publishing</span>
              <a href={generatedImage} download="aria-content-image.png" className="text-[9px] font-mono text-[#00FF88] hover:underline">Download</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform tabs */}
      <div className="rounded-xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden">
        <div className="flex border-b border-[#1E1E2E]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold transition-all ${
                activeTab === tab.id
                  ? "border-b-2 text-[#F8FAFC]"
                  : "text-[#4B5563] hover:text-[#9CA3AF]"
              }`}
              style={{ borderColor: activeTab === tab.id ? tab.color : "transparent" }}
            >
              <span style={{ color: activeTab === tab.id ? tab.color : undefined }}>{tab.icon}</span>
              {tab.label}
              {(activeTab === tab.id ? publishState[tab.id] : publishState[tab.id]) === "done" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
              )}
            </button>
          ))}
        </div>

        {/* LinkedIn content */}
        {activeTab === "linkedin" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#4B5563] uppercase tracking-wider">LinkedIn Post</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-[#374151]">{content.linkedin.charCount} chars</span>
                <CopyButton text={content.linkedin.post} />
              </div>
            </div>
            <pre className="text-xs font-mono text-[#9CA3AF] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto scrollbar-thin">
              {content.linkedin.post}
            </pre>
            <div className="flex flex-wrap gap-1.5">
              {content.linkedin.hashtags.map((tag) => (
                <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/20">
                  {tag}
                </span>
              ))}
            </div>
            <PublishButton
              platform="linkedin"
              account={linkedinAccount}
              configured={linkedinConfigured}
              state={publishState.linkedin}
              publishedUrl={publishedUrls.linkedin}
              error={publishError?.platform === "linkedin" ? publishError.msg : undefined}
              onPublish={() => void publish("linkedin")}
            />
          </div>
        )}

        {/* Twitter content */}
        {activeTab === "twitter" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#4B5563] uppercase tracking-wider">Thread · {content.twitter.thread.length} tweets</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setThreadExpanded((v) => !v)}
                  className="flex items-center gap-1 text-[10px] font-mono text-[#4B5563] hover:text-[#9CA3AF]"
                >
                  {threadExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {threadExpanded ? "Collapse" : "Expand all"}
                </button>
                <CopyButton text={content.twitter.thread.join("\n\n---\n\n")} />
              </div>
            </div>
            <div className="space-y-2">
              {(threadExpanded ? content.twitter.thread : content.twitter.thread.slice(0, 2)).map((tweet, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 flex items-center justify-center text-[8px] font-mono text-[#1DA1F2] shrink-0">
                      {i + 1}
                    </div>
                    {i < content.twitter.thread.length - 1 && <div className="w-px flex-1 bg-[#1E1E2E] mt-1 min-h-[12px]" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-xs font-mono text-[#9CA3AF] leading-relaxed">{tweet}</p>
                    <p className="text-[9px] font-mono text-[#374151] mt-0.5">{tweet.length}/280</p>
                  </div>
                </div>
              ))}
              {!threadExpanded && content.twitter.thread.length > 2 && (
                <button onClick={() => setThreadExpanded(true)} className="text-[10px] font-mono text-[#4B5563] hover:text-[#9CA3AF]">
                  +{content.twitter.thread.length - 2} more tweets...
                </button>
              )}
            </div>
            <PublishButton
              platform="twitter"
              account={twitterAccount}
              configured={twitterConfigured}
              state={publishState.twitter}
              publishedUrl={publishedUrls.twitter}
              error={publishError?.platform === "twitter" ? publishError.msg : undefined}
              onPublish={() => void publish("twitter")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PublishButton({
  platform,
  account,
  configured,
  state,
  publishedUrl,
  error,
  onPublish,
}: {
  platform: "linkedin" | "twitter";
  account?: SocialAccount;
  configured: boolean;
  state: "idle" | "publishing" | "done" | "error";
  publishedUrl?: string;
  error?: string;
  onPublish: () => void;
}) {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (state === "done") {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#00FF88]/5 border border-[#00FF88]/20">
        <div className="flex items-center gap-2 text-xs font-mono text-[#00FF88]">
          <Check className="w-3.5 h-3.5" />
          Published successfully!
        </div>
        {publishedUrl && (
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-mono text-[#4B5563] hover:text-[#00FF88]">
            <ExternalLink className="w-3 h-3" /> View post
          </a>
        )}
      </div>
    );
  }

  if (!configured) {
    const label = platform === "linkedin" ? "LinkedIn" : "Twitter/X";
    return (
      <div className="p-3 rounded-xl border border-[#1E1E2E] bg-[#0A0A0F] text-center">
        <p className="text-[10px] font-mono text-[#4B5563] mb-2">{label} API not configured · set {platform === "linkedin" ? "LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET" : "TWITTER_CLIENT_ID + TWITTER_CLIENT_SECRET"} in secrets</p>
        <button className="text-[10px] font-mono text-[#374151] cursor-not-allowed px-3 py-1.5 rounded-lg border border-[#1E1E2E]">
          Connect {label}
        </button>
      </div>
    );
  }

  if (!account) {
    return (
      <a
        href={`${BASE}/api/content/oauth/${platform}/start`}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-mono font-semibold border transition-all ${
          platform === "linkedin"
            ? "border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10"
            : "border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
        }`}
      >
        {platform === "linkedin" ? <Linkedin className="w-3.5 h-3.5" /> : <Twitter className="w-3.5 h-3.5" />}
        Connect {platform === "linkedin" ? "LinkedIn" : "Twitter/X"} to publish
      </a>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#4B5563]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
        Connected as {account.platformName ?? account.platformUsername ?? platform}
      </div>
      {error && (
        <p className="text-[10px] font-mono text-red-400 bg-red-400/5 border border-red-400/20 rounded-lg px-2 py-1.5">{error}</p>
      )}
      <button
        onClick={onPublish}
        disabled={state === "publishing"}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-mono font-semibold transition-all disabled:opacity-60 ${
          platform === "linkedin"
            ? "bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"
            : "bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90"
        }`}
      >
        {state === "publishing" ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...</>
        ) : (
          <><Send className="w-3.5 h-3.5" /> Publish to {platform === "linkedin" ? "LinkedIn" : "Twitter/X"}</>
        )}
      </button>
    </div>
  );
}
