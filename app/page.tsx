"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard by default
    router.push("/dashboard")
  }, [router])

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <div className="flex items-center space-x-3">
              
              <img
                src="/3slogo.jpg"
                alt="3S-CARS"
                className="h-16"
                
              />
              
            </div>
        </div>
      </div>
    </AuthGuard>
  )
}
