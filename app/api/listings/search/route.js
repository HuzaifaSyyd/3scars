import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Listing from "@/models/Listing"
import { getServerSession } from "@/lib/auth"

export async function GET(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ listings: [] })
    }

    // Search in multiple fields
    const searchQuery = {
      vendorId: session.userId,
      $or: [
        { registrationNumber: { $regex: query, $options: "i" } },
        { make: { $regex: query, $options: "i" } },
        { model: { $regex: query, $options: "i" } },
        { vin: { $regex: query, $options: "i" } },
      ],
    }

    const listings = await Listing.find(searchQuery).sort({ createdAt: -1 }).limit(10)

    return NextResponse.json({ listings })
  } catch (error) {
    console.error("Search listings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
