import { NextRequest, NextResponse } from "next/server";
import { backendUrl, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(backendUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  await setSessionCookie(data.access_token);

  return NextResponse.json({ status: "ok" }, { status: 200 });
}