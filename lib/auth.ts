import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { createServiceRoleClient } from "@/lib/supabase"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // Use service role client to bypass RLS for auth queries
        const supabase = createServiceRoleClient()
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single()

        if (error || !user) return null

        const isValid = await compare(password, user.password_hash)
        if (!isValid) return null

        console.log(`[Auth] Login: ${user.email}, role: ${user.role}`)
        return {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, set id and role from the authorize() return
      if (user) {
        token.id = user.id as string
        token.role = user.role as "admin" | "client"
      }

      // On every subsequent request, refresh role from DB to avoid stale role
      // after switching accounts (e.g., client → admin)
      if (trigger !== "signIn" && token.id) {
        try {
          const supabase = createServiceRoleClient()
          const { data } = await supabase
            .from("users")
            .select("role")
            .eq("id", token.id)
            .single()
          if (data) {
            token.role = data.role as "admin" | "client"
          }
        } catch {
          // If DB lookup fails, keep existing token role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
})
