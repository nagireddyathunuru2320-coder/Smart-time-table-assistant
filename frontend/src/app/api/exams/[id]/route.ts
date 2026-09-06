import { NextRequest, NextResponse } from "next/server";
import { backendUrl, getSessionToken } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const backendResponse = await fetch(backendUrl(`/exams/${id}`), {
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const backendResponse = await fetch(backendUrl(`/exams/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await backendResponse.json();
  return NextResponse.json(data, { status: backendResponse.status });
}
