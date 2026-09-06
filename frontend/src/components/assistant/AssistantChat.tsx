"use client";

import { useEffect, useRef, useState } from "react";
import { type AssistantMessage, sendAssistantMessage } from "@/lib/assistant-api";

const SUGGESTIONS = [
  "Add a task to finish my essay by friday, high priority",
  "Schedule a meeting from 2pm to 4pm tomorrow",
  "When am I free this week?",
  "Generate my study plan",
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
    <div className="glass-panel flex h-[calc(100vh-160px)] flex-col rounded-2xl shadow-sm">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="font-display text-lg text-ink">Ask me to schedule something</p>
            <p className="max-w-sm text-sm text-ink-soft">
              I can add tasks and events, check your free time, or generate a study plan —
              I&apos;ll always confirm before creating anything.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-ink-faint/25 px-4 py-2 text-sm text-ink-soft hover:border-navy hover:text-navy"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-navy text-white"
                    : m.validation_status === "awaiting_confirmation"
                      ? "bg-brass-light/50 text-ink"
                      : "bg-paper-dim text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-paper-dim px-4 py-2.5 text-sm text-ink-soft">
                Thinking...
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-6 mb-2 rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>
      )}

      {awaitingConfirmation && (
        <div className="flex gap-2 px-6 pb-2">
          <button
            onClick={() => send("yes")}
            className="rounded-md bg-navy px-3 py-1.5 text-sm text-white hover:bg-navy-dark"
          >
            Confirm
          </button>
          <button
            onClick={() => send("cancel")}
            className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim"
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-ink-faint/15 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to schedule something..."
          className="flex-1 rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
