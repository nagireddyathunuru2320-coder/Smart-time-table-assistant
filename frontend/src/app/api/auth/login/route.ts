import { NextRequest, NextResponse } from "next/server";
import { backendUrl, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(backendUrl("/auth/login"), {
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

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    if (data.access_token) {
      await setSessionCookie(data.access_token);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { detail: "Backend server is unreachable. Please make sure the backend is running on port 8000." },
      { status: 503 }
    );
  }
}