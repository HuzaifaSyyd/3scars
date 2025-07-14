-- Final database cleanup and optimization script
-- This script ensures the database is in perfect condition

-- Drop any problematic indexes
DROP INDEX IF EXISTS listings.slug_1;
DROP INDEX IF EXISTS listings.slug;

-- Remove slug field from all documents if it exists
db.listings.updateMany({}, { $unset: { slug: "" } });

-- Ensure proper indexes exist
db.listings.createIndex({ "vendorId": 1 });
db.listings.createIndex({ "status": 1 });
db.listings.createIndex({ "make": 1, "model": 1 });
db.listings.createIndex({ "createdAt": -1 });
db.listings.createIndex({ "registrationNumber": 1 }, { unique: true });
db.listings.createIndex({ "vin": 1 }, { unique: true });

-- Clean up any invalid data
db.listings.updateMany(
  { "images.data": { $exists: false } },
  { $pull: { "images": { "data": { $exists: false } } } }
);

db.listings.updateMany(
  { "documents.data": { $exists: false } },
  { $pull: { "documents": { "data": { $exists: false } } } }
);

-- Ensure all listings have proper structure
db.listings.updateMany(
  { "images": { $exists: false } },
  { $set: { "images": [] } }
);

db.listings.updateMany(
  { "documents": { $exists: false } },
  { $set: { "documents": [] } }
);

-- Set main image flag for first image if none exists
db.listings.find({ "images.0": { $exists: true } }).forEach(function(doc) {
  var hasMainImage = doc.images.some(function(img) { return img.isMain === true; });
  if (!hasMainImage && doc.images.length > 0) {
    db.listings.updateOne(
      { "_id": doc._id },
      { $set: { "images.0.isMain": true } }
    );
  }
});

print("Database cleanup completed successfully!");
