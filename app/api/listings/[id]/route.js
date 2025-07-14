import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Listing from "@/models/Listing"
import { getServerSession } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 })
    }

    const listing = await Listing.findById(id).select("-images.data -documents.data").lean()

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (session.role !== "admin" && listing.vendorId.toString() !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      listing,
    })
  } catch (error) {
    console.error("Get listing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const data = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 })
    }

    const listing = await Listing.findById(id)
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (session.role !== "admin" && listing.vendorId.toString() !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Convert numeric fields
    if (data.year) data.year = Number.parseInt(data.year)
    if (data.mileage) data.mileage = Number.parseInt(data.mileage)
    if (data.price) data.price = Number.parseInt(data.price)

    // Clean string fields
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "string") {
        data[key] = data[key].trim()
      }
    })

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true },
    )
      .select("-images.data -documents.data")
      .lean()

    return NextResponse.json({
      success: true,
      message: "Listing updated successfully",
      listing: updatedListing,
    })
  } catch (error) {
    console.error("Update listing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 })
    }

    const listing = await Listing.findById(id)
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (session.role !== "admin" && listing.vendorId.toString() !== session.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    await Listing.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    })
  } catch (error) {
    console.error("Delete listing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
