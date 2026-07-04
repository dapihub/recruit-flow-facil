import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  MessageSquare, Send, Hash, Briefcase, Search, Plus, ChevronDown, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useJobs } from "@/hooks/useJobs";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  at: string;
};

type Channel = {
  id: string;
  name: string;
  type: "general" | "job";
  jobId?: string;
};

function useChatMessages(channelId: string) {
  const key = `themis:chat-global:${channelId}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
  });

  function send(msg: ChatMessage) {
    const next = [...messages, msg];
    setMessages(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  return { messages, send };
}

function ChatPage() {
  const { profile } = useAuth();
  const { data: jobs = [] } = useJobs();
  const [activeChannelId, setActiveChannelId] = useState("geral");
  const [jobsOpen, setJobsOpen] = useState(true);
  const [search, setSearch] = useState("");

  const generalChannels: Channel[] = [
    { id: "geral", name: "geral", type: "general" },
    { id: "financeiro", name: "financeiro", type: "general" },
    { id: "equipe", name: "equipe", type: "general" },
  ];

  const jobChannels: Channel[] = jobs
    .filter((j) => ["open", "screening", "interviewing", "proposal"].includes(j.status))
    .map((j) => ({
      id: `job-${j.id}`,
      name: j.title,
      type: "job" as const,
      jobId: j.id,
    }));

  const filteredJobs = jobChannels.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeChannel =
    generalChannels.find((c) => c.id === activeChannelId) ??
    jobChannels.find((c) => c.id === activeChannelId) ??
    generalChannels[0];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Chat" subtitle="Comunicação da equipe" />
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Sidebar */}
        <aside
          className="w-60 shrink-0 flex flex-col overflow-y-auto"
          style={{ borderRight: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar canal..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
            </div>
          </div>

          {/* General channels */}
          <div className="px-3 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-1 py-1" style={{ color: "var(--fg-muted)" }}>
              Canais
            </p>
            {generalChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${activeChannelId !== ch.id ? "hover:bg-[var(--border)]" : ""}`}
                style={
                  activeChannelId === ch.id
                    ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", fontWeight: 600 }
                    : { color: "var(--fg-muted)" }
                }
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>

          {/* Job channels */}
          <div className="px-3">
            <button
              onClick={() => setJobsOpen(!jobsOpen)}
              className="w-full flex items-center justify-between px-1 py-1"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
                Vagas
              </p>
              {jobsOpen ? (
                <ChevronDown className="w-3 h-3" style={{ color: "var(--fg-muted)" }} />
              ) : (
                <ChevronRight className="w-3 h-3" style={{ color: "var(--fg-muted)" }} />
              )}
            </button>
            {jobsOpen && (
              <div className="space-y-0.5">
                {filteredJobs.length === 0 && (
                  <p className="px-2 py-2 text-xs" style={{ color: "var(--fg-muted)" }}>
                    Nenhuma vaga ativa
                  </p>
                )}
                {filteredJobs.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors"
                    style={
                      activeChannelId === ch.id
                        ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", fontWeight: 600 }
                        : { color: "var(--fg-muted)" }
                    }
                  >
                    <Briefcase className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <ChatArea
          key={activeChannelId}
          channel={activeChannel}
          profile={profile}
        />
      </div>
    </div>
  );
}

function ChatArea({
  channel,
  profile,
}: {
  channel: Channel;
  profile: { id: string; name?: string | null } | null;
}) {
  const { messages, send } = useChatMessages(channel.id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    send({
      id: crypto.randomUUID(),
      text: text.trim(),
      sender: profile?.name ?? "Eu",
      senderId: profile?.id ?? "me",
      at: new Date().toISOString(),
    });
    setText("");
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
      {/* Channel header */}
      <div
        className="flex items-center gap-2.5 px-5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)", height: "var(--header-h)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
        >
          {channel.type === "general" ? (
            <Hash className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          ) : (
            <Briefcase className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--fg)" }}>{channel.name}</p>
          <p className="text-[11px] leading-tight" style={{ color: "var(--fg-muted)" }}>
            {channel.type === "job" ? "Canal da vaga" : "Canal geral da equipe"}
          </p>
        </div>
        {messages.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #10b981 12%, transparent)", color: "#10b981" }}>
              {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: "var(--bg)" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
            >
              <MessageSquare className="w-7 h-7" style={{ color: "var(--accent)", opacity: 0.8 }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--fg)" }}>
              Início do canal #{channel.name}
            </p>
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Seja o primeiro a enviar uma mensagem aqui
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === profile?.id;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;

          return (
            <div key={msg.id} className={showSender ? "mt-4" : "mt-1"}>
              {showSender && (
                <div className="flex items-baseline gap-2 mb-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: isMe ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "color-mix(in srgb, #6b7280 12%, transparent)", color: isMe ? "var(--accent)" : "#6b7280" }}
                  >
                    {msg.sender.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{msg.sender}</span>
                  <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                    {format(new Date(msg.at), "HH:mm")}
                  </span>
                </div>
              )}
              <div className="pl-8">
                <p
                  className="text-sm inline-block px-3 py-1.5 rounded-xl"
                  style={{
                    background: isMe ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--fg)",
                  }}
                >
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Mensagem em #${channel.name}`}
          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-lg transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
