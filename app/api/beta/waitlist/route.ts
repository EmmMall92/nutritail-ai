import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

const MAX_TEXT_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BETA_PLAN = {
  accessPlan: "limited_beta_v1",
  accountLimit: 1,
  petLimit: 3,
  monthlyAnalysisLimit: 20,
};

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanEmail(value: unknown) {
  return cleanText(value, 254).toLowerCase();
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "";
  return request.headers.get("x-real-ip") ?? "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const name = cleanText(body.name, 120);
    const role = cleanText(body.role, 120);
    const pets = cleanText(body.pets, 300);
    const goal = cleanText(body.goal, 300);
    const website = cleanText(body.website, 300);

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Γράψε ένα έγκυρο email για τη beta λίστα." },
        { status: 400 }
      );
    }

    if (website) {
      return NextResponse.json({
        success: true,
        message: "Σε βάλαμε στη beta λίστα. Θα επικοινωνήσουμε όταν ανοίξει το επόμενο κύμα πρόσβασης.",
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("admin_activity_logs").insert({
      id,
      action: "beta_waitlist_signup",
      entity_type: "beta_waitlist",
      entity_id: id,
      message: "New beta waitlist signup.",
      metadata: {
        source: "public_beta_page",
        ...BETA_PLAN,
        email,
        name,
        role,
        pets,
        goal,
        ip: cleanText(getRequestIp(request), 80),
        userAgent: cleanText(request.headers.get("user-agent"), 300),
      },
      created_at: now,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Σε βάλαμε στη beta λίστα. Θα επικοινωνήσουμε όταν ανοίξει το επόμενο κύμα πρόσβασης.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Δεν μπορέσαμε να καταγράψουμε τη beta εγγραφή.",
      },
      { status: 500 }
    );
  }
}
