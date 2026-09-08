import { NextResponse } from "next/server";
import { backendUrl, getSessionToken } from "@/lib/session";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const backendResponse = await fetch(backendUrl("/calendar-accounts/google/authorize-url"), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}