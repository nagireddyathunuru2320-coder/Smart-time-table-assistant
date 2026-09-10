"use client";

import { useEffect, useRef, useState } from "react";
import { type AssistantMessage, sendAssistantMessage } from "@/lib/assistant-api";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  Calendar,
  HelpCircle,
  BrainCircuit,
} from "lucide-react";

const SUGGESTIONS = [
  { label: "Explain a concept", query: "Explain a key concept from my hardest subject", icon: BrainCircuit },
  { label: "Summarize notes", query: "Help me summarize my notes for an upcoming exam", icon: FileText },
  { label: "Help with an assignment", query: "Add a task to finish my assignment by Friday", icon: HelpCircle },
  { label: "Create a study plan", query: "Generate my study plan for this week", icon: Calendar },
  { label: "Practice questions", query: "Give me study practice questions for my subjects", icon: BookOpen },
  { label: "Suggest resources", query: "Suggest resources to prepare for my exams", icon: Sparkles },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(content: string) {
    if (!content.trim()) return;
    setError(null);
    setLoading(true);
    setInput("");
    try {
      const result = await sendAssistantMessage(content, conversationId);
      setConversationId(result.conversation_id);
      setMessages((prev) => [...prev, result.user_message, result.assistant_message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  const awaitingConfirmation = messages
    .slice()
    .reverse()
    .find((m) => m.role === "assistant")?.validation_status === "awaiting_confirmation";

  return (
    <div className="glass-panel relative flex h-[calc(100vh-170px)] flex-col overflow-hidden rounded-3xl shadow-sm">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            {/* Robot Avatar inside glowing soft gradient blob */}
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-100 via-sky-100 to-indigo-100 shadow-sm ring-1 ring-teal-200/40">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-400 to-sky-400 opacity-20 blur-md" />
              <Bot size={36} className="relative z-10 text-[#0EA5E9]" />
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Hello! I&apos;m your study assistant.
            </h2>
            <p className="mt-2 max-w-md text-xs text-ink-soft leading-relaxed">
              Ask me anything about your subjects, assignments, or exam preparation. I can plan your schedule, check free time, or create tasks.
            </p>

            {/* Quick prompt suggestion chips */}
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => send(s.query)}
                    className="glass-panel flex items-center gap-2 rounded-xl p-3 text-left transition-colors hover:border-sky-300 hover:bg-white"
                  >
                    <Icon size={16} className="shrink-0 text-[#14B8A6]" />
                    <span className="text-xs font-semibold text-ink">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md whitespace-pre-line rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "gradient-accent text-white shadow-xs"
                    : m.validation_status === "awaiting_confirmation"
                      ? "border border-amber-200 bg-amber-50/90 text-ink shadow-xs"
                      : "border border-white/80 bg-white/90 text-ink shadow-xs"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-2.5 text-xs text-ink-soft shadow-xs">
                <span className="h-2 w-2 animate-ping rounded-full bg-teal-400" />
                Thinking...
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-6 mb-2 rounded-xl bg-brick-light px-4 py-2 text-xs font-medium text-brick">
          {error}
        </p>
      )}

      {awaitingConfirmation && (
        <div className="flex items-center gap-2 border-t border-ink/5 bg-paper/60 px-6 py-2.5">
          <button
            onClick={() => send("yes")}
            className="btn-specular gradient-accent rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-xs"
          >
            Confirm
          </button>
          <button
            onClick={() => send("cancel")}
            className="rounded-xl border border-ink-faint/25 bg-white px-4 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating pill input bar */}
      <div className="border-t border-ink/5 bg-white/60 p-4 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your question..."
              className="glass-input w-full rounded-full py-3 pl-5 pr-12 text-xs text-ink outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-specular gradient-accent absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-xs disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] text-ink-faint">
          Your AI study companion, always here to help.
        </p>
      </div>
    </div>
  );
}
