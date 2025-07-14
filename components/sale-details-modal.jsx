"use client"

import { useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Mail, MapPin, Calendar, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SaleDetailsModal({ listing, onSaleComplete, trigger }) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saleData, setSaleData] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerAddress: "",
    sellerName: "",
    sellerEmail: "",
    sellerPhone: "",
    sellerAddress: "",
    saleAmount: listing?.price || "",
    saleDate: new Date().toISOString().split("T")[0], // Default to today's date
    notes: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSaleData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/listings/${listing._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "sold",
          saleDetails: {
            ...saleData,
            saleDate: new Date(saleData.saleDate).toISOString(),
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Car marked as sold successfully",
        })
        setIsOpen(false)
        onSaleComplete?.(data.listing)
      } else {
        throw new Error("Failed to update sale details")
      }
    } catch (error) {
      console.error("Error updating sale details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update sale details",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If listing is already sold, show sale details
  if (listing?.status === "sold" && listing?.saleDetails) {
    return (
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalTrigger asChild>{trigger}</ModalTrigger>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <span className="text-green-600 font-bold text-lg">₹</span>
              Sale Details - {listing.make} {listing.model}
            </ModalTitle>
          </ModalHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                  <p className="font-medium">{listing.saleDetails.buyerName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <p className="font-medium">{listing.saleDetails.buyerEmail}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  <p className="font-medium">{listing.saleDetails.buyerPhone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Address
                  </Label>
                  <p className="font-medium">{listing.saleDetails.buyerAddress}</p>
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
                  <p className="font-medium">{listing.saleDetails.sellerName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <p className="font-medium">{listing.saleDetails.sellerEmail}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  <p className="font-medium">{listing.saleDetails.sellerPhone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Address
                  </Label>
                  <p className="font-medium">{listing.saleDetails.sellerAddress}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sale Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-green-600 font-bold text-lg">₹</span>
                Sale Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Sale Amount</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg font-bold text-green-600">
                    ₹{listing.saleDetails.saleAmount?.toLocaleString()}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Sale Date
                </Label>
                <p className="font-medium">{new Date(listing.saleDetails.saleDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge className="bg-green-100 text-green-800">Sold</Badge>
              </div>
            </CardContent>
            {listing.saleDetails.notes && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{listing.saleDetails.notes}</p>
                </div>
              </CardContent>
            )}
          </Card>
        </ModalContent>
      </Modal>
    )
  }

  // If listing is available, show form to mark as sold
  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>{trigger}</ModalTrigger>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <span className="text-primary font-bold text-lg">₹</span>
            Mark as Sold - {listing?.make} {listing?.model}
          </ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="mt-4">
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
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerEmail">Email *</Label>
                  <Input
                    id="buyerEmail"
                    name="buyerEmail"
                    type="email"
                    value={saleData.buyerEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerPhone">Phone Number *</Label>
                  <Input
                    id="buyerPhone"
                    name="buyerPhone"
                    value={saleData.buyerPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerAddress">Address *</Label>
                  <Textarea
                    id="buyerAddress"
                    name="buyerAddress"
                    value={saleData.buyerAddress}
                    onChange={handleInputChange}
                    rows={3}
                    required
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
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">Email *</Label>
                  <Input
                    id="sellerEmail"
                    name="sellerEmail"
                    type="email"
                    value={saleData.sellerEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerPhone">Phone Number *</Label>
                  <Input
                    id="sellerPhone"
                    name="sellerPhone"
                    value={saleData.sellerPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerAddress">Address *</Label>
                  <Textarea
                    id="sellerAddress"
                    name="sellerAddress"
                    value={saleData.sellerAddress}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sale Details */}
          <Card className="mt-6">
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
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Sale Date *</Label>
                  <Input
                    id="saleDate"
                    name="saleDate"
                    type="date"
                    value={saleData.saleDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Listed Price</Label>
                  <p className="text-sm font-medium text-muted-foreground bg-muted p-2 rounded">
                    ₹{listing?.price?.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={saleData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any additional information about the sale..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Mark as Sold
                </>
              )}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
