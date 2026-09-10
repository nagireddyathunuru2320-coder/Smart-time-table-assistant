import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { AssistantChat } from "@/components/assistant/AssistantChat";

export default async function AssistantPage() {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Assistant</h1>
          <p className="mt-1 text-xs text-ink-soft">Ask anything. Get instant help with your studies.</p>
        </div>
        <AssistantChat />
      </div>
    </div>
  );
}
