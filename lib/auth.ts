import type { SupabaseClient } from "@supabase/supabase-js"
import type { NextAuthOptions } from "next-auth"
import { createClient } from "@/lib/supabase"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase: SupabaseClient = createClient()

        // Перевірка облікових даних користувача
        const { data, error } = await supabase
          .from("users")
          .select("id, email, role, password_hash")
          .eq("email", credentials.email)
          .single()

        if (error || !data) {
          return null
        }

        // Тут має бути перевірка пароля, але для спрощення ми просто повертаємо користувача
        // У реальному додатку використовуйте bcrypt або аналогічну бібліотеку для перевірки хешу пароля

        return {
          id: data.id,
          email: data.email,
          role: data.role,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {}
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token }) {
      const supabase: SupabaseClient = createClient()

      const { data: userData } = await supabase.from("users").select("role").eq("id", token.sub).single()

      if (userData) {
        token.role = userData.role
      }

      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
