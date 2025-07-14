import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Listing from "@/models/Listing"
import mongoose from "mongoose"

export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id, imageId } = await params

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(imageId)) {
      return new NextResponse("Invalid ID", { status: 400 })
    }

    const listing = await Listing.findById(id)
    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 })
    }

    const image = listing.images.id(imageId)
    if (!image || !image.data) {
      return new NextResponse("Image not found", { status: 404 })
    }

    // Return the image with proper headers
    return new NextResponse(image.data, {
      status: 200,
      headers: {
        "Content-Type": image.contentType || "image/jpeg",
        "Content-Length": image.size?.toString() || image.data.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Get image error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
