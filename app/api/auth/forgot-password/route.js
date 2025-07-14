import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request) {
  try {
    await connectDB()

    const { email } = await request.json()

    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: "If an account with that email exists, we have sent a password reset link.",
      })
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken()
    await user.save()

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
    }

    return NextResponse.json({
      message: "If an account with that email exists, we have sent a password reset link.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
