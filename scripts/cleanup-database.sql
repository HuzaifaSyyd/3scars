-- Connect to your MongoDB database and run these commands

-- Drop the problematic slug index
db.listings.dropIndex("slug_1")

-- Remove any slug fields from existing documents
db.listings.updateMany({}, { $unset: { slug: "" } })

-- Verify the indexes
db.listings.getIndexes()

-- Clean up any null values that might cause issues
db.listings.updateMany(
  { 
    $or: [
      { registrationNumber: null },
      { vin: null },
      { make: null },
      { model: null }
    ]
  },
  { $unset: { registrationNumber: "", vin: "", make: "", model: "" } }
)

print("Database cleanup completed successfully!")
