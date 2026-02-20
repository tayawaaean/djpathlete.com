import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getProfileByUserId,
  updateProfile,
  createProfile,
} from "@/lib/db/client-profiles"
import { questionnaireSchema } from "@/lib/validators/questionnaire"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getProfileByUserId(session.user.id)
    if (!profile) {
      return NextResponse.json({ profile: null })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Questionnaire GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const parsed = questionnaireSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Build the goals string from selected goals + training background + preferences
    const goalParts: string[] = []
    if (data.goals.length > 0) {
      goalParts.push(`Goals: ${data.goals.join(", ")}`)
    }
    if (data.training_background) {
      goalParts.push(`Training background: ${data.training_background}`)
    }
    if (data.exercise_likes) {
      goalParts.push(`Likes: ${data.exercise_likes}`)
    }
    if (data.exercise_dislikes) {
      goalParts.push(`Dislikes: ${data.exercise_dislikes}`)
    }
    if (data.additional_notes) {
      goalParts.push(`Notes: ${data.additional_notes}`)
    }

    const profileUpdates = {
      goals: goalParts.join(" | "),
      experience_level: data.experience_level,
      training_years: data.training_years ?? null,
      injuries: data.injuries_text || null,
      injury_details: data.injury_details,
      available_equipment: data.available_equipment as string[],
      preferred_day_names: data.preferred_day_names,
      preferred_training_days: data.preferred_day_names.length,
      preferred_session_minutes: data.preferred_session_minutes,
      time_efficiency_preference: data.time_efficiency_preference ?? null,
      preferred_techniques: data.preferred_techniques ?? [],
    }

    // Check if profile exists; if not, create one first
    const existingProfile = await getProfileByUserId(userId)

    if (!existingProfile) {
      const newProfile = await createProfile({
        user_id: userId,
        date_of_birth: null,
        gender: null,
        sport: null,
        position: null,
        experience_level: profileUpdates.experience_level,
        goals: profileUpdates.goals,
        injuries: profileUpdates.injuries,
        height_cm: null,
        weight_kg: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        available_equipment: profileUpdates.available_equipment,
        preferred_day_names: profileUpdates.preferred_day_names,
        preferred_session_minutes: profileUpdates.preferred_session_minutes,
        preferred_training_days: profileUpdates.preferred_training_days,
        time_efficiency_preference: profileUpdates.time_efficiency_preference,
        preferred_techniques: profileUpdates.preferred_techniques,
        injury_details: profileUpdates.injury_details,
        training_years: profileUpdates.training_years,
      })
      return NextResponse.json({ profile: newProfile })
    }

    const updated = await updateProfile(userId, profileUpdates)
    return NextResponse.json({ profile: updated })
  } catch (error) {
    console.error("Questionnaire POST error:", error)
    return NextResponse.json(
      { error: "Failed to save questionnaire" },
      { status: 500 }
    )
  }
}
