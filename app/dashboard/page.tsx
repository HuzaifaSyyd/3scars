"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { CarCard } from "@/components/dashboard/car-card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Database } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Search, Filter, Plus, CarIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth/auth-guard"

type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  car_images: { image_url: string; is_primary: boolean }[]
}

export default function DashboardPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [filteredCars, setFilteredCars] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadCars(user.id)
    }
  }, [user])

  const loadCars = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          car_images (
            image_url,
            is_primary
          )
        `)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCars(data || [])
      setFilteredCars(data || [])
    } catch (error: any) {
      toast({
        title: "Error loading cars",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = cars

    if (searchTerm) {
      filtered = filtered.filter(
        (car) =>
          car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.color.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((car) => car.status === statusFilter)
    }

    setFilteredCars(filtered)
  }, [cars, searchTerm, statusFilter])

  const handleStatusChange = async (carId: string, newStatus: "available" | "sold") => {
    try {
      const { error } = await supabase.from("cars").update({ status: newStatus }).eq("id", carId)

      if (error) throw error

      setCars((prev) => prev.map((car) => (car.id === carId ? { ...car, status: newStatus } : car)))

      toast({
        title: "Status updated",
        description: `Car marked as ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (carId: string) => {
    router.push(`/car/${carId}`)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <MainLayout>
          <Tabs defaultValue="dashboard">
            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your cars...</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </MainLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <MainLayout>
        <Tabs defaultValue="dashboard">
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your car inventory</p>
              </div>
              <Button
                onClick={() => router.push("/cars")}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Car
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-xl shadow-lg border-0">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search cars by brand, model, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cars</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCars.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                <CarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {cars.length === 0 ? "No cars added yet" : "No cars match your search"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {cars.length === 0
                    ? "Start by adding your first car to the inventory"
                    : "Try adjusting your search terms or filters"}
                </p>
                {cars.length === 0 && (
                  <Button
                    onClick={() => router.push("/cars")}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Car
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onStatusChange={() => handleStatusChange(car.id, car.status === "available" ? "sold" : "available")}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </MainLayout>
    </AuthGuard>
  )
}
