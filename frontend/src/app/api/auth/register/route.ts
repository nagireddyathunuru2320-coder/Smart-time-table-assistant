import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(backendUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let data: any = {};
    try {
      data = await backendResponse.json();
    } catch {
      data = { detail: "Invalid response from server" };
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (err) {
    return NextResponse.json(
      { detail: "Backend server is unreachable. Please make sure the backend is running on port 8000." },
      { status: 503 }
    );
  }
}