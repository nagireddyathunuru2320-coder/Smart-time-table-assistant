import { NextRequest, NextResponse } from "next/server";
import { backendUrl, getSessionToken } from "@/lib/session";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const backendResponse = await fetch(backendUrl("/users/me/preferences"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}

export async function PATCH(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  const backendResponse = await fetch(backendUrl("/users/me/preferences"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}
