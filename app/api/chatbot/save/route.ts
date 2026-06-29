import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy chatbot save is no longer available. Use /api/account/chatbot/save from the authenticated account flow.",
      replacement: "/api/account/chatbot/save",
    },
    { status: 410 }
  );
}
