import { supabase } from "./supabase"

export interface AuthUser {
  id: string
  email: string
  full_name: string
  phone?: string
  profile_photo?: string
}

export const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email verification
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    })

    if (error) throw error

    // The trigger will automatically create the vendor record
    return data
  } catch (error) {
    console.error("Sign up error:", error)
    throw error
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Sign in error:", error)
    throw error
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Get user error:", userError)
      return null
    }

    // Get vendor data from our vendors table
    const { data: vendor, error: vendorError } = await supabase.from("vendors").select("*").eq("id", user.id).single()

    if (vendorError) {
      console.error("Get vendor error:", vendorError)
      // If vendor doesn't exist, create it
      const { error: insertError } = await supabase.from("vendors").insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || "",
        phone: user.user_metadata?.phone || null,
      })

      if (insertError) {
        console.error("Insert vendor error:", insertError)
        return null
      }

      // Retry getting vendor data
      const { data: newVendor, error: retryError } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", user.id)
        .single()

      if (retryError || !newVendor) {
        console.error("Retry get vendor error:", retryError)
        return null
      }

      return {
        id: newVendor.id,
        email: newVendor.email,
        full_name: newVendor.full_name,
        phone: newVendor.phone,
        profile_photo: newVendor.profile_photo,
      }
    }

    return {
      id: vendor.id,
      email: vendor.email,
      full_name: vendor.full_name,
      phone: vendor.phone,
      profile_photo: vendor.profile_photo,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export const updateProfile = async (updates: {
  full_name?: string
  phone?: string
  profile_photo?: string
}) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("No user found")

    const { error } = await supabase.from("vendors").update(updates).eq("id", user.id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Update profile error:", error)
    throw error
  }
}

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("Update password error:", error)
    throw error
  }
}
