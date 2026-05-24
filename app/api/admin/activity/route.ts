import { NextResponse } from "next/server";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

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