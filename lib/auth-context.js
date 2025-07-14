"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Account created successfully",
          description: "You can now login with your credentials",
        })
        return data
      } else {
        throw new Error(data.error || "Signup failed")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message,
      })
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })

        // Redirect based on role
        if (data.user.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/vendor/dashboard")
        }

        return data.user
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        setUser(null)
        router.push("/")
        toast({
          title: "Logged out successfully",
          description: "You have been logged out",
        })
      } else {
        throw new Error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      })
      throw error
    }
  }

  const resetPassword = async (email) => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Password reset email sent",
          description: data.message,
        })
        return data
      } else {
        throw new Error(data.error || "Password reset failed")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message,
      })
      throw error
    }
  }

  const value = {
    user,
    signup,
    login,
    logout,
    resetPassword,
    loading,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
