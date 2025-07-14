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

    const query = {}
    if (session.role !== "admin") {
      query.vendorId = session.userId
    }

    const listings = await Listing.find(query).select("-images.data -documents.data").sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      listings,
    })
  } catch (error) {
    console.error("Get listings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    const data = await request.json()

    // Process images with enhanced validation
    const processedImages = []
    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < data.images.length; i++) {
        const imageData = data.images[i]
        if (imageData && imageData.data && imageData.contentType && imageData.name) {
          try {
            // Clean base64 data - remove data URL prefix if present
            let base64Data = imageData.data
            if (base64Data.includes("base64,")) {
              base64Data = base64Data.split("base64,")[1]
            } else if (base64Data.includes(",")) {
              base64Data = base64Data.split(",")[1]
            }

            // Validate base64
            const buffer = Buffer.from(base64Data, "base64")

            if (buffer.length > 0) {
              processedImages.push({
                name: imageData.name.trim(),
                data: buffer,
                contentType: imageData.contentType,
                size: buffer.length,
                isMain: i === 0,
                uploadedAt: new Date(),
              })
            }
          } catch (error) {
            console.error("Error processing image:", imageData.name, error)
            continue
          }
        }
      }
    }

    // Process documents
    const processedDocuments = []
    if (data.documents && Array.isArray(data.documents)) {
      for (const docData of data.documents) {
        if (docData && docData.data && docData.contentType && docData.name) {
          try {
            let base64Data = docData.data
            if (base64Data.includes("base64,")) {
              base64Data = base64Data.split("base64,")[1]
            } else if (base64Data.includes(",")) {
              base64Data = base64Data.split(",")[1]
            }

            const buffer = Buffer.from(base64Data, "base64")

            if (buffer.length > 0) {
              processedDocuments.push({
                type: docData.type,
                name: docData.name.trim(),
                data: buffer,
                contentType: docData.contentType,
                size: buffer.length,
                uploadedAt: new Date(),
              })
            }
          } catch (error) {
            console.error("Error processing document:", docData.name, error)
            continue
          }
        }
      }
    }

    const listingData = {
      vendorId: session.userId,
      vendorName: session.name,
      make: data.make?.trim(),
      model: data.model?.trim(),
      year: Number.parseInt(data.year),
      registrationNumber: data.registrationNumber?.trim().toUpperCase(),
      vin: data.vin?.trim().toUpperCase(),
      mileage: Number.parseInt(data.mileage),
      price: Number.parseInt(data.price),
      color: data.color?.trim(),
      fuelType: data.fuelType?.trim(),
      transmission: data.transmission?.trim(),
      description: data.description?.trim(),
      features: data.features?.trim() || "",
      condition: data.condition?.trim() || "",
      ownerHistory: data.ownerHistory?.trim() || "",
      status: data.status || "available",
      images: processedImages,
      documents: processedDocuments,
    }

    // Add sale details if status is sold
    if (data.status === "sold" && data.saleDetails) {
      listingData.saleDetails = {
        buyerName: data.saleDetails.buyerName?.trim(),
        buyerEmail: data.saleDetails.buyerEmail?.trim(),
        buyerPhone: data.saleDetails.buyerPhone?.trim(),
        buyerAddress: data.saleDetails.buyerAddress?.trim(),
        sellerName: data.saleDetails.sellerName?.trim(),
        sellerEmail: data.saleDetails.sellerEmail?.trim(),
        sellerPhone: data.saleDetails.sellerPhone?.trim(),
        sellerAddress: data.saleDetails.sellerAddress?.trim(),
        saleAmount: Number.parseInt(data.saleDetails.saleAmount),
        saleDate: new Date(data.saleDetails.saleDate),
        notes: data.saleDetails.notes?.trim() || "",
      }
    }

    const listing = new Listing(listingData)
    await listing.save()

    const savedListing = await Listing.findById(listing._id).select("-images.data -documents.data").lean()

    return NextResponse.json({
      success: true,
      message: "Car listing created successfully",
      listing: savedListing,
    })
  } catch (error) {
    console.error("Create listing error:", error)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json({ error: `${field} already exists` }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
