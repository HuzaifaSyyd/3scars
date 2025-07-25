"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"
import type { AuthUser } from "./auth"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setUser(null)
        } else if (session?.user) {
          await fetchUserData(session.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserData(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        await fetchUserData(session.user)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserData = async (authUser: User) => {
    try {
      // Get vendor data from our vendors table
      const { data: vendor, error } = await supabase.from("vendors").select("*").eq("id", authUser.id).single()

      if (error) {
        console.error("Error fetching vendor data:", error)
        // If vendor doesn't exist, create it
        const { error: insertError } = await supabase.from("vendors").insert({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || "",
          phone: authUser.user_metadata?.phone || null,
        })

        if (insertError) {
          console.error("Error creating vendor:", insertError)
          return
        }

        // Retry getting vendor data
        const { data: newVendor, error: retryError } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (retryError || !newVendor) {
          console.error("Error retrying vendor fetch:", retryError)
          return
        }

        setUser({
          id: newVendor.id,
          email: newVendor.email,
          full_name: newVendor.full_name,
          phone: newVendor.phone,
          profile_photo: newVendor.profile_photo,
        })
      } else {
        setUser({
          id: vendor.id,
          email: vendor.email,
          full_name: vendor.full_name,
          phone: vendor.phone,
          profile_photo: vendor.profile_photo,
        })
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
