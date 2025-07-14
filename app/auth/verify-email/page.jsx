"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setVerificationStatus("error")
      setMessage("Invalid verification link")
    }
  }, [token])

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await response.json()

      if (response.ok) {
        setVerificationStatus("success")
        setMessage(data.message)
        toast({
          title: "Email verified successfully",
          description: "You can now login to your account",
        })
      } else {
        setVerificationStatus("error")
        setMessage(data.error || "Verification failed")
      }
    } catch (error) {
      setVerificationStatus("error")
      setMessage("An error occurred during verification")
    }
  }

  const getIcon = () => {
    switch (verificationStatus) {
      case "loading":
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case "error":
        return <XCircle className="h-12 w-12 text-red-600" />
      default:
        return <Mail className="h-12 w-12 text-primary" />
    }
  }

  const getTitle = () => {
    switch (verificationStatus) {
      case "loading":
        return "Verifying your email..."
      case "success":
        return "Email verified successfully!"
      case "error":
        return "Verification failed"
      default:
        return "Email verification"
    }
  }

  const getDescription = () => {
    switch (verificationStatus) {
      case "loading":
        return "Please wait while we verify your email address."
      case "success":
        return "Your email has been verified. You can now login to your account."
      case "error":
        return message || "There was an error verifying your email address."
      default:
        return "Verifying your email address..."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-6 w-6" />
            <span className="font-bold">CarDealer</span>
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-6">{getIcon()}</div>
          </div>
          <CardTitle className="text-2xl text-center">{getTitle()}</CardTitle>
          <CardDescription className="text-center">{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {verificationStatus === "success" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Welcome to CarDealer! You can now access all features of your account.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Continue to Login</Link>
              </Button>
            </div>
          )}
          {verificationStatus === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The verification link may have expired or is invalid. Please try signing up again or contact support.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href="/auth/signup">Sign Up Again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {verificationStatus !== "loading" && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Need help?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact support
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
