import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getSessionToken, backendUrl } from "@/lib/session";
import type { User } from "@/lib/types";

export const metadata: Metadata = {
  title: "Smart Timetable Assistant",
  description: "AI-powered academic scheduling and study planning platform.",
};

async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-paper text-ink">
        {user ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar user={user} />
            <div className="flex flex-1 flex-col overflow-y-auto">
              <TopBar user={user} />
              <div className="flex flex-1 flex-col">{children}</div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen flex-col">{children}</div>
        )}
      </body>
    </html>
  );
}
