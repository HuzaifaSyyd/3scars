"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { Loader2, Plus, X, Upload, FileText, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

interface AddCarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCarAdded: () => void
}

interface CarFormData {
  brand: string
  model: string
  year: number
  color: string
  fuel_type: string
  transmission: string
  mileage: number
  price: number
  description: string
  engine_capacity: string
  body_type: string
  condition: string
  registration_number: string
  chassis_number: string
  engine_number: string
}

const initialCarData: CarFormData = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  fuel_type: "",
  transmission: "",
  mileage: 0,
  price: 0,
  description: "",
  engine_capacity: "",
  body_type: "",
  condition: "",
  registration_number: "",
  chassis_number: "",
  engine_number: "",
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

// Function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  // Remove emojis and special characters, keep only alphanumeric, dots, hyphens, and underscores
  const sanitized = filename
    .replace(/[^\w\s.-]/g, "") // Remove special chars and emojis
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
    .toLowerCase()

  // Ensure we have a valid filename
  return sanitized || `file_${Date.now()}`
}

export function AddCarDialog({ open, onOpenChange, onCarAdded }: AddCarDialogProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [carData, setCarData] = useState<CarFormData>(initialCarData)
  const [carImages, setCarImages] = useState<File[]>([])
  const [carImagePreviews, setCarImagePreviews] = useState<string[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [documents, setDocuments] = useState<File[]>([])
  const [documentPreviews, setDocumentPreviews] = useState<{ name: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCarData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCarData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCarImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const newPreviews: string[] = []

      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string)
            if (newPreviews.length === newFiles.length) {
              setCarImages((prev) => [...prev, ...newFiles])
              setCarImagePreviews((prev) => [...prev, ...newPreviews])
            }
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const newPreviews: { name: string; url: string }[] = []

      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push({
              name: file.name,
              url: e.target.result as string,
            })
            if (newPreviews.length === newFiles.length) {
              setDocuments((prev) => [...prev, ...newFiles])
              setDocumentPreviews((prev) => [...prev, ...newPreviews])
            }
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeCarImage = (index: number) => {
    setCarImages((prev) => prev.filter((_, i) => i !== index))
    setCarImagePreviews((prev) => prev.filter((_, i) => i !== index))
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0)
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex((prev) => prev - 1)
    }
  }

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
    setDocumentPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const setPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index)
  }

  const validateCarData = () => {
    if (!carData.brand) return "Brand is required"
    if (!carData.model) return "Model is required"
    if (!carData.year) return "Year is required"
    if (!carData.color) return "Color is required"
    if (!carData.fuel_type) return "Fuel type is required"
    if (!carData.transmission) return "Transmission is required"
    if (!carData.mileage) return "Mileage is required"
    if (!carData.price) return "Price is required"
    return null
  }

  const validateImages = () => {
    if (carImages.length === 0) return "At least one car image is required"
    return null
  }

  const handleNext = () => {
    if (activeTab === "details") {
      const error = validateCarData()
      if (error) {
        setError(error)
        return
      }
      setActiveTab("images")
    } else if (activeTab === "images") {
      const error = validateImages()
      if (error) {
        setError(error)
        return
      }
      setActiveTab("documents")
    } else if (activeTab === "documents") {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (activeTab === "images") {
      setActiveTab("details")
    } else if (activeTab === "documents") {
      setActiveTab("images")
    }
  }

  const checkForDuplicateCar = async (carData: CarFormData): Promise<string | null> => {
    if (!user) return null

    try {
      // Check for duplicate based on registration number (if provided)
      if (carData.registration_number && carData.registration_number.trim()) {
        const { data: regCheck, error: regError } = await supabase
          .from("cars")
          .select("id, brand, model, year")
          .eq("vendor_id", user.id)
          .eq("registration_number", carData.registration_number.trim())
          .limit(1)

        if (regError) throw regError

        if (regCheck && regCheck.length > 0) {
          return `A car with registration number "${carData.registration_number}" already exists (${regCheck[0].brand} ${regCheck[0].model} ${regCheck[0].year})`
        }
      }

      // Check for duplicate based on chassis number (if provided)
      if (carData.chassis_number && carData.chassis_number.trim()) {
        const { data: chassisCheck, error: chassisError } = await supabase
          .from("cars")
          .select("id, brand, model, year")
          .eq("vendor_id", user.id)
          .eq("chassis_number", carData.chassis_number.trim())
          .limit(1)

        if (chassisError) throw chassisError

        if (chassisCheck && chassisCheck.length > 0) {
          return `A car with chassis number "${carData.chassis_number}" already exists (${chassisCheck[0].brand} ${chassisCheck[0].model} ${chassisCheck[0].year})`
        }
      }

      // Check for duplicate based on engine number (if provided)
      if (carData.engine_number && carData.engine_number.trim()) {
        const { data: engineCheck, error: engineError } = await supabase
          .from("cars")
          .select("id, brand, model, year")
          .eq("vendor_id", user.id)
          .eq("engine_number", carData.engine_number.trim())
          .limit(1)

        if (engineError) throw engineError

        if (engineCheck && engineCheck.length > 0) {
          return `A car with engine number "${carData.engine_number}" already exists (${engineCheck[0].brand} ${engineCheck[0].model} ${engineCheck[0].year})`
        }
      }

      // If no unique identifiers provided, check for exact match on brand, model, year, color, and mileage
      if (!carData.registration_number && !carData.chassis_number && !carData.engine_number) {
        const { data: exactMatch, error: exactError } = await supabase
          .from("cars")
          .select("id")
          .eq("vendor_id", user.id)
          .eq("brand", carData.brand)
          .eq("model", carData.model)
          .eq("year", carData.year)
          .eq("color", carData.color)
          .eq("mileage", carData.mileage)
          .eq("price", carData.price)
          .limit(1)

        if (exactError) throw exactError

        if (exactMatch && exactMatch.length > 0) {
          return `A car with identical details (${carData.brand} ${carData.model} ${carData.year}, ${carData.color}, ${carData.mileage}km, ₹${carData.price.toLocaleString()}) already exists`
        }
      }

      return null // No duplicate found
    } catch (error: any) {
      console.error("Error checking for duplicates:", error)
      return "Error checking for duplicate cars. Please try again."
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a car",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check for duplicates first
      const duplicateError = await checkForDuplicateCar(carData)
      if (duplicateError) {
        setError(duplicateError)
        toast({
          title: "Duplicate Car Detected",
          description: duplicateError,
          variant: "destructive",
        })
        return
      }

      // 1. Insert car data
      const { data: carInsertData, error: carInsertError } = await supabase
        .from("cars")
        .insert({
          vendor_id: user.id,
          brand: carData.brand,
          model: carData.model,
          year: carData.year,
          color: carData.color,
          fuel_type: carData.fuel_type,
          transmission: carData.transmission,
          mileage: carData.mileage,
          price: carData.price,
          description: carData.description,
          engine_capacity: carData.engine_capacity,
          body_type: carData.body_type,
          condition: carData.condition,
          registration_number: carData.registration_number,
          chassis_number: carData.chassis_number,
          engine_number: carData.engine_number,
          status: "available",
        })
        .select()

      if (carInsertError) throw carInsertError

      const carId = carInsertData[0].id

      // 2. Upload car images
      for (let i = 0; i < carImages.length; i++) {
        const file = carImages[i]
        const isPrimary = i === primaryImageIndex
        const sanitizedName = sanitizeFilename(file.name)
        const fileName = `${user.id}/${carId}/${Date.now()}_${sanitizedName}`

        const { error: uploadError } = await supabase.storage.from("car-images").upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("car-images").getPublicUrl(fileName)

        const { error: imageInsertError } = await supabase.from("car_images").insert({
          car_id: carId,
          image_url: publicUrl,
          is_primary: isPrimary,
        })

        if (imageInsertError) throw imageInsertError
      }

      // 3. Upload documents
      for (let i = 0; i < documents.length; i++) {
        const file = documents[i]
        const sanitizedName = sanitizeFilename(file.name)
        const fileName = `${user.id}/${carId}/${Date.now()}_${sanitizedName}`

        const { error: uploadError } = await supabase.storage.from("car-documents").upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("car-documents").getPublicUrl(fileName)

        const { error: docInsertError } = await supabase.from("car_documents").insert({
          car_id: carId,
          document_name: file.name,
          document_url: publicUrl,
          document_type: file.type,
        })

        if (docInsertError) throw docInsertError
      }

      toast({
        title: "Car added successfully",
        description: "Your car has been added to your inventory",
      })

      // Reset form
      setCarData(initialCarData)
      setCarImages([])
      setCarImagePreviews([])
      setPrimaryImageIndex(0)
      setDocuments([])
      setDocumentPreviews([])
      setActiveTab("details")

      // Close dialog and notify parent
      onOpenChange(false)
      onCarAdded()
    } catch (error: any) {
      console.error("Error adding car:", error)
      setError(error.message || "An error occurred while adding the car")
      toast({
        title: "Error",
        description: error.message || "An error occurred while adding the car",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Add New Car</h2>
          <p className="text-gray-600 mb-6">Fill in the details to add a new car to your inventory</p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                1. Car Details
              </TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                2. Car Images
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                3. Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={carData.brand}
                    onChange={handleInputChange}
                    placeholder="e.g. Toyota"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    name="model"
                    value={carData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. Camry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select
                    name="year"
                    value={carData.year.toString()}
                    onValueChange={(v) => handleSelectChange("year", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    name="color"
                    value={carData.color}
                    onChange={handleInputChange}
                    placeholder="e.g. Black"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_type">Body Type</Label>
                  <Select
                    name="body_type"
                    value={carData.body_type}
                    onValueChange={(v) => handleSelectChange("body_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="hatchback">Hatchback</SelectItem>
                      <SelectItem value="coupe">Coupe</SelectItem>
                      <SelectItem value="convertible">Convertible</SelectItem>
                      <SelectItem value="wagon">Wagon</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">Fuel Type *</Label>
                  <Select
                    name="fuel_type"
                    value={carData.fuel_type}
                    onValueChange={(v) => handleSelectChange("fuel_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="lpg">LPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission *</Label>
                  <Select
                    name="transmission"
                    value={carData.transmission}
                    onValueChange={(v) => handleSelectChange("transmission", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                      <SelectItem value="cvt">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    name="condition"
                    value={carData.condition}
                    onValueChange={(v) => handleSelectChange("condition", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="very_good">Very Good</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage (km) *</Label>
                  <Input
                    id="mileage"
                    name="mileage"
                    type="number"
                    value={carData.mileage || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={carData.price || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. 1500000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine_capacity">Engine Capacity</Label>
                <Input
                  id="engine_capacity"
                  name="engine_capacity"
                  value={carData.engine_capacity}
                  onChange={handleInputChange}
                  placeholder="e.g. 2.0L"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    value={carData.registration_number}
                    onChange={handleInputChange}
                    placeholder="e.g. ABC123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chassis_number">Chassis Number</Label>
                  <Input
                    id="chassis_number"
                    name="chassis_number"
                    value={carData.chassis_number}
                    onChange={handleInputChange}
                    placeholder="e.g. 1HGCM82633A123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine_number">Engine Number</Label>
                  <Input
                    id="engine_number"
                    name="engine_number"
                    value={carData.engine_number}
                    onChange={handleInputChange}
                    placeholder="e.g. ENG123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={carData.description}
                  onChange={handleInputChange}
                  placeholder="Enter details about the car's condition, features, etc."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Car Images</h3>
                  <p className="text-sm text-gray-500">At least one image is required</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    id="car-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleCarImageChange}
                    className="hidden"
                  />
                  <label htmlFor="car-images" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload car images</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {carImages.length === 0
                        ? "Please upload at least 5 images (minimum 1)"
                        : `${carImages.length} images selected`}
                    </p>
                  </label>
                </div>

                {carImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                    {carImagePreviews.map((preview, index) => (
                      <Card
                        key={index}
                        className={`overflow-hidden ${index === primaryImageIndex ? "ring-2 ring-purple-500" : ""}`}
                      >
                        <div className="relative aspect-square">
                          <img
                            src={preview || "/placeholder.svg"}
                            alt={`Car image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6 rounded-full"
                              onClick={() => removeCarImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={index === primaryImageIndex ? "default" : "outline"}
                            className={`w-full text-xs ${
                              index === primaryImageIndex
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "text-purple-600 border-purple-200"
                            }`}
                            onClick={() => setPrimaryImage(index)}
                            disabled={index === primaryImageIndex}
                          >
                            {index === primaryImageIndex ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Primary
                              </>
                            ) : (
                              "Set as Primary"
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <Card className="overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <label htmlFor="add-more-images" className="cursor-pointer p-4 text-center w-full h-full">
                        <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Add More</p>
                        <input
                          id="add-more-images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleCarImageChange}
                          className="hidden"
                        />
                      </label>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Car Documents</h3>
                  <p className="text-sm text-gray-500">Upload registration, insurance, etc.</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    id="car-documents"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.heic,.heif"
                    onChange={handleDocumentChange}
                    className="hidden"
                  />
                  <label htmlFor="car-documents" className="cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload car documents</p>
                    <p className="text-xs text-gray-500 mt-1">Supports: Images (JPG, PNG, HEIC), PDF, DOC, TXT files</p>
                    <p className="text-xs text-gray-500">
                      {documents.length === 0
                        ? "Upload documents (optional)"
                        : `${documents.length} documents selected`}
                    </p>
                  </label>
                </div>

                {documentPreviews.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {documentPreviews.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-[300px]">
                              {doc.name}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-center mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-purple-200 text-purple-600 bg-transparent"
                        onClick={() => document.getElementById("add-more-documents")?.click()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More Documents
                      </Button>
                      <input
                        id="add-more-documents"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.heic,.heif"
                        onChange={handleDocumentChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={activeTab === "details" ? () => onOpenChange(false) : handleBack}
              disabled={isLoading}
            >
              {activeTab === "details" ? "Cancel" : "Back"}
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : activeTab === "documents" ? (
                "Add Car"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
