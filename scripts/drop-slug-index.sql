-- Drop the problematic slug index from the listings collection
-- Run this script to remove the duplicate key error

-- Connect to your MongoDB database and run:
db.listings.dropIndex("slug_1")

-- If the above doesn't work, you can also try:
db.listings.getIndexes()

-- Then drop the specific index causing the issue
-- Replace 'index_name' with the actual index name from getIndexes() output
-- db.listings.dropIndex("index_name")
