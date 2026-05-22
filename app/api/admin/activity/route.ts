import { NextResponse } from "next/server";
import { adminActivityLogService } from "@/services/adminActivityLogService";

export async function GET() {
  try {
    const logs = await adminActivityLogService.getAll();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load activity logs.",
      },
      { status: 500 }
    );
  }
}