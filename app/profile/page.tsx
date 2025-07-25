"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Loader2, Upload, AlertCircle, Car, TrendingUp, Calendar, Users, Phone, Mail, IndianRupee } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DashboardStats {
  totalCars: number
  availableCars: number
  soldCars: number
  totalRevenue: number
  recentSales: Array<{
    id: string
    car_brand: string
    car_model: string
    car_year: number
    sale_price: number
    sale_date: string
    client_name: string
  }>
}

interface Customer {
  id: string
  client_name: string
  client_email: string
  client_phone: string | null
  client_address: string | null
  sale_price: number
  sale_date: string
  payment_method: string
  car_brand: string
  car_model: string
  car_year: number
  car_color: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalCars: 0,
    availableCars: 0,
    soldCars: 0,
    totalRevenue: 0,
    recentSales: [],
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
      setProfilePhotoPreview(user.profile_photo || null)
      loadDashboardStats()
      loadCustomers()
    }
  }, [user])

  // Set up real-time subscription for sales updates
  useEffect(() => {
    if (!user) return

    const salesSubscription = supabase
      .channel("sales_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sales",
          filter: `vendor_id=eq.${user.id}`,
        },
        () => {
          // Reload stats and customers when sales change
          loadDashboardStats()
          loadCustomers()
        },
      )
      .subscribe()

    const carsSubscription = supabase
      .channel("cars_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cars",
          filter: `vendor_id=eq.${user.id}`,
        },
        () => {
          // Reload stats when car status changes
          loadDashboardStats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(salesSubscription)
      supabase.removeChannel(carsSubscription)
    }
  }, [user])

  const loadDashboardStats = async () => {
    if (!user) return

    try {
      setStatsLoading(true)

      // Get car statistics
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id, status, price")
        .eq("vendor_id", user.id)

      if (carsError) throw carsError

      // Get sales data with car information
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(
          `
          id,
          sale_price,
          sale_date,
          client_name,
          cars (
            brand,
            model,
            year
          )
        `,
        )
        .eq("vendor_id", user.id)
        .order("sale_date", { ascending: false })
        .limit(5)

      if (salesError) throw salesError

      const totalCars = cars?.length || 0
      const availableCars = cars?.filter((car) => car.status === "available").length || 0
      const soldCars = cars?.filter((car) => car.status === "sold").length || 0

      // Calculate total revenue from sales
      const { data: allSales, error: revenueError } = await supabase
        .from("sales")
        .select("sale_price")
        .eq("vendor_id", user.id)

      if (revenueError) throw revenueError

      const totalRevenue = allSales?.reduce((sum, sale) => sum + (sale.sale_price || 0), 0) || 0

      // Format recent sales data
      const recentSales =
        sales?.map((sale) => ({
          id: sale.id,
          car_brand: sale.cars?.brand || "Unknown",
          car_model: sale.cars?.model || "Unknown",
          car_year: sale.cars?.year || 0,
          sale_price: sale.sale_price || 0,
          sale_date: sale.sale_date,
          client_name: sale.client_name,
        })) || []

      setDashboardStats({
        totalCars,
        availableCars,
        soldCars,
        totalRevenue,
        recentSales,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const loadCustomers = async () => {
    if (!user) return

    try {
      setCustomersLoading(true)

      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          id,
          client_name,
          client_email,
          client_phone,
          client_address,
          sale_price,
          sale_date,
          payment_method,
          cars (
            brand,
            model,
            year,
            color
          )
        `,
        )
        .eq("vendor_id", user.id)
        .order("sale_date", { ascending: false })

      if (error) throw error

      const customersData: Customer[] =
        sales?.map((sale) => ({
          id: sale.id,
          client_name: sale.client_name,
          client_email: sale.client_email,
          client_phone: sale.client_phone,
          client_address: sale.client_address,
          sale_price: sale.sale_price,
          sale_date: sale.sale_date,
          payment_method: sale.payment_method,
          car_brand: sale.cars?.brand || "Unknown",
          car_model: sale.cars?.model || "Unknown",
          car_year: sale.cars?.year || 0,
          car_color: sale.cars?.color || "Unknown",
        })) || []

      setCustomers(customersData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load customers data",
        variant: "destructive",
      })
    } finally {
      setCustomersLoading(false)
    }
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfilePhoto(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfilePhotoPreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const updates: { full_name: string; phone?: string; profile_photo?: string } = {
        full_name: fullName,
        phone: phone || null,
      }

      // Upload profile photo if changed
      if (profilePhoto) {
        const fileName = `${user.id}/${Date.now()}-${profilePhoto.name}`
        const { error: uploadError } = await supabase.storage.from("profile-photos").upload(fileName, profilePhoto)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(fileName)

        updates.profile_photo = publicUrl
      }

      // Update profile
      const { error: updateError } = await supabase.from("vendors").update(updates).eq("id", user.id)

      if (updateError) throw updateError

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      // Refresh page to update user context
      window.location.reload()
    } catch (error: any) {
      setError(error.message || "An error occurred while updating your profile")
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPasswordLoading(true)
    setPasswordError(null)

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      setIsPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      setIsPasswordLoading(false)
      return
    }

    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        setPasswordError("Current password is incorrect")
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setPasswordError(error.message || "An error occurred while updating your password")
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating your password",
        variant: "destructive",
      })
    } finally {
      setIsPasswordLoading(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      cash: "bg-green-100 text-green-800",
      bank_transfer: "bg-blue-100 text-blue-800",
      check: "bg-yellow-100 text-yellow-800",
      financing: "bg-purple-100 text-purple-800",
      trade_in: "bg-orange-100 text-orange-800",
    }
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <AuthGuard>
      <MainLayout defaultTab="profile">
        <Tabs defaultValue="overview" className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile & Business Overview</h1>
            <div className="text-gray-600 mt-1">Manage your account settings and view your business performance</div>
          </div>

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Car className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-600">Total Cars</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          <span>{dashboardStats.totalCars}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-600">Available</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          dashboardStats.availableCars
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-600">Sold</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          dashboardStats.soldCars
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <IndianRupee className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-600">Total Revenue</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                        ) : (
                          formatPrice(dashboardStats.totalRevenue)
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Your latest car sales</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="bg-gray-200 h-12 w-12 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                          <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                        </div>
                        <div className="bg-gray-200 h-4 w-20 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : dashboardStats.recentSales.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardStats.recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Car className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {sale.car_brand} {sale.car_model} ({sale.car_year})
                            </div>
                            <div className="text-sm text-gray-500">
                              Sold to {sale.client_name} • {formatDate(sale.sale_date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{formatPrice(sale.sale_price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <div className="text-gray-500">No sales yet</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Database ({customers.length} customers)
                </CardTitle>
                <CardDescription>All customers who have purchased cars from you</CardDescription>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gray-200 h-12 w-12 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                            <div className="bg-gray-200 h-3 w-1/3 rounded"></div>
                            <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
                          </div>
                          <div className="bg-gray-200 h-6 w-20 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : customers.length > 0 ? (
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {customer.client_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{customer.client_name}</h3>
                                <Badge className={getPaymentMethodBadge(customer.payment_method)}>
                                  {customer.payment_method.replace("_", " ").toUpperCase()}
                                </Badge>
                              </div>

                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>{customer.client_email}</span>
                                </div>
                                {customer.client_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{customer.client_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  <span>
                                    {customer.car_brand} {customer.car_model} ({customer.car_year}) -{" "}
                                    {customer.car_color}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Purchased on {formatDate(customer.sale_date)}</span>
                                </div>
                                {customer.client_address && (
                                  <div className="text-xs text-gray-500 mt-1">Address: {customer.client_address}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{formatPrice(customer.sale_price)}</div>
                            <div className="text-xs text-gray-500">Amount Paid</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                    <div className="text-gray-500">
                      When you sell your first car, customer information will appear here.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={email} disabled className="bg-gray-50" />
                      <div className="text-xs text-gray-500">Email cannot be changed</div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <CardDescription>Update your profile picture</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32 border-4 border-purple-100">
                    <AvatarImage src={profilePhotoPreview || ""} alt={fullName} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-2xl">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full">
                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                    <Label htmlFor="profile-photo" className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
                        asChild
                      >
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </span>
                      </Button>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                  {passwordError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      disabled={isPasswordLoading}
                    >
                      {isPasswordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </MainLayout>
    </AuthGuard>
  )
}
