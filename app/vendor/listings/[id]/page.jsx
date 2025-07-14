"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Edit, Save, Upload, FileText, Download, User, Phone, Mail, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { DocumentViewer } from "@/components/document-viewer"

export default function CarDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [car, setCar] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({})
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (params?.id) {
      fetchCarDetails()
    }
  }, [params?.id])

  const fetchCarDetails = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCar(data.listing)
        setFormData(data.listing)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Car not found",
        })
        router.push("/vendor/listings")
      }
    } catch (error) {
      console.error("Error fetching car details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load car details",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (checked) => {
    setFormData((prev) => ({ ...prev, status: checked ? "sold" : "available" }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/listings/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          year: Number.parseInt(formData.year),
          mileage: Number.parseInt(formData.mileage),
          price: Number.parseInt(formData.price),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCar(data.listing)
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Car details updated successfully",
        })
        window.location.reload()
      } else {
        throw new Error("Failed to update car")
      }
    } catch (error) {
      console.error("Error updating car:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update car details",
      })
    } finally {
      setSaving(false)
    }
  }

  const getMainImage = () => {
    if (!car?.images || car.images.length === 0) {
      return "/placeholder.svg?height=400&width=600"
    }
    const mainImage = car.images[selectedImageIndex] || car.images[0]
    if (!mainImage?._id) {
      return "/placeholder.svg?height=400&width=600"
    }
    return `/api/listings/${params.id}/images/${mainImage._id}`
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
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Car not found</h1>
            <Button asChild className="mt-4">
              <Link href="/vendor/listings">Back to Listings</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/vendor/listings">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent truncate">
                {car.make} {car.model} ({car.year})
              </h1>
              {getStatusBadge(car.status)}
            </div>
            <p className="text-muted-foreground">{car.registrationNumber}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                >
                  {saving ? "Saving..." : "Save Changes"}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Edit Details
                <Edit className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Car Images */}
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Car Images</span>
                  <Badge variant="secondary">{car.images?.length || 0} Images</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Image Display */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={getMainImage() || "/placeholder.svg"}
                    alt={`${car.make} ${car.model}`}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=400&width=600"
                    }}
                  />
                </div>

                {/* Image Thumbnails */}
                {car.images && car.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {car.images.map((image, index) => (
                      <button
                        key={image._id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <Image
                          src={`/api/listings/${params.id}/images/${image._id}`}
                          alt={image.name || `Car image ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={true}
                          onError={(e) => {
                            e.target.src = "/placeholder.svg?height=100&width=100"
                          }}
                        />
                        {image.isMain && (
                          <div className="absolute top-1 left-1">
                            <Badge variant="secondary" className="text-xs">
                              Main
                            </Badge>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {(!car.images || car.images.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-2" />
                    <p>No images uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Car Details, Documents, and Sale Info */}
          <div className="space-y-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className={`grid w-full ${car.status === "sold" ? "grid-cols-3" : "grid-cols-2"}`}>
                <TabsTrigger value="details">Car Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                {car.status === "sold" && <TabsTrigger value="sale">Sale Info</TabsTrigger>}
              </TabsList>

              <TabsContent value="details">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Vehicle Information</CardTitle>
                    <CardDescription>
                      {isEditing ? "Edit the vehicle details below" : "View vehicle details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Status Toggle */}
                    {isEditing && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Car Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Toggle to mark car as {formData.status === "available" ? "sold" : "available"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-medium ${formData.status === "available" ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            Available
                          </span>
                          <Switch checked={formData.status === "sold"} onCheckedChange={handleStatusChange} />
                          <span
                            className={`text-sm font-medium ${formData.status === "sold" ? "text-red-600" : "text-muted-foreground"}`}
                          >
                            Sold
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="make">Make</Label>
                        {isEditing ? (
                          <Input id="make" name="make" value={formData.make || ""} onChange={handleInputChange} />
                        ) : (
                          <p className="text-sm font-medium">{car.make}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        {isEditing ? (
                          <Input id="model" name="model" value={formData.model || ""} onChange={handleInputChange} />
                        ) : (
                          <p className="text-sm font-medium">{car.model}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        {isEditing ? (
                          <Input
                            id="year"
                            name="year"
                            type="number"
                            value={formData.year || ""}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-sm font-medium">{car.year}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        {isEditing ? (
                          <Input id="color" name="color" value={formData.color || ""} onChange={handleInputChange} />
                        ) : (
                          <p className="text-sm font-medium">{car.color}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        {isEditing ? (
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            value={formData.price || ""}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-sm font-medium text-primary text-lg">₹{car.price?.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Registration Number</Label>
                        {isEditing ? (
                          <Input
                            id="registrationNumber"
                            name="registrationNumber"
                            value={formData.registrationNumber || ""}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-sm font-medium">{car.registrationNumber}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vin">VIN</Label>
                        {isEditing ? (
                          <Input id="vin" name="vin" value={formData.vin || ""} onChange={handleInputChange} />
                        ) : (
                          <p className="text-sm font-medium">{car.vin}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mileage">Mileage (km)</Label>
                        {isEditing ? (
                          <Input
                            id="mileage"
                            name="mileage"
                            type="number"
                            value={formData.mileage || ""}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-sm font-medium">{car.mileage} km</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuelType">Fuel Type</Label>
                        {isEditing ? (
                          <Input
                            id="fuelType"
                            name="fuelType"
                            value={formData.fuelType || ""}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-sm font-medium">{car.fuelType}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transmission">Transmission</Label>
                        {isEditing ? (
                          <Input
                            id="transmission"
                            name="transmission"
                            value={formData.transmission || ""}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-sm font-medium">{car.transmission}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      {isEditing ? (
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description || ""}
                          onChange={handleInputChange}
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm">{car.description}</p>
                      )}
                    </div>

                    {car.features && (
                      <div className="space-y-2">
                        <Label htmlFor="features">Features</Label>
                        {isEditing ? (
                          <Textarea
                            id="features"
                            name="features"
                            value={formData.features || ""}
                            onChange={handleInputChange}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm">{car.features}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Documents
                    </CardTitle>
                    <CardDescription>Vehicle documents and certificates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {car.documents && car.documents.length > 0 ? (
                      <div className="space-y-4">
                        {car.documents.map((document, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{document.type}</h4>
                              <Badge variant="secondary">Uploaded</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{document.name}</p>
                            <div className="flex gap-2">
                              <DocumentViewer document={document} listingId={params.id} />
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/api/listings/${params.id}/documents/${document._id}`} download>
                                  <Download className="mr-2 h-3 w-3" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2" />
                        <p>No documents uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {car.status === "sold" && car.saleDetails && (
                <TabsContent value="sale">
                  <div className="space-y-6">
                    {/* Sale Information */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-green-600 font-bold text-lg">₹</span>
                          Sale Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Sale Amount</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-lg font-bold text-green-600">
                              ₹{car.saleDetails.saleAmount?.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sale Date
                          </Label>
                          <p className="font-medium">{new Date(car.saleDetails.saleDate).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Listed Price</Label>
                          <p className="font-medium">₹{car.price?.toLocaleString()}</p>
                        </div>
                      </CardContent>
                      {car.saleDetails.notes && (
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                            <p className="text-sm bg-muted p-3 rounded-lg">{car.saleDetails.notes}</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Buyer and Seller Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Buyer Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-primary" />
                            Buyer Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                            <p className="font-medium">{car.saleDetails.buyerName}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Email
                            </Label>
                            <p className="font-medium">{car.saleDetails.buyerEmail}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Phone
                            </Label>
                            <p className="font-medium">{car.saleDetails.buyerPhone}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Address
                            </Label>
                            <p className="font-medium">{car.saleDetails.buyerAddress}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Seller Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-green-600" />
                            Seller Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                            <p className="font-medium">{car.saleDetails.sellerName}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Email
                            </Label>
                            <p className="font-medium">{car.saleDetails.sellerEmail}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Phone
                            </Label>
                            <p className="font-medium">{car.saleDetails.sellerPhone}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Address
                            </Label>
                            <p className="font-medium">{car.saleDetails.sellerAddress}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
