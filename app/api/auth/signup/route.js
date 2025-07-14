import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request) {
  try {
    await connectDB()

    const { name, email, password } = await request.json()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Create new user (email verification removed for simplicity)
    const user = new User({
      name,
      email,
      password,
      isEmailVerified: true, // Auto-verify for simplicity
    })

    await user.save()

    return NextResponse.json(
      {
        message: "User created successfully. You can now login.",
        userId: user._id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
