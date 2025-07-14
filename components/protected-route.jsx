"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
      } else if (requiredRole && user.role !== requiredRole) {
        // Redirect based on role
        if (user.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/vendor/dashboard")
        }
      }
    }
  }, [user, loading, router, requiredRole])

  if (loading || !user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return children
}
