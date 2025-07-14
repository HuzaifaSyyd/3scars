"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Car, FileText, Upload, Clock, Search, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

export default function VendorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingDocuments: 0,
    recentListings: [],
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user?.id) return

    try {
      const response = await fetch("/api/listings")
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalListings: data.listings?.length || 0,
          pendingDocuments: 0,
          recentListings: data.listings?.slice(0, 5) || [],
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: "Could not load dashboard data",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/listings/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.listings || [])
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Could not search listings",
      })
    }
  }

  const getMainImageUrl = (listing) => {
    if (!listing?.images || listing.images.length === 0) {
      return "/placeholder.svg?height=100&width=150"
    }

    const mainImage = listing.images.find((img) => img.isMain) || listing.images[0]
    if (!mainImage?._id) {
      return "/placeholder.svg?height=100&width=150"
    }

    return `/api/listings/${listing._id}/images/${mainImage._id}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Welcome back, {user?.name}
              </h1>
              <p className="text-sm text-muted-foreground">Manage your car inventory and documents</p>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-primary" />
              Search Cars
            </CardTitle>
            <CardDescription>Search by registration number, make, model, or VIN</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter registration number (e.g., MH02AB1234)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Search Results:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((car) => (
                    <Link key={car._id} href={`/vendor/listings/${car._id}`}>
                      <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 relative rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={getMainImageUrl(car) || "/placeholder.svg"}
                              alt={`${car.make} ${car.model}`}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=100&width=150"
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {car.make} {car.model} ({car.year})
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{car.registrationNumber}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm">₹{car.price?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{car.mileage} km</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Car className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalListings}</div>
              <p className="text-xs text-muted-foreground">Active vehicle listings</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Upload className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" asChild className="w-full justify-start border-primary/20 hover:bg-primary/10">
                <Link href="/vendor/listings">
                  <Car className="mr-2 h-4 w-4" />
                  Manage Listings
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start border-primary/20 hover:bg-primary/10">
                <Link href="/vendor/settings">
                  <FileText className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Recent Listings
            </CardTitle>
            <CardDescription>Your most recently added vehicle listings</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentListings.length > 0 ? (
              <div className="space-y-4">
                {stats.recentListings.map((listing) => (
                  <Link key={listing._id} href={`/vendor/listings/${listing._id}`}>
                    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-16 h-12 relative rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={getMainImageUrl(listing) || "/placeholder.svg"}
                            alt={`${listing.make} ${listing.model}`}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              e.target.src = "/placeholder.svg?height=100&width=150"
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {listing.make} {listing.model}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {listing.year} • {listing.registrationNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-right flex-shrink-0">
                        <div className="mr-4">
                          <p className="font-medium text-sm">₹{listing.price?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{listing.mileage} km</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No listings yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Add your first vehicle listing to get started</p>
                <Button
                  asChild
                  className="mt-4 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary"
                >
                  <Link href="/vendor/listings/new">Add New Listing</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
