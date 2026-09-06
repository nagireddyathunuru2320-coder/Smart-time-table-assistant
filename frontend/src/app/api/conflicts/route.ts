import { NextRequest, NextResponse } from "next/server";
import { backendUrl, getSessionToken } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const path = statusParam ? `/conflicts?status=${statusParam}` : "/conflicts";

  const backendResponse = await fetch(backendUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}

