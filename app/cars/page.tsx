"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AddCarDialog } from "@/components/cars/add-car-dialog"
import { SoldCarModal } from "@/components/dashboard/sold-car-modal"
import { supabase, type Database } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Plus, Search, Eye, DollarSign, Trash2, Loader2, IndianRupee } from "lucide-react"
import { useRouter } from "next/navigation"

type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  car_images: { id: string; image_url: string; is_primary: boolean }[]
}

// Custom Loading Component
function CustomLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 animate-pulse">3S-CARS</div>
        <p className="mt-4 text-gray-600">Loading cars...</p>
      </div>
    </div>
  )
}

export default function CarsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [filteredCars, setFilteredCars] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSoldModal, setShowSoldModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadCars()
    }
  }, [user])

  useEffect(() => {
    const filtered = cars.filter(
      (car) =>
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.year.toString().includes(searchTerm) ||
        car.color.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCars(filtered)
  }, [cars, searchTerm])

  const loadCars = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select(
          `
          *,
          car_images (
            id,
            image_url,
            is_primary
          )
        `,
        )
        .eq("vendor_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCars(data || [])
    } catch (error: any) {
      console.error("Error loading cars:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while loading cars",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCarAdded = () => {
    loadCars()
    setShowAddDialog(false)
  }

  const handleMarkAsSold = (car: Car) => {
    setSelectedCar(car)
    setShowSoldModal(true)
  }

  const handleSold = () => {
    loadCars()
    setShowSoldModal(false)
    setSelectedCar(null)
  }

  const handleDeleteCar = (car: Car) => {
    setSelectedCar(car)
    setShowDeleteDialog(true)
  }

  const confirmDeleteCar = async () => {
    if (!selectedCar) return

    setIsDeleting(true)
    try {
      // Delete car images from storage
      if (selectedCar.car_images && selectedCar.car_images.length > 0) {
        const imagePaths = selectedCar.car_images
          .map((img) => {
            const url = new URL(img.image_url)
            return url.pathname.split("/").pop() // Get the filename from URL
          })
          .filter(Boolean)

        if (imagePaths.length > 0) {
          const { error: storageError } = await supabase.storage.from("car-images").remove(imagePaths)

          if (storageError) {
            console.error("Error deleting images from storage:", storageError)
          }
        }
      }

      // Delete car documents from storage
      const { data: documents } = await supabase
        .from("car_documents")
        .select("document_url")
        .eq("car_id", selectedCar.id)

      if (documents && documents.length > 0) {
        const documentPaths = documents
          .map((doc) => {
            const url = new URL(doc.document_url)
            return url.pathname.split("/").pop() // Get the filename from URL
          })
          .filter(Boolean)

        if (documentPaths.length > 0) {
          const { error: docStorageError } = await supabase.storage.from("car-documents").remove(documentPaths)

          if (docStorageError) {
            console.error("Error deleting documents from storage:", docStorageError)
          }
        }
      }

      // Delete car images records
      const { error: imagesError } = await supabase.from("car_images").delete().eq("car_id", selectedCar.id)

      if (imagesError) throw imagesError

      // Delete car documents records
      const { error: documentsError } = await supabase.from("car_documents").delete().eq("car_id", selectedCar.id)

      if (documentsError) throw documentsError

      // Delete sales records
      const { error: salesError } = await supabase.from("sales").delete().eq("car_id", selectedCar.id)

      if (salesError) throw salesError

      // Finally delete the car
      const { error: carError } = await supabase.from("cars").delete().eq("id", selectedCar.id)

      if (carError) throw carError

      toast({
        title: "Car deleted",
        description: "The car has been successfully deleted",
      })

      loadCars()
    } catch (error: any) {
      console.error("Error deleting car:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred while deleting the car",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setSelectedCar(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <MainLayout>
          <CustomLoading />
        </MainLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Car Inventory</h1>
              <p className="text-gray-600">Manage your car listings</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Car
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Cars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by brand, model, year, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cars ({filteredCars.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCars.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No cars found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Car</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCars.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                {car.car_images && car.car_images.length > 0 ? (
                                  <img
                                    src={
                                      car.car_images.find((img) => img.is_primary)?.image_url ||
                                      car.car_images[0].image_url ||
                                      "/placeholder.svg" ||
                                      "/placeholder.svg"
                                    }
                                    alt={`${car.brand} ${car.model}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <span className="text-xs text-gray-500">No image</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {car.brand} {car.model}
                                </p>
                                <p className="text-sm text-gray-500">{car.color}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{car.year}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <IndianRupee className="w-4 h-4 text-purple-600 mr-1" />
                              <span className="font-medium text-purple-600">{formatPrice(car.price)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{car.mileage.toLocaleString()} km</TableCell>
                          <TableCell>
                            <Badge
                              variant={car.status === "available" ? "default" : "secondary"}
                              className={`${
                                car.status === "available"
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-red-500 hover:bg-red-600"
                              } text-white`}
                            >
                              {car.status === "available" ? "Available" : "Sold"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/car/${car.id}`)}
                                className="text-purple-600 border-purple-200 bg-transparent"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {car.status === "available" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsSold(car)}
                                  className="text-green-600 border-green-200 bg-transparent"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCar(car)}
                                className="text-red-600 border-red-200 bg-transparent"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AddCarDialog open={showAddDialog} onOpenChange={setShowAddDialog} onCarAdded={handleCarAdded} />

        {selectedCar && (
          <SoldCarModal
            car={selectedCar}
            isOpen={showSoldModal}
            onClose={() => {
              setShowSoldModal(false)
              setSelectedCar(null)
            }}
            onSold={handleSold}
          />
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Car</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this car? This action cannot be undone and will remove all associated
                images, documents, and sales records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCar}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
    </AuthGuard>
  )
}
