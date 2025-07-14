import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Listing from "@/models/Listing"
import mongoose from "mongoose"

export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id, documentId } = await params

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const listing = await Listing.findById(id)
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    const document = listing.documents.id(documentId)
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return new NextResponse(document.data, {
      headers: {
        "Content-Type": document.contentType,
        "Content-Length": document.size.toString(),
        "Content-Disposition": `attachment; filename="${document.name}"`,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Get document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
