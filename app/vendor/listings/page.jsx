"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Plus, Search, Eye, Trash } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { SaleDetailsModal } from "@/components/sale-details-modal"

export default function ListingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredListings, setFilteredListings] = useState([])

  useEffect(() => {
    fetchListings()
  }, [user])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = listings.filter((listing) => {
        const query = searchQuery.toLowerCase()
        return (
          listing.make?.toLowerCase().includes(query) ||
          listing.model?.toLowerCase().includes(query) ||
          listing.registrationNumber?.toLowerCase().includes(query) ||
          listing.vin?.toLowerCase().includes(query)
        )
      })
      setFilteredListings(filtered)
    } else {
      setFilteredListings(listings)
    }
  }, [searchQuery, listings])

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings")
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings || [])
        setFilteredListings(data.listings || [])
      } else {
        throw new Error("Failed to fetch listings")
      }
    } catch (error) {
      console.error("Error fetching listings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load listings",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this listing?")) return

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setListings(listings.filter((listing) => listing._id !== id))
        toast({
          title: "Success",
          description: "Listing deleted successfully",
        })
      } else {
        throw new Error("Failed to delete listing")
      }
    } catch (error) {
      console.error("Error deleting listing:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete listing",
      })
    }
  }

  const handleSaleComplete = (updatedListing) => {
    setListings((prev) => prev.map((listing) => (listing._id === updatedListing._id ? updatedListing : listing)))
    setFilteredListings((prev) =>
      prev.map((listing) => (listing._id === updatedListing._id ? updatedListing : listing)),
    )
  }

  const getMainImageUrl = (listing) => {
    if (!listing?.images || listing.images.length === 0) {
      return "/placeholder.svg?height=200&width=300"
    }

    const mainImage = listing.images.find((img) => img.isMain) || listing.images[0]
    if (!mainImage?._id) {
      return "/placeholder.svg?height=200&width=300"
    }

    return `/api/listings/${listing._id}/images/${mainImage._id}`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>
      case "sold":
        return <Badge className="bg-red-100 text-red-800">Sold</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Car Listings
              </h1>
              <p className="text-sm text-muted-foreground">Manage your vehicle inventory</p>
            </div>
            <Button
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary"
            >
              <Link href="/vendor/listings/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Car
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, registration..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredListings.map((listing) => (
              <Card key={listing._id} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={getMainImageUrl(listing) || "/placeholder.svg"}
                    alt={`${listing.make} ${listing.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                  <div className="absolute top-2 right-2">{getStatusBadge(listing.status)}</div>
                </div>

                <CardContent className="p-3">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base line-clamp-1">
                      {listing.make} {listing.model}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {listing.year} • {listing.registrationNumber}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">₹{listing.price?.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{listing.mileage} km</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                  </div>

                  <div className="flex gap-1 mt-3">
                    <Button asChild size="sm" className="flex-1 text-xs h-8">
                      <Link href={`/vendor/listings/${listing._id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>

                    {listing.status === "available" ? (
                      <SaleDetailsModal
                        listing={listing}
                        onSaleComplete={handleSaleComplete}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            <span className="mr-1 font-bold">₹</span>
                            Available
                          </Button>
                        }
                      />
                    ) : (
                      <SaleDetailsModal
                        listing={listing}
                        onSaleComplete={handleSaleComplete}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-8 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          >
                            <span className="mr-1 font-bold">₹</span>
                            Sold
                          </Button>
                        }
                      />
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(listing._id)}
                      className="text-destructive hover:text-destructive text-xs h-8 px-2"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">{searchQuery ? "No cars found" : "No cars listed yet"}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {searchQuery ? "Try adjusting your search terms" : "Add your first car listing to get started"}
              </p>
              {!searchQuery && (
                <Button
                  asChild
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary"
                >
                  <Link href="/vendor/listings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Car
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
