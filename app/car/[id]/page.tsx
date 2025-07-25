"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase, type Database } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth/auth-guard"
import { SoldCarModal } from "@/components/dashboard/sold-car-modal"
import {
  Calendar,
  Fuel,
  Gauge,
  Palette,
  Settings,
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  X,
  ExternalLink,
  AlertCircle,
  IndianRupee,
  ImageIcon,
} from "lucide-react"

type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  car_images: { id: string; image_url: string; is_primary: boolean }[]
  car_documents: { id: string; document_name: string; document_url: string; document_type: string }[]
  sales?: {
    id: string
    client_name: string
    client_email: string
    client_phone: string
    client_address: string
    sale_date: string
    payment_method: string
    sale_price: number
    client_documents: string
  }[]
}

export default function CarDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [car, setCar] = useState<Car | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [activeDocument, setActiveDocument] = useState<{ name: string; url: string; type?: string } | null>(null)
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user && id) {
      loadCarDetails(id as string)
    }
  }, [user, id])

  const loadCarDetails = async (carId: string) => {
    try {
      console.log("Loading car details for ID:", carId)

      const { data, error } = await supabase
        .from("cars")
        .select(
          `
          *,
          car_images (
            id,
            image_url,
            is_primary
          ),
          car_documents (
            id,
            document_name,
            document_url,
            document_type
          ),
          sales (
            id,
            client_name,
            client_email,
            client_phone,
            client_address,
            sale_date,
            payment_method,
            sale_price,
            client_documents
          )
        `,
        )
        .eq("id", carId)
        .single()

      if (error) throw error

      console.log("Car data loaded:", data)
      console.log("Car documents:", data.car_documents)

      setCar(data)

      // Set active image to primary image if available
      if (data.car_images && data.car_images.length > 0) {
        const primaryIndex = data.car_images.findIndex((img) => img.is_primary)
        if (primaryIndex !== -1) {
          setActiveImageIndex(primaryIndex)
        }
      }

      // Set active tab to "sold" if car is sold
      if (data.status === "sold") {
        setActiveTab("sold")
      }
    } catch (error: any) {
      console.error("Error loading car details:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while loading car details",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSold = () => {
    loadCarDetails(id as string)
    setShowSoldModal(false)
  }

  const openDocument = async (document: { name: string; url: string; type?: string }) => {
    console.log("Opening document:", document)
    setDocumentError(null)
    setActiveDocument(document)
    setShowDocumentModal(true)

    // For Supabase storage URLs, we need to handle them differently
    if (document.url.includes("supabase.co/storage")) {
      try {
        // Try to get a signed URL for better access
        const urlParts = document.url.split("/storage/v1/object/public/")
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("car-documents")
            .createSignedUrl(filePath.replace("car-documents/", ""), 3600) // 1 hour expiry

          if (signedUrlData?.signedUrl && !signedUrlError) {
            console.log("Using signed URL:", signedUrlData.signedUrl)
            setActiveDocument({ ...document, url: signedUrlData.signedUrl })
            return
          }
        }
      } catch (error) {
        console.log("Could not create signed URL, using original URL")
      }
    }

    // Test if the document URL is accessible
    try {
      const response = await fetch(document.url, { method: "HEAD" })
      if (!response.ok) {
        console.error("Document fetch failed:", response.status, response.statusText)
        setDocumentError("Document could not be loaded. The file may have been moved or deleted.")
      }
    } catch (error) {
      console.error("Document fetch error:", error)
      setDocumentError("Document could not be loaded. Please check your internet connection.")
    }
  }

  const downloadDocument = async (url: string, filename: string) => {
    try {
      console.log("Downloading document:", url, filename)

      // For Supabase storage URLs, try to get a signed URL first
      let downloadUrl = url
      if (url.includes("supabase.co/storage")) {
        try {
          const urlParts = url.split("/storage/v1/object/public/")
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from("car-documents")
              .createSignedUrl(filePath.replace("car-documents/", ""), 3600)

            if (signedUrlData?.signedUrl && !signedUrlError) {
              downloadUrl = signedUrlData.signedUrl
            }
          }
        } catch (error) {
          console.log("Could not create signed URL for download, using original URL")
        }
      }

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch document")
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Error",
        description: "Could not download the document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openInNewTab = async (url: string) => {
    console.log("Opening in new tab:", url)

    // For Supabase storage URLs, try to get a signed URL first
    let finalUrl = url
    if (url.includes("supabase.co/storage")) {
      try {
        const urlParts = url.split("/storage/v1/object/public/")
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("car-documents")
            .createSignedUrl(filePath.replace("car-documents/", ""), 3600)

          if (signedUrlData?.signedUrl && !signedUrlError) {
            finalUrl = signedUrlData.signedUrl
          }
        }
      } catch (error) {
        console.log("Could not create signed URL for new tab, using original URL")
      }
    }

    window.open(finalUrl, "_blank", "noopener,noreferrer")
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isImageFile = (url: string, type?: string) => {
    if (type && type.startsWith("image/")) return true
    return url.match(/\.(jpeg|jpg|gif|png|webp|heic|heif|bmp|tiff|tif|svg|ico|avif|jfif)$/i) !== null
  }

  const isPdfFile = (url: string, type?: string) => {
    if (type === "application/pdf") return true
    return url.endsWith(".pdf")
  }

  const handleImageError = (e: any) => {
    console.error("Image loading error:", e.target.src)
    // Handle image loading error silently
  }

  const handleDocumentImageError = (e: any, docName: string, docUrl: string) => {
    console.error("Document image loading error:", e.target.src, "for document:", docName)

    // Add to failed images set
    setFailedImages((prev) => new Set(prev).add(docUrl))

    // Set a fallback placeholder
    e.target.src = "/placeholder.svg?height=200&width=300&text=Image+Not+Available"
  }

  const getDocumentImageSrc = async (url: string) => {
    // If this image has already failed, return placeholder immediately
    if (failedImages.has(url)) {
      return "/placeholder.svg?height=200&width=300&text=Image+Not+Available"
    }

    // For Supabase storage URLs, try to get a signed URL
    if (url.includes("supabase.co/storage")) {
      try {
        const urlParts = url.split("/storage/v1/object/public/")
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("car-documents")
            .createSignedUrl(filePath.replace("car-documents/", ""), 3600)

          if (signedUrlData?.signedUrl && !signedUrlError) {
            return signedUrlData.signedUrl
          }
        }
      } catch (error) {
        console.log("Could not create signed URL for image, using original URL")
      }
    }

    return url
  }

  // Get image documents only
  const imageDocuments =
    car?.car_documents?.filter((doc) => {
      const isImage = isImageFile(doc.document_url, doc.document_type)
      console.log(
        "Document:",
        doc.document_name,
        "URL:",
        doc.document_url,
        "Type:",
        doc.document_type,
        "Is Image:",
        isImage,
      )
      return isImage
    }) || []

  const nonImageDocuments = car?.car_documents?.filter((doc) => !isImageFile(doc.document_url, doc.document_type)) || []

  console.log("Image documents:", imageDocuments)
  console.log("Non-image documents:", nonImageDocuments)

  if (isLoading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading car details...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    )
  }

  if (!car) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Car not found</h3>
            <p className="text-gray-600 mb-6">
              The car you're looking for doesn't exist or you don't have access to it
            </p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </MainLayout>
      </AuthGuard>
    )
  }

  const tabsToShow =
    car.status === "sold" ? ["details", "images", "documents", "sold"] : ["details", "images", "documents"]

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {car.brand} {car.model}
                </h1>
                <p className="text-gray-600">{car.year}</p>
              </div>
            </div>
            <Badge
              variant={car.status === "available" ? "default" : "secondary"}
              className={`${
                car.status === "available" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              } text-white px-3 py-1 text-sm`}
            >
              {car.status === "available" ? "Available" : "Sold"}
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-lg border-0 h-14">
              {tabsToShow.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white h-12 rounded-lg transition-all duration-300"
                >
                  {tab === "details" && <Settings className="w-5 h-5" />}
                  {tab === "images" && <Palette className="w-5 h-5" />}
                  {tab === "documents" && <FileText className="w-5 h-5" />}
                  {tab === "sold" && <CheckCircle className="w-5 h-5" />}
                  <span className="capitalize">{tab}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                            <p className="text-lg font-semibold">{car.brand}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Model</h3>
                            <p className="text-lg font-semibold">{car.model}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Year</h3>
                            <p className="text-lg font-semibold">{car.year}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Color</h3>
                            <p className="text-lg font-semibold">{car.color}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Fuel Type</h3>
                            <p className="text-lg font-semibold capitalize">{car.fuel_type}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Transmission</h3>
                            <p className="text-lg font-semibold capitalize">{car.transmission}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Mileage</h3>
                            <p className="text-lg font-semibold">{car.mileage.toLocaleString()} km</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Price</h3>
                            <p className="text-lg font-semibold text-purple-600">{formatPrice(car.price)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {car.engine_capacity && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500">Engine Capacity</h4>
                              <p className="text-sm">{car.engine_capacity}</p>
                            </div>
                          )}
                          {car.body_type && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500">Body Type</h4>
                              <p className="text-sm capitalize">{car.body_type}</p>
                            </div>
                          )}
                          {car.condition && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500">Condition</h4>
                              <p className="text-sm capitalize">{car.condition.replace("_", " ")}</p>
                            </div>
                          )}
                          {car.registration_number && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500">Registration Number</h4>
                              <p className="text-sm">{car.registration_number}</p>
                            </div>
                          )}
                          {car.chassis_number && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500">Chassis Number</h4>
                              <p className="text-sm">{car.chassis_number}</p>
                            </div>
                          )}
                          {car.engine_number && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-500">Engine Number</h4>
                              <p className="text-sm">{car.engine_number}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {car.description && (
                        <div className="pt-4 border-t">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{car.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Actions</h3>
                        <Badge
                          variant={car.status === "available" ? "default" : "secondary"}
                          className={`${car.status === "available" ? "bg-green-500" : "bg-red-500"} text-white`}
                        >
                          {car.status === "available" ? "Available" : "Sold"}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {car.status === "available" && (
                          <Button
                            onClick={() => setShowSoldModal(true)}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark as Sold
                          </Button>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Car Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-purple-500 mr-2" />
                            <span>Year: {car.year}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Fuel className="w-4 h-4 text-purple-500 mr-2" />
                            <span>Fuel: {car.fuel_type}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Gauge className="w-4 h-4 text-purple-500 mr-2" />
                            <span>Mileage: {car.mileage.toLocaleString()} km</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Settings className="w-4 h-4 text-purple-500 mr-2" />
                            <span>Transmission: {car.transmission}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Palette className="w-4 h-4 text-purple-500 mr-2" />
                            <span>Color: {car.color}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <IndianRupee className="w-4 h-4 text-purple-500 mr-2" />
                            <span>Price: {formatPrice(car.price)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div
                        className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setShowImageModal(true)}
                      >
                        {car.car_images && car.car_images.length > 0 ? (
                          <img
                            src={car.car_images[activeImageIndex].image_url || "/placeholder.svg"}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <p className="text-gray-500">No images available</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">All Images</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {car.car_images && car.car_images.length > 0 ? (
                          car.car_images.map((image, index) => (
                            <div
                              key={image.id}
                              className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                                index === activeImageIndex ? "border-purple-500" : "border-transparent"
                              }`}
                              onClick={() => setActiveImageIndex(index)}
                            >
                              <img
                                src={image.image_url || "/placeholder.svg"}
                                alt={`${car.brand} ${car.model} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 col-span-2">No images available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  {/* Document Images Section - Similar to Car Images */}
                  {imageDocuments.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Document Images</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <div
                            className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-purple-300 transition-colors"
                            onClick={() => {
                              const activeDoc = imageDocuments[activeDocumentIndex]
                              openDocument({
                                name: activeDoc.document_name,
                                url: activeDoc.document_url,
                                type: activeDoc.document_type,
                              })
                            }}
                          >
                            {imageDocuments[activeDocumentIndex] ? (
                              failedImages.has(imageDocuments[activeDocumentIndex].document_url) ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                                  <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
                                  <p className="text-gray-500 text-sm">Image not available</p>
                                  <p className="text-gray-400 text-xs mt-1">Click to try viewing</p>
                                </div>
                              ) : (
                                <img
                                  src={imageDocuments[activeDocumentIndex].document_url || "/placeholder.svg"}
                                  alt={imageDocuments[activeDocumentIndex].document_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) =>
                                    handleDocumentImageError(
                                      e,
                                      imageDocuments[activeDocumentIndex].document_name,
                                      imageDocuments[activeDocumentIndex].document_url,
                                    )
                                  }
                                  onLoad={() =>
                                    console.log(
                                      "Document image loaded successfully:",
                                      imageDocuments[activeDocumentIndex].document_url,
                                    )
                                  }
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <p className="text-gray-500">No document image available</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 text-center">
                            <p className="text-sm font-medium text-gray-900">
                              {imageDocuments[activeDocumentIndex]?.document_name || "Document"}
                            </p>
                            <div className="flex justify-center space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200 bg-transparent"
                                onClick={() => {
                                  const activeDoc = imageDocuments[activeDocumentIndex]
                                  if (activeDoc) {
                                    openDocument({
                                      name: activeDoc.document_name,
                                      url: activeDoc.document_url,
                                      type: activeDoc.document_type,
                                    })
                                  }
                                }}
                              >
                                View Full Size
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200 bg-transparent"
                                onClick={() => {
                                  const activeDoc = imageDocuments[activeDocumentIndex]
                                  if (activeDoc) {
                                    openInNewTab(activeDoc.document_url)
                                  }
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-600 border-purple-200 bg-transparent"
                                onClick={() => {
                                  const activeDoc = imageDocuments[activeDocumentIndex]
                                  if (activeDoc) {
                                    downloadDocument(activeDoc.document_url, activeDoc.document_name)
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-md font-semibold mb-4">All Document Images</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {imageDocuments.map((doc, index) => (
                              <div
                                key={doc.id}
                                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                                  index === activeDocumentIndex ? "border-purple-500" : "border-transparent"
                                } hover:border-purple-300 transition-colors`}
                                onClick={() => {
                                  console.log("Selecting document index:", index, "Document:", doc)
                                  setActiveDocumentIndex(index)
                                }}
                              >
                                {failedImages.has(doc.document_url) ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                                    <ImageIcon className="h-8 w-8 text-gray-400 mb-1" />
                                    <p className="text-gray-500 text-xs">Not available</p>
                                  </div>
                                ) : (
                                  <img
                                    src={doc.document_url || "/placeholder.svg"}
                                    alt={doc.document_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => handleDocumentImageError(e, doc.document_name, doc.document_url)}
                                    onLoad={() => console.log("Thumbnail loaded:", doc.document_url)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Non-Image Documents Section */}
                  {nonImageDocuments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        {imageDocuments.length > 0 ? "Other Documents" : "Car Documents"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nonImageDocuments.map((doc) => (
                          <Card key={doc.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-8 w-8 text-purple-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{doc.document_name}</p>
                                  <p className="text-xs text-gray-500">{doc.document_type || "Document"}</p>
                                </div>
                              </div>
                              <div className="flex justify-between mt-4 space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 border-purple-200 bg-transparent flex-1"
                                  onClick={() =>
                                    openDocument({
                                      name: doc.document_name,
                                      url: doc.document_url,
                                      type: doc.document_type,
                                    })
                                  }
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 border-purple-200 bg-transparent"
                                  onClick={() => openInNewTab(doc.document_url)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 border-purple-200 bg-transparent"
                                  onClick={() => downloadDocument(doc.document_url, doc.document_name)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Documents Message */}
                  {imageDocuments.length === 0 && nonImageDocuments.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No documents available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {car.status === "sold" && (
              <TabsContent value="sold" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Sale Information</h3>
                    {car.sales && car.sales.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Client Name</h4>
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-purple-500 mr-2" />
                                <p className="text-lg font-semibold">{car.sales[0].client_name}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Client Email</h4>
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 text-purple-500 mr-2" />
                                <p className="text-lg font-semibold">{car.sales[0].client_email}</p>
                              </div>
                            </div>
                            {car.sales[0].client_phone && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Client Phone</h4>
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 text-purple-500 mr-2" />
                                  <p className="text-lg font-semibold">{car.sales[0].client_phone}</p>
                                </div>
                              </div>
                            )}
                            {car.sales[0].client_address && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Client Address</h4>
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 text-purple-500 mr-2 mt-1" />
                                  <p className="text-lg font-semibold">{car.sales[0].client_address}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Sale Date</h4>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-purple-500 mr-2" />
                                <p className="text-lg font-semibold">{formatDate(car.sales[0].sale_date)}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Payment Method</h4>
                              <div className="flex items-center">
                                <CreditCard className="w-4 h-4 text-purple-500 mr-2" />
                                <p className="text-lg font-semibold capitalize">
                                  {car.sales[0].payment_method.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Sale Price</h4>
                              <p className="text-lg font-semibold text-purple-600">
                                {formatPrice(car.sales[0].sale_price)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {car.sales[0].client_documents && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">Client Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {JSON.parse(car.sales[0].client_documents).map((docUrl: string, index: number) => (
                                <Card key={index} className="overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-8 w-8 text-purple-600" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          Client Document {index + 1}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex justify-between mt-4 space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-purple-600 border-purple-200 bg-transparent flex-1"
                                        onClick={() =>
                                          openDocument({
                                            name: `Client Document ${index + 1}`,
                                            url: docUrl,
                                          })
                                        }
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-purple-600 border-purple-200 bg-transparent"
                                        onClick={() => openInNewTab(docUrl)}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-purple-600 border-purple-200 bg-transparent"
                                        onClick={() => downloadDocument(docUrl, `client-document-${index + 1}`)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No sale information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Image Modal */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl p-0 bg-black">
            <DialogHeader>
              <DialogTitle className="sr-only">Car Image Viewer</DialogTitle>
            </DialogHeader>
            {car.car_images && car.car_images.length > 0 && (
              <div className="relative">
                <img
                  src={car.car_images[activeImageIndex].image_url || "/placeholder.svg"}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  onError={handleImageError}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Document Modal */}
        <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
  <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
    <DialogHeader>
      <DialogTitle className="sr-only">{activeDocument?.name || "Document Viewer"}</DialogTitle>
    </DialogHeader>

    {activeDocument && (
      <div className="relative h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border-b bg-white space-y-2 sm:space-y-0">
          <h3 className="text-lg font-semibold truncate">{activeDocument.name}</h3>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openInNewTab(activeDocument.url)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDocument(activeDocument.url, activeDocument.name)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDocumentModal(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="h-[70vh] overflow-auto bg-gray-50">
          {documentError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                <p className="text-red-700 mb-2">Document Loading Error</p>
                <p className="text-red-500 text-sm mb-4">{documentError}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => openInNewTab(activeDocument.url)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try Opening in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadDocument(activeDocument.url, activeDocument.name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Instead
                  </Button>
                </div>
              </div>
            </div>
          ) : isImageFile(activeDocument.url, activeDocument.type) ? (
            <div className="flex items-center justify-center h-full p-2 bg-white">
              <img
                src={activeDocument.url || "/placeholder.svg"}
                alt={activeDocument.name}
                className="max-w-full max-h-full object-contain"
                onError={() => setDocumentError("Image could not be loaded.")}
              />
            </div>
          ) : isPdfFile(activeDocument.url, activeDocument.type) ? (
            <iframe
              src={activeDocument.url}
              className="w-full h-full border-0"
              title={activeDocument.name}
              onError={() => setDocumentError("PDF could not be loaded.")}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 mb-2">Document Preview Not Available</p>
                <p className="text-gray-500 text-sm mb-4">
                  This document type cannot be previewed in the browser.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => openInNewTab(activeDocument.url)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadDocument(activeDocument.url, activeDocument.name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

        {/* Sold Modal */}
        <SoldCarModal car={car} isOpen={showSoldModal} onClose={() => setShowSoldModal(false)} onSold={handleSold} />
      </MainLayout>
    </AuthGuard>
  )
}
