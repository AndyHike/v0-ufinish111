import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: string
      first_name?: string | null
      last_name?: string | null
      phone?: string | null
      address?: string | null
      email_verified?: boolean | null
      remonline_id?: number | null
      created_at?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}
