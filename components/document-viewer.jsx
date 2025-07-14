"use client"

import { useState } from "react"
import Image from "next/image"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Eye, Download, FileText } from "lucide-react"

export function DocumentViewer({ document, listingId }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!document || !document._id || !document.contentType || !listingId) {
    return null
  }

  const isImage = document.contentType.startsWith("image/")
  const isPdf = document.contentType === "application/pdf"
  const documentUrl = `/api/listings/${listingId}/documents/${document._id}`

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="mr-2 h-3 w-3" />
          View
        </Button>
      </ModalTrigger>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <ModalHeader>
          <ModalTitle>
            {document.name} - {document.type}
          </ModalTitle>
        </ModalHeader>
        <div className="mt-4">
          {isImage ? (
            <div className="relative w-full h-[60vh]">
              <Image
                src={documentUrl || "/placeholder.svg"}
                alt={document.name || "Document"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${documentUrl}#toolbar=0&navpanes=0`}
              className="w-full h-[60vh]"
              title={document.name || "PDF Document"}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p>This document type cannot be previewed</p>
              <p className="text-sm text-muted-foreground mt-2">Type: {document.contentType}</p>
              <Button asChild className="mt-4">
                <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button asChild variant="outline">
            <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
