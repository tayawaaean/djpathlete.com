import { tool } from "ai"
import { z } from "zod"
import { getClients } from "@/lib/db/users"
import { getProfileByUserId } from "@/lib/db/client-profiles"
import { parseProfileSummary } from "@/lib/profile-utils"
import { generateProgramSync } from "@/lib/ai/orchestrator"
import type { ClientProfile } from "@/types/database"

export function getProgramChatTools(userId: string) {
  return {
    list_clients: tool({
      description:
        "Fetch the list of all clients. Use when the admin mentions a client by name or wants to see available clients.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const clients = await getClients()
          return {
            clients: clients.map((c) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`.trim(),
              email: c.email,
            })),
            summary: `Found ${clients.length} client${clients.length !== 1 ? "s" : ""}.`,
          }
        } catch (error) {
          return {
            clients: [],
            summary: `Failed to load clients: ${error instanceof Error ? error.message : "Unknown error"}`,
          }
        }
      },
    }),

    lookup_client_profile: tool({
      description:
        "Fetch a specific client's questionnaire profile data including goals, experience level, equipment, injuries, and schedule preferences. Use after identifying which client the program is for.",
      inputSchema: z.object({
        client_id: z.string().uuid().describe("The client's UUID"),
        client_name: z.string().describe("The client's name for reference"),
      }),
      execute: async ({ client_id, client_name }) => {
        try {
          const profile = await getProfileByUserId(client_id)
          if (!profile) {
            return {
              found: false,
              client_id,
              client_name,
              summary: `No questionnaire data found for ${client_name}. You'll need to ask about their goals, experience, and schedule manually.`,
            }
          }

          const summary = parseProfileSummary(profile as ClientProfile)
          return {
            found: true,
            client_id,
            client_name,
            summary: `Loaded profile for ${client_name}.`,
            profile: {
              goals: summary.goals,
              experience_level: summary.experienceLevel,
              training_years: summary.trainingYears,
              movement_confidence: summary.movementConfidence,
              sessions_per_week: summary.preferredTrainingDays,
              session_minutes: summary.preferredSessionMinutes,
              preferred_day_names: summary.preferredDayNames,
              time_efficiency: summary.timeEfficiencyPreference,
              preferred_techniques: summary.preferredTechniques,
              available_equipment: summary.availableEquipment,
              injuries: summary.injuries,
              injury_details: summary.injuryDetails,
              sport: summary.sport,
              gender: summary.gender,
              date_of_birth: summary.dateOfBirth,
              sleep_hours: summary.sleepHours,
              stress_level: summary.stressLevel,
              occupation_activity_level: summary.occupationActivityLevel,
              exercise_likes: summary.likes,
              exercise_dislikes: summary.dislikes,
              training_background: summary.trainingBackground,
              additional_notes: summary.notes,
            },
          }
        } catch (error) {
          return {
            found: false,
            client_id,
            client_name,
            summary: `Error loading profile for ${client_name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          }
        }
      },
    }),

    generate_program: tool({
      description:
        "Generate a training program using the collected parameters. Only call this when you have confirmed the parameters with the admin. At minimum you need: goals (at least one), duration_weeks, and sessions_per_week. The generation takes 30-90 seconds.",
      inputSchema: z.object({
        client_id: z
          .string()
          .uuid()
          .nullish()
          .describe("Client UUID if building for a specific client"),
        goals: z
          .array(z.string().min(1))
          .min(1)
          .describe(
            "Fitness goals: weight_loss, muscle_gain, endurance, flexibility, sport_specific, general_health"
          ),
        duration_weeks: z
          .number()
          .int()
          .min(1)
          .max(52)
          .describe("Program duration in weeks"),
        sessions_per_week: z
          .number()
          .int()
          .min(1)
          .max(7)
          .describe("Training sessions per week"),
        session_minutes: z
          .number()
          .int()
          .min(15)
          .max(180)
          .optional()
          .describe("Duration of each session in minutes, default 60"),
        split_type: z
          .enum([
            "full_body",
            "upper_lower",
            "push_pull_legs",
            "push_pull",
            "body_part",
            "movement_pattern",
            "custom",
          ])
          .optional()
          .describe("Training split type, omit to let AI decide"),
        periodization: z
          .enum(["linear", "undulating", "block", "reverse_linear", "none"])
          .optional()
          .describe("Periodization approach, omit to let AI decide"),
        tier: z
          .enum(["generalize", "premium"])
          .optional()
          .describe(
            "Program tier: generalize (logging only) or premium (AI coaching feedback)"
          ),
        additional_instructions: z
          .string()
          .max(2000)
          .optional()
          .describe("Any special instructions from the admin"),
        equipment_override: z
          .array(z.string())
          .optional()
          .describe("Available equipment list from client profile"),
        is_public: z
          .boolean()
          .optional()
          .describe("Whether the program is visible in the store, default false"),
      }),
      execute: async (params) => {
        console.log("[program-chat-tools:generate_program] Starting generation with params:", JSON.stringify(params, null, 2))
        try {
          const request = {
            client_id: params.client_id ?? undefined,
            goals: params.goals,
            duration_weeks: params.duration_weeks,
            sessions_per_week: params.sessions_per_week,
            session_minutes: params.session_minutes,
            split_type: params.split_type,
            periodization: params.periodization,
            tier: params.tier,
            additional_instructions: params.additional_instructions,
            equipment_override: params.equipment_override,
            is_public: params.is_public ?? false,
          }
          console.log("[program-chat-tools:generate_program] Calling generateProgramSync...")
          const result = await generateProgramSync(request, userId)
          console.log("[program-chat-tools:generate_program] Success! program_id:", result.program_id)

          return {
            success: true,
            program_id: result.program_id,
            validation_pass: result.validation.pass,
            validation_summary: result.validation.summary,
            warnings: result.validation.issues.filter((i) => i.type === "warning")
              .length,
            errors: result.validation.issues.filter((i) => i.type === "error")
              .length,
            duration_ms: result.duration_ms,
            tokens_used: result.token_usage.total,
            retries: result.retries,
            summary: `Program generated successfully in ${Math.round(result.duration_ms / 1000)}s.`,
          }
        } catch (error) {
          console.error("[program-chat-tools:generate_program] FAILED:", error)
          console.error("[program-chat-tools:generate_program] Error type:", error?.constructor?.name)
          console.error("[program-chat-tools:generate_program] Error message:", error instanceof Error ? error.message : String(error))
          if (error instanceof Error && error.stack) {
            console.error("[program-chat-tools:generate_program] Stack:", error.stack)
          }
          return {
            success: false,
            program_id: null,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error during generation",
            summary: "Program generation failed.",
          }
        }
      },
    }),
  }
}
