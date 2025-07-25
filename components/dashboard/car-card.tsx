"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Calendar, Fuel, Gauge, Eye, IndianRupee } from "lucide-react"
import type { Database } from "@/lib/supabase"

type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  car_images: { id: string; image_url: string; is_primary: boolean }[]
}

interface CarCardProps {
  car: Car
}

export function CarCard({ car }: CarCardProps) {
  const router = useRouter()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const primaryImage = car.car_images?.find((img) => img.is_primary)?.image_url || car.car_images?.[0]?.image_url

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage || "/placeholder.svg"}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-500">No image available</p>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {car.brand} {car.model}
            </h3>
            <p className="text-sm text-gray-600">{car.year}</p>
          </div>
          <Badge
            variant={car.status === "available" ? "default" : "secondary"}
            className={`${
              car.status === "available" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            } text-white`}
          >
            {car.status === "available" ? "Available" : "Sold"}
          </Badge>
        </div>
        <div className="flex items-center mb-3">
          
          <p className="text-xl font-bold text-purple-600">{formatPrice(car.price)}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Fuel className="w-4 h-4 mr-2" />
            <span className="capitalize">{car.fuel_type}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Gauge className="w-4 h-4 mr-2" />
            <span>{car.mileage.toLocaleString()} km</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => router.push(`/car/${car.id}`)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
