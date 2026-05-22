import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { petRepository } from "@/repositories/petRepository";

export async function GET() {
  try {
    const currentUser = getCurrentUser();
    const pets = petRepository.getAllByOwner(currentUser.id);

    return NextResponse.json(pets);
  } catch (error) {
    console.error("GET /api/pets error:", error);

    return NextResponse.json(
      { error: "Failed to load pets." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const pet = await request.json();

    petRepository.save(pet);

    return NextResponse.json({ success: true, pet });
  } catch (error) {
    console.error("POST /api/pets error:", error);

    return NextResponse.json(
      { error: "Failed to save pet." },
      { status: 500 }
    );
  }
}