import { createServerSupabaseClient } from "@/lib/supabase"

// Check if a user is rate limited
export async function checkLoginRateLimit(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current login attempts for this email
    const { data, error } = await supabase
      .from("login_attempts")
      .select("attempt_count, blocked_until")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error("Error checking rate limit:", error)
      return { blocked: false, remainingAttempts: 5 }
    }

    // If no record exists, user has all attempts available
    if (!data) {
      return { blocked: false, remainingAttempts: 5 }
    }

    // Check if user is blocked
    if (data.blocked_until && new Date(data.blocked_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(data.blocked_until).getTime() - new Date().getTime()) / (1000 * 60))
      return {
        blocked: true,
        remainingAttempts: 0,
        minutesRemaining,
      }
    }

    // If block has expired, reset the counter
    if (data.blocked_until && new Date(data.blocked_until) <= new Date()) {
      await supabase.from("login_attempts").delete().eq("email", email.toLowerCase())

      return { blocked: false, remainingAttempts: 5 }
    }

    // Calculate remaining attempts
    const remainingAttempts = Math.max(0, 5 - data.attempt_count)
    return {
      blocked: false,
      remainingAttempts,
    }
  } catch (error) {
    console.error("Error in checkLoginRateLimit:", error)
    // Default to not blocked in case of error
    return { blocked: false, remainingAttempts: 5 }
  }
}

// Record a failed login attempt
export async function recordFailedLoginAttempt(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current attempts
    const { data, error } = await supabase
      .from("login_attempts")
      .select("id, attempt_count")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error("Error getting login attempts:", error)
      return false
    }

    if (!data) {
      // Create new record
      const { error: insertError } = await supabase.from("login_attempts").insert([
        {
          email: email.toLowerCase(),
          attempt_count: 1,
          last_attempt_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Error creating login attempt record:", insertError)
        return false
      }

      return true
    }

    // Increment attempt count
    const newCount = data.attempt_count + 1

    // If this is the 5th attempt, block the user
    if (newCount >= 5) {
      const blockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const { error: updateError } = await supabase
        .from("login_attempts")
        .update({
          attempt_count: newCount,
          last_attempt_at: new Date().toISOString(),
          blocked_until: blockedUntil.toISOString(),
        })
        .eq("id", data.id)

      if (updateError) {
        console.error("Error updating login attempts:", updateError)
        return false
      }

      return true
    }

    // Just increment the counter
    const { error: updateError } = await supabase
      .from("login_attempts")
      .update({
        attempt_count: newCount,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (updateError) {
      console.error("Error updating login attempts:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in recordFailedLoginAttempt:", error)
    return false
  }
}

// Reset login attempts after successful login
export async function resetLoginAttempts(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete the login attempts record
    const { error } = await supabase.from("login_attempts").delete().eq("email", email.toLowerCase())

    if (error) {
      console.error("Error resetting login attempts:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in resetLoginAttempts:", error)
    return false
  }
}
