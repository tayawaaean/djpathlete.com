import { initializeApp } from "firebase-admin/app"
import { onDocumentCreated } from "firebase-functions/v2/firestore"
import { defineSecret } from "firebase-functions/params"

// Initialize Firebase Admin
initializeApp()

// Define secrets
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY")
const supabaseUrl = defineSecret("SUPABASE_URL")
const supabaseServiceRoleKey = defineSecret("SUPABASE_SERVICE_ROLE_KEY")

const allSecrets = [anthropicApiKey, supabaseUrl, supabaseServiceRoleKey]

// ─── Program Generation ────────────────────────────────────────────────────────
// Triggered when a new ai_jobs doc is created with type "program_generation"
// Runs the full 3-agent orchestration pipeline

export const programGeneration = onDocumentCreated(
  {
    document: "ai_jobs/{jobId}",
    timeoutSeconds: 540,
    memory: "1GiB",
    region: "us-central1",
    secrets: allSecrets,
  },
  async (event) => {
    const data = event.data?.data()
    if (!data || data.type !== "program_generation") return

    const { handleProgramGeneration } = await import("./program-generation.js")
    await handleProgramGeneration(event.params.jobId)
  }
)

// ─── Program Chat Builder ──────────────────────────────────────────────────────
// Triggered when a new ai_jobs doc is created with type "program_chat"
// Multi-turn conversation with tool use (list clients, lookup profile, generate program)

export const programChat = onDocumentCreated(
  {
    document: "ai_jobs/{jobId}",
    timeoutSeconds: 540,
    memory: "1GiB",
    region: "us-central1",
    secrets: allSecrets,
  },
  async (event) => {
    const data = event.data?.data()
    if (!data || data.type !== "program_chat") return

    const { handleProgramChat } = await import("./program-chat.js")
    await handleProgramChat(event.params.jobId)
  }
)

// ─── Admin AI Chat ─────────────────────────────────────────────────────────────
// Triggered when a new ai_jobs doc is created with type "admin_chat"
// Streaming admin business intelligence chat

export const adminChat = onDocumentCreated(
  {
    document: "ai_jobs/{jobId}",
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "us-central1",
    secrets: allSecrets,
  },
  async (event) => {
    const data = event.data?.data()
    if (!data || data.type !== "admin_chat") return

    const { handleAdminChat } = await import("./admin-chat.js")
    await handleAdminChat(event.params.jobId)
  }
)

// ─── Client AI Coach ───────────────────────────────────────────────────────────
// Triggered when a new ai_jobs doc is created with type "ai_coach"
// Two-phase: streams coaching text, then structured analysis

export const aiCoach = onDocumentCreated(
  {
    document: "ai_jobs/{jobId}",
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "us-central1",
    secrets: allSecrets,
  },
  async (event) => {
    const data = event.data?.data()
    if (!data || data.type !== "ai_coach") return

    const { handleAiCoach } = await import("./ai-coach.js")
    await handleAiCoach(event.params.jobId)
  }
)
