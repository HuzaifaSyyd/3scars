-- Fix MongoDB indexes by dropping the problematic slug index
-- This will resolve the E11000 duplicate key error

-- Connect to your MongoDB database and run these commands:

-- 1. First, let's drop the problematic slug index
db.listings.dropIndex("slug_1")

-- 2. Verify the index has been dropped
db.listings.getIndexes()

-- 3. Optional: Remove any documents with null slug values that might cause issues
db.listings.updateMany(
  { slug: null },
  { $unset: { slug: "" } }
)

-- 4. If you want to completely remove the slug field from all documents:
db.listings.updateMany(
  {},
  { $unset: { slug: "" } }
)

-- 5. Verify the changes
db.listings.find({}, { slug: 1 }).limit(5)
