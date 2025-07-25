"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Database } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Loader2, Upload, X } from "lucide-react"

type Car = Database["public"]["Tables"]["cars"]["Row"]

interface SoldCarModalProps {
  car: Car
  isOpen: boolean
  onClose: () => void
  onSold: () => void
}

export function SoldCarModal({ car, isOpen, onClose, onSold }: SoldCarModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clientDocuments, setClientDocuments] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      // Upload client documents if any
      const documentUrls: string[] = []
      if (clientDocuments.length > 0) {
        for (const file of clientDocuments) {
          const fileName = `${Date.now()}-${file.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("client-documents")
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from("client-documents").getPublicUrl(fileName)

          documentUrls.push(publicUrl)
        }
      }

      // Create sale record
      const { error: saleError } = await supabase.from("sales").insert({
        car_id: car.id,
        vendor_id: car.vendor_id,
        client_name: formData.get("clientName") as string,
        client_email: formData.get("clientEmail") as string,
        client_phone: formData.get("clientPhone") as string,
        client_address: formData.get("clientAddress") as string,
        sale_date: formData.get("saleDate") as string,
        payment_method: formData.get("paymentMethod") as string,
        sale_price: Number.parseFloat(formData.get("salePrice") as string),
        client_documents: JSON.stringify(documentUrls),
      })

      if (saleError) throw saleError

      // Update car status
      const { error: updateError } = await supabase.from("cars").update({ status: "sold" }).eq("id", car.id)

      if (updateError) throw updateError

      toast({
        title: "Car marked as sold!",
        description: "Sale details have been recorded successfully.",
      })

      onSold()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setClientDocuments(Array.from(e.target.files))
    }
  }

  const removeDocument = (index: number) => {
    setClientDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Mark Car as Sold</DialogTitle>
          <p className="text-gray-600">
            {car.brand} {car.model} ({car.year})
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input id="clientName" name="clientName" required placeholder="Enter client's full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input id="clientEmail" name="clientEmail" type="email" required placeholder="Enter client's email" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input id="clientPhone" name="clientPhone" type="tel" placeholder="Enter client's phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date *</Label>
              <Input
                id="saleDate"
                name="saleDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Client Address</Label>
            <Textarea id="clientAddress" name="clientAddress" placeholder="Enter client's address" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select name="paymentMethod" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="financing">Financing</SelectItem>
                  <SelectItem value="trade_in">Trade-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price *</Label>
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                required
                defaultValue={car.price}
                placeholder="Enter final sale price"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientDocuments">Client Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                id="clientDocuments"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="clientDocuments" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload client documents (ID, license, etc.)</p>
              </label>
            </div>

            {clientDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Documents:</p>
                {clientDocuments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark as Sold"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
