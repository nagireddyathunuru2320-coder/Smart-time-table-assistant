import { NextRequest, NextResponse } from "next/server";
import { backendUrl, getSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const days = request.nextUrl.searchParams.get("days") ?? "14";

  const backendResponse = await fetch(
    backendUrl(`/schedule/generate-study-plan?days=${days}`),
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}

