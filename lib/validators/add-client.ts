import { z } from "zod"

export const addClientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
})

export type AddClientInput = z.infer<typeof addClientSchema>
