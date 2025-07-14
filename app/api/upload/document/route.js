import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const name = formData.get("name")
    const type = formData.get("type")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File must be PDF, JPEG, JPG, or PNG" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert to base64 for frontend handling
    const base64Data = buffer.toString("base64")

    return NextResponse.json({
      message: "Document processed successfully",
      documentData: {
        type: type || "Other",
        name: name || file.name,
        data: base64Data,
        contentType: file.type,
        size: file.size,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
