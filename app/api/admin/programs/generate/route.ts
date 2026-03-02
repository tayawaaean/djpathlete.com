import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { aiGenerationRequestSchema } from "@/lib/validators/ai-generation"
import { getAdminFirestore } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const result = aiGenerationRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Create Firestore job doc — Firebase Function picks it up via onDocumentCreated
    const db = getAdminFirestore()
    const jobRef = db.collection("ai_jobs").doc()

    await jobRef.set({
      type: "program_generation",
      status: "pending",
      input: {
        request: result.data,
        requestedBy: session.user.id,
      },
      result: null,
      error: null,
      userId: session.user.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json(
      {
        jobId: jobRef.id,
        status: "pending",
      },
      { status: 202 }
    )
  } catch (error) {
    console.error("[generate] Failed to create AI job:", error)

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during program generation."

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
