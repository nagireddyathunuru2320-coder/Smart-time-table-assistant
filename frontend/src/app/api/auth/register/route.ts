import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(backendUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json();

  return NextResponse.json(data, { status: backendResponse.status });
}