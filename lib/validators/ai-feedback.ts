import { z } from "zod"
import { aiFeatureSchema } from "./ai-conversation"

export const adminFeedbackSchema = z.object({
  conversation_message_id: z.string().uuid(),
  accuracy_rating: z.number().int().min(1).max(5).optional(),
  relevance_rating: z.number().int().min(1).max(5).optional(),
  helpfulness_rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
  feature: aiFeatureSchema,
})

export const clientFeedbackSchema = z.object({
  conversation_message_id: z.string().uuid(),
  thumbs_up: z.boolean(),
  feature: aiFeatureSchema,
})

export type AdminFeedbackInput = z.infer<typeof adminFeedbackSchema>
export type ClientFeedbackInput = z.infer<typeof clientFeedbackSchema>
