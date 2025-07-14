import mongoose from "mongoose"

const ImageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  isMain: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const DocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const SaleDetailsSchema = new mongoose.Schema({
  buyerName: String,
  buyerEmail: String,
  buyerPhone: String,
  buyerAddress: String,
  sellerName: String,
  sellerEmail: String,
  sellerPhone: String,
  sellerAddress: String,
  saleAmount: Number,
  saleDate: {
    type: Date,
    default: Date.now,
  },
  notes: String,
})

const ListingSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vendorName: {
    type: String,
    required: true,
  },
  make: {
    type: String,
    required: [true, "Please provide vehicle make"],
  },
  model: {
    type: String,
    required: [true, "Please provide vehicle model"],
  },
  year: {
    type: Number,
    required: [true, "Please provide vehicle year"],
  },
  registrationNumber: {
    type: String,
    required: [true, "Please provide registration number"],
    unique: true,
  },
  vin: {
    type: String,
    required: [true, "Please provide VIN"],
    unique: true,
  },
  mileage: {
    type: Number,
    required: [true, "Please provide mileage"],
  },
  price: {
    type: Number,
    required: [true, "Please provide price"],
  },
  color: {
    type: String,
    required: [true, "Please provide color"],
  },
  fuelType: {
    type: String,
    required: [true, "Please provide fuel type"],
  },
  transmission: {
    type: String,
    required: [true, "Please provide transmission type"],
  },
  description: {
    type: String,
    required: [true, "Please provide description"],
  },
  features: String,
  condition: String,
  ownerHistory: String,
  status: {
    type: String,
    enum: ["available", "sold", "inactive"],
    default: "available",
  },
  images: [ImageSchema],
  documents: [DocumentSchema],
  saleDetails: SaleDetailsSchema,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for performance
ListingSchema.index({ vendorId: 1 })
ListingSchema.index({ status: 1 })
ListingSchema.index({ make: 1, model: 1 })
ListingSchema.index({ createdAt: -1 })

// Pre-save middleware
ListingSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Listing || mongoose.model("Listing", ListingSchema)
