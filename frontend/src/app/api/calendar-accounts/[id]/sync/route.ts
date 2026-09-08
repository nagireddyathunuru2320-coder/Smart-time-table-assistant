import { NextRequest, NextResponse } from "next/server";
import { backendUrl, getSessionToken } from "@/lib/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const backendResponse = await fetch(backendUrl(`/calendar-accounts/${id}/sync`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}