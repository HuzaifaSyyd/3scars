"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, X, Plus, Save, FileText, User } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

export default function NewListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    registrationNumber: "",
    vin: "",
    mileage: "",
    price: "",
    color: "",
    fuelType: "",
    transmission: "",
    description: "",
    features: "",
    condition: "",
    ownerHistory: "",
    status: "available",
  })

  const [saleData, setSaleData] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",
    sellerName: "",
    sellerEmail: "",
    sellerPhone: "",
    sellerAddress: "",
    saleAmount: "",
    saleDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const [images, setImages] = useState([])
  const [documents, setDocuments] = useState([])

  // Initialize empty slots
  useEffect(() => {
    setImages([
      { name: "", file: null, preview: null, data: null },
      { name: "", file: null, preview: null, data: null },
      { name: "", file: null, preview: null, data: null },
    ])
    setDocuments([
      { type: "RC Book", file: null, name: "", data: null },
      { type: "Insurance", file: null, name: "", data: null },
      { type: "PUC Certificate", file: null, name: "", data: null },
    ])
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaleDataChange = (e) => {
    const { name, value } = e.target
    setSaleData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (checked) => {
    setFormData((prev) => ({ ...prev, status: checked ? "sold" : "available" }))
  }

  const handleImageChange = async (index, field, value) => {
    if (field === "file" && value) {
      const file = value

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImages((prev) => {
          const newImages = [...prev]
          newImages[index] = {
            ...newImages[index],
            file: file,
            preview: e.target.result,
          }
          return newImages
        })
      }
      reader.readAsDataURL(file)

      // Upload image immediately
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("name", images[index].name || `Image ${index + 1}`)

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setImages((prev) => {
            const newImages = [...prev]
            newImages[index] = {
              ...newImages[index],
              data: data.imageData,
            }
            return newImages
          })
        }
      } catch (error) {
        console.error("Error uploading image:", error)
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "Failed to upload image",
        })
      }
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        newImages[index] = { ...newImages[index], [field]: value }
        return newImages
      })
    }
  }

  const handleDocumentChange = async (index, field, value) => {
    if (field === "file" && value) {
      const file = value

      setDocuments((prev) => {
        const newDocuments = [...prev]
        newDocuments[index] = {
          ...newDocuments[index],
          file: file,
        }
        return newDocuments
      })

      // Upload document immediately
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("name", documents[index].name || `${documents[index].type} Document`)
        formData.append("type", documents[index].type)

        const response = await fetch("/api/upload/document", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setDocuments((prev) => {
            const newDocuments = [...prev]
            newDocuments[index] = {
              ...newDocuments[index],
              data: data.documentData,
            }
            return newDocuments
          })
        }
      } catch (error) {
        console.error("Error uploading document:", error)
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "Failed to upload document",
        })
      }
    } else {
      setDocuments((prev) => {
        const newDocuments = [...prev]
        newDocuments[index] = { ...newDocuments[index], [field]: value }
        return newDocuments
      })
    }
  }

  const addImageSlot = () => {
    setImages((prev) => [...prev, { name: "", file: null, preview: null, data: null }])
  }

  const removeImageSlot = (index) => {
    if (images.length > 1) {
      setImages((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const addDocumentSlot = () => {
    setDocuments((prev) => [...prev, { type: "Other", file: null, name: "", data: null }])
  }

  const removeDocumentSlot = (index) => {
    if (documents.length > 1) {
      setDocuments((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare images data
      const imageData = images
        .filter((img) => img.data && img.name)
        .map((img) => ({
          name: img.name,
          data: img.data.data,
          contentType: img.data.contentType,
          size: img.data.size,
        }))

      // Prepare documents data
      const documentData = documents
        .filter((doc) => doc.data && doc.name)
        .map((doc) => ({
          type: doc.type,
          name: doc.name,
          data: doc.data.data,
          contentType: doc.data.contentType,
          size: doc.data.size,
        }))

      // Create listing data
      const listingData = {
        ...formData,
        year: Number.parseInt(formData.year),
        mileage: Number.parseInt(formData.mileage),
        price: Number.parseInt(formData.price),
        images: imageData,
        documents: documentData,
      }

      // Add sale details if status is sold
      if (formData.status === "sold") {
        listingData.saleDetails = {
          ...saleData,
          saleAmount: Number.parseInt(saleData.saleAmount),
          saleDate: new Date(saleData.saleDate).toISOString(),
        }
      }

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(listingData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Car listing created successfully",
        })
        router.push(`/vendor/listings/${data.listing._id}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create listing")
      }
    } catch (error) {
      console.error("Error creating listing:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create listing",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendor/listings">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Add New Car
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Vehicle Info</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="sold">Sale Details</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Vehicle Details</CardTitle>
                  <CardDescription>Enter all the vehicle information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Toggle */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="make">Make *</Label>
                      <Input
                        id="make"
                        name="make"
                        placeholder="e.g. Toyota"
                        value={formData.make}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        name="model"
                        placeholder="e.g. Corolla"
                        value={formData.model}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Input
                        id="year"
                        name="year"
                        type="number"
                        placeholder="e.g. 2020"
                        value={formData.year}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color *</Label>
                      <Input
                        id="color"
                        name="color"
                        placeholder="e.g. Red"
                        value={formData.color}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        placeholder="e.g. 500000"
                        value={formData.price}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">Registration Number *</Label>
                      <Input
                        id="registrationNumber"
                        name="registrationNumber"
                        placeholder="e.g. MH02AB1234"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN *</Label>
                      <Input
                        id="vin"
                        name="vin"
                        placeholder="Vehicle Identification Number"
                        value={formData.vin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage (km) *</Label>
                      <Input
                        id="mileage"
                        name="mileage"
                        type="number"
                        placeholder="e.g. 50000"
                        value={formData.mileage}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Fuel Type *</Label>
                      <Input
                        id="fuelType"
                        name="fuelType"
                        placeholder="e.g. Petrol"
                        value={formData.fuelType}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission *</Label>
                      <Input
                        id="transmission"
                        name="transmission"
                        placeholder="e.g. Automatic"
                        value={formData.transmission}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Detailed description of the vehicle"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="features">Features</Label>
                    <Textarea
                      id="features"
                      name="features"
                      placeholder="List of features (e.g. AC, Power Steering, etc.)"
                      value={formData.features}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Input
                        id="condition"
                        name="condition"
                        placeholder="e.g. Excellent"
                        value={formData.condition}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerHistory">Owner History</Label>
                      <Input
                        id="ownerHistory"
                        name="ownerHistory"
                        placeholder="e.g. First Owner"
                        value={formData.ownerHistory}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                      <Link href="/vendor/listings">Cancel</Link>
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("images")} className="w-full sm:w-auto">
                      Next: Add Images
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Car Images</CardTitle>
                  <CardDescription>
                    Upload high-quality images of your car. First image will be the main image.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {images.map((image, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Image {index + 1} {index === 0 && "(Main Image)"}
                        </h4>
                        {images.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeImageSlot(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`image-name-${index}`}>Image Name</Label>
                          <Input
                            id={`image-name-${index}`}
                            placeholder="e.g. Front View"
                            value={image.name}
                            onChange={(e) => handleImageChange(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`image-file-${index}`}>Select Image</Label>
                          <Input
                            id={`image-file-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, "file", e.target.files[0])}
                          />
                        </div>
                      </div>

                      {image.preview && (
                        <div className="mt-4">
                          <Image
                            src={image.preview || "/placeholder.svg"}
                            alt={image.name || `Image ${index + 1}`}
                            width={200}
                            height={150}
                            className="rounded-lg object-cover border"
                          />
                          {image.data && <p className="text-sm text-green-600 mt-2">✓ Uploaded successfully</p>}
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageSlot}
                    className="w-full border-dashed border-primary/50 hover:bg-primary/10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Image
                  </Button>

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("details")}
                      className="w-full sm:w-auto"
                    >
                      Back to Details
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("documents")} className="w-full sm:w-auto">
                      Next: Upload Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Vehicle Documents
                  </CardTitle>
                  <CardDescription>Upload important vehicle documents for verification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {documents.map((document, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{document.type}</h4>
                        {documents.length > 1 && document.type === "Other" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDocumentSlot(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`document-name-${index}`}>Document Name</Label>
                          <Input
                            id={`document-name-${index}`}
                            placeholder={`e.g. ${document.type} - 2024`}
                            value={document.name}
                            onChange={(e) => handleDocumentChange(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`document-file-${index}`}>Select Document</Label>
                          <Input
                            id={`document-file-${index}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentChange(index, "file", e.target.files[0])}
                          />
                        </div>
                      </div>

                      {document.file && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{document.file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(document.file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            {document.data && <span className="text-sm text-green-600">✓ Uploaded</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDocumentSlot}
                    className="w-full border-dashed border-primary/50 hover:bg-primary/10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Document
                  </Button>

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("images")}
                      className="w-full sm:w-auto"
                    >
                      Back to Images
                    </Button>
                    <Button type="button" onClick={() => setActiveTab("sold")} className="w-full sm:w-auto">
                      Next: Sale Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sold">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-lg">₹</span>
                    Sale Information
                  </CardTitle>
                  <CardDescription>
                    {formData.status === "sold"
                      ? "Enter buyer and seller details for this sold vehicle"
                      : "This section is only required if the car status is set to 'Sold'"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.status === "sold" ? (
                    <>
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
                              <Label htmlFor="buyerName">Full Name *</Label>
                              <Input
                                id="buyerName"
                                name="buyerName"
                                value={saleData.buyerName}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="buyerEmail">Email *</Label>
                              <Input
                                id="buyerEmail"
                                name="buyerEmail"
                                type="email"
                                value={saleData.buyerEmail}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="buyerPhone">Phone Number *</Label>
                              <Input
                                id="buyerPhone"
                                name="buyerPhone"
                                value={saleData.buyerPhone}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="buyerAddress">Address *</Label>
                              <Textarea
                                id="buyerAddress"
                                name="buyerAddress"
                                value={saleData.buyerAddress}
                                onChange={handleSaleDataChange}
                                rows={3}
                                required={formData.status === "sold"}
                              />
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
                              <Label htmlFor="sellerName">Full Name *</Label>
                              <Input
                                id="sellerName"
                                name="sellerName"
                                value={saleData.sellerName}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sellerEmail">Email *</Label>
                              <Input
                                id="sellerEmail"
                                name="sellerEmail"
                                type="email"
                                value={saleData.sellerEmail}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sellerPhone">Phone Number *</Label>
                              <Input
                                id="sellerPhone"
                                name="sellerPhone"
                                value={saleData.sellerPhone}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sellerAddress">Address *</Label>
                              <Textarea
                                id="sellerAddress"
                                name="sellerAddress"
                                value={saleData.sellerAddress}
                                onChange={handleSaleDataChange}
                                rows={3}
                                required={formData.status === "sold"}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Sale Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <span className="text-green-600 font-bold text-lg">₹</span>
                            Sale Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="saleAmount">Sale Amount (INR) *</Label>
                              <Input
                                id="saleAmount"
                                name="saleAmount"
                                type="number"
                                value={saleData.saleAmount}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="saleDate">Sale Date *</Label>
                              <Input
                                id="saleDate"
                                name="saleDate"
                                type="date"
                                value={saleData.saleDate}
                                onChange={handleSaleDataChange}
                                required={formData.status === "sold"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Listed Price</Label>
                              <p className="text-sm font-medium text-muted-foreground bg-muted p-2 rounded">
                                ₹{formData.price ? Number.parseInt(formData.price).toLocaleString() : "0"}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <Textarea
                              id="notes"
                              name="notes"
                              value={saleData.notes}
                              onChange={handleSaleDataChange}
                              rows={3}
                              placeholder="Any additional information about the sale..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <span className="text-6xl mx-auto mb-4 opacity-50 block">₹</span>
                      <h3 className="text-lg font-medium mb-2">Sale Details Not Required</h3>
                      <p className="text-sm">
                        Set the car status to "Sold" in the Vehicle Info tab to enable sale details entry.
                      </p>
                      <Button type="button" variant="outline" onClick={() => setActiveTab("details")} className="mt-4">
                        Go to Vehicle Info
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("documents")}
                      className="w-full sm:w-auto"
                    >
                      Back to Documents
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Listing
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  )
}
