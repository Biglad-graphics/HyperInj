"use client";

import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/Icon";
import { useWalletCompat as useWallet } from "../../contexts/WalletContext";

interface LocalPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface CreatorSettings {
  requiredINJ: number;
  bio: string;
  displayName: string;
  posts: LocalPost[];
}

const DEFAULT_SETTINGS: CreatorSettings = {
  requiredINJ: 5,
  bio: "",
  displayName: "",
  posts: [],
};

const STORAGE_KEY = "HyperInj_creator_settings";

function loadSettings(): CreatorSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: CreatorSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── AI suggestion topics for the creator assistant
const PROMPT_SUGGESTIONS = [
  "Generate 3 post ideas about INJ staking",
  "Write an intro post for my creator page",
  "Suggest engagement hooks for Injective content",
  "Rewrite this as a punchy tweet thread:",
  "What on-chain metrics should I cover this week?",
];

const WS_URL = `${process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8000"}/ws/chat`;

const CreatorDashboardPage = () => {
  const { address, injBalance, isConnected, connect, connecting } = useWallet();

  const [settings, setSettings] = useState<CreatorSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"posts" | "settings" | "ai">("posts");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [requiredINJInput, setRequiredINJInput] = useState("5");
  const [bioInput, setBioInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);

  // AI panel state
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setRequiredINJInput(String(s.requiredINJ));
    setBioInput(s.bio);
    setNameInput(s.displayName);
  }, []);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // ── WebSocket for AI assistant
  useEffect(() => {
    if (activeTab !== "ai") return;
    const socket = new WebSocket(WS_URL);
    ws.current = socket;
    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "chunk") {
          const text = data.state?.supervisor?.final_output ?? data.state?.final_output ?? null;
          if (!text) return;
          setAiMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "ai") {
              return [...prev.slice(0, -1), { role: "ai", text }];
            }
            return [...prev, { role: "ai", text }];
          });
        }
        if (data.type === "final") setAiLoading(false);
        if (data.type === "error") {
          setAiLoading(false);
          setAiMessages((prev) => [...prev, { role: "ai", text: "Sorry, something went wrong. Try again." }]);
        }
      } catch {}
    };
    socket.onclose = () => setAiLoading(false);
    return () => {
      socket.close();
    };
  }, [activeTab]);

  const sendAiMessage = (text: string) => {
    if (!text.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    setAiMessages((prev) => [...prev, { role: "user", text }]);
    setAiLoading(true);
    ws.current.send(JSON.stringify({
      user_id: address ?? "anonymous",
      thread_id: "creator-ai",
      message: `You are an AI creator assistant for the Injective ecosystem. Help with: ${text}`,
      agent: "injective_analyst",
    }));
    setAiInput("");
  };

  const handleSaveSettings = () => {
    const updated: CreatorSettings = {
      ...settings,
      requiredINJ: Math.max(0, parseFloat(requiredINJInput) || 0),
      bio: bioInput,
      displayName: nameInput,
    };
    setSettings(updated);
    saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublishPost = () => {
    if (!postTitle.trim() || !postContent.trim()) return;
    const post: LocalPost = {
      id: Date.now().toString(),
      title: postTitle,
      content: postContent,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = { ...settings, posts: [post, ...settings.posts] };
    setSettings(updated);
    saveSettings(updated);
    setPostTitle("");
    setPostContent("");
  };

  const handleDeletePost = (id: string) => {
    const updated = { ...settings, posts: settings.posts.filter((p) => p.id !== id) };
    setSettings(updated);
    saveSettings(updated);
  };

  if (!isConnected) {
    return (
      <Layout title="Creator Dashboard">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 fill-theme-tertiary" name="star-plus" />
          </div>
          <h2 className="text-h5 text-theme-primary mb-2">Connect to create</h2>
          <p className="text-body-2s text-theme-secondary max-w-sm mb-6">
            Connect your Keplr wallet to access the creator dashboard, publish content, and set your access rules.
          </p>
          <button className="btn-primary h-12 px-8" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect Keplr"}
          </button>
        </div>
      </Layout>
    );
  }

  const TABS = [
    { id: "posts", label: "My Posts", icon: "news" },
    { id: "settings", label: "Access Rules", icon: "settings" },
    { id: "ai", label: "AI Assistant", icon: "star-plus" },
  ] as const;

  return (
    <Layout title="Creator Dashboard">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Creator stats */}
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          <div className="p-4 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke text-center">
            <div className="text-h5 font-bold text-theme-primary">{settings.posts.length}</div>
            <div className="text-caption-1m text-theme-secondary">Posts Published</div>
          </div>
          <div className="p-4 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke text-center">
            <div className="text-h5 font-bold text-theme-primary">{settings.requiredINJ}</div>
            <div className="text-caption-1m text-theme-secondary">INJ Required</div>
          </div>
          <div className="p-4 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke text-center">
            <div className="text-h5 font-bold text-theme-primary">{injBalance.toFixed(2)}</div>
            <div className="text-caption-1m text-theme-secondary">Your INJ Balance</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-theme-on-surface-1 rounded-xl border border-theme-stroke">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-body-2s font-medium transition-all ${
                activeTab === t.id
                  ? "bg-theme-brand text-white"
                  : "text-theme-secondary hover:text-theme-primary"
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === t.id ? "fill-white" : "fill-theme-secondary"}`} name={t.icon} />
              <span className="md:hidden">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── POSTS TAB ─────────────────────────── */}
        {activeTab === "posts" && (
          <div className="space-y-5">
            {/* New post form */}
            <div className="p-5 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke space-y-3">
              <h3 className="text-title-1s text-theme-primary">New Post</h3>
              <input
                className="w-full bg-theme-on-surface-2 border border-theme-stroke rounded-xl px-4 py-3 text-body-2s text-theme-primary placeholder:text-theme-tertiary outline-none focus:border-brand-600 transition-colors"
                placeholder="Post title…"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-theme-on-surface-2 border border-theme-stroke rounded-xl px-4 py-3 text-body-2s text-theme-primary placeholder:text-theme-tertiary outline-none focus:border-brand-600 transition-colors resize-none"
                placeholder="Write your post content…"
                rows={6}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <button
                className="btn-primary w-full"
                onClick={handlePublishPost}
                disabled={!postTitle.trim() || !postContent.trim()}
              >
                Publish Post
              </button>
            </div>

            {/* Existing posts */}
            {settings.posts.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Icon className="w-8 h-8 fill-theme-tertiary mb-3" name="news" />
                <p className="text-body-2s text-theme-secondary">No posts yet. Publish your first post above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-title-1s text-theme-primary">
                  Published <span className="text-theme-tertiary">({settings.posts.length})</span>
                </h3>
                {settings.posts.map((post) => (
                  <div key={post.id} className="p-5 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-caption-1m text-theme-tertiary mb-1">{post.createdAt}</div>
                        <h4 className="text-base-1s text-theme-primary font-semibold mb-2">{post.title}</h4>
                        <p className="text-body-2s text-theme-secondary line-clamp-3 leading-relaxed">{post.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="shrink-0 w-8 h-8 rounded-lg hover:bg-theme-red/10 flex items-center justify-center transition-colors"
                      >
                        <Icon className="w-4 h-4 fill-theme-tertiary hover:fill-theme-red" name="close" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ─────────────────────── */}
        {activeTab === "settings" && (
          <div className="p-6 rounded-2xl bg-theme-on-surface-1 border border-theme-stroke space-y-5">
            <div>
              <h3 className="text-title-1s text-theme-primary mb-1">Creator Profile</h3>
              <p className="text-body-2s text-theme-secondary">Configure how fans see your profile and what INJ they need to hold.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-caption-1m text-theme-secondary block">Display Name</label>
                <input
                  className="w-full bg-theme-on-surface-2 border border-theme-stroke rounded-xl px-4 py-3 text-body-2s text-theme-primary placeholder:text-theme-tertiary outline-none focus:border-brand-600 transition-colors"
                  placeholder="Your creator name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-caption-1m text-theme-secondary block">Bio</label>
                <textarea
                  className="w-full bg-theme-on-surface-2 border border-theme-stroke rounded-xl px-4 py-3 text-body-2s text-theme-primary placeholder:text-theme-tertiary outline-none focus:border-brand-600 transition-colors resize-none"
                  placeholder="Short description of your content…"
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-caption-1m text-theme-secondary block">Required INJ to Unlock</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full bg-theme-on-surface-2 border border-theme-stroke rounded-xl px-4 py-3 pr-16 text-body-2s text-theme-primary outline-none focus:border-brand-600 transition-colors"
                    value={requiredINJInput}
                    onChange={(e) => setRequiredINJInput(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-caption-1m text-theme-tertiary">INJ</span>
                </div>
                <p className="text-caption-1m text-theme-tertiary">
                  Fans holding at least this amount of INJ will see your full content.
                </p>
              </div>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleSaveSettings}
            >
              {saved ? "Saved ✓" : "Save Settings"}
            </button>
          </div>
        )}

        {/* ── AI ASSISTANT TAB ─────────────────── */}
        {activeTab === "ai" && (
          <div className="flex flex-col rounded-2xl bg-theme-on-surface-1 border border-theme-stroke overflow-hidden" style={{ height: "520px" }}>
            <div className="px-5 py-4 border-b border-theme-stroke shrink-0">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 fill-theme-brand" name="star-plus" />
                <h3 className="text-title-1s text-theme-primary">AI Creator Assistant</h3>
              </div>
              <p className="text-caption-1m text-theme-secondary mt-0.5">
                Generate post ideas, rewrite content, and get engagement hooks for your Injective audience.
              </p>
            </div>

            {/* Quick prompts */}
            {aiMessages.length === 0 && (
              <div className="px-5 py-4 border-b border-theme-stroke shrink-0">
                <p className="text-caption-1m text-theme-tertiary mb-2">Try a prompt:</p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendAiMessage(s)}
                      className="text-caption-1m px-3 py-1.5 rounded-lg bg-theme-on-surface-2 border border-theme-stroke text-theme-secondary hover:text-theme-primary hover:border-brand-600/40 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "gap-3"}`}>
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-theme-brand/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 fill-theme-brand" name="star-plus" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-body-2s leading-relaxed ${
                      msg.role === "user"
                        ? "bg-theme-brand text-white"
                        : "bg-theme-on-surface border border-theme-stroke text-theme-primary"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-7 h-7 rounded-full bg-theme-brand/10 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 fill-theme-brand" name="star-plus" />
                  </div>
                  <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-theme-on-surface border border-theme-stroke">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-theme-brand animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-theme-stroke shrink-0">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 bg-theme-on-surface-2 border border-theme-stroke rounded-xl px-4 py-2.5 text-body-2s text-theme-primary placeholder:text-theme-tertiary outline-none focus:border-brand-600 transition-colors"
                  placeholder="Ask the AI creator assistant…"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendAiMessage(aiInput);
                    }
                  }}
                />
                <button
                  className="w-10 h-10 rounded-xl bg-theme-brand flex items-center justify-center transition-opacity disabled:opacity-40 shrink-0"
                  disabled={!aiInput.trim() || aiLoading}
                  onClick={() => sendAiMessage(aiInput)}
                >
                  <Icon className="w-4 h-4 fill-white" name="arrow-top" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreatorDashboardPage;
