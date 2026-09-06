import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { AssistantChat } from "@/components/assistant/AssistantChat";

export default async function AssistantPage() {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display mb-6 text-2xl font-semibold text-ink">Assistant</h1>
        <AssistantChat />
      </div>
    </div>
  );
}
