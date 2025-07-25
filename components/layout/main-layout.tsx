"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, Car, User } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
  defaultTab?: string
}

export function MainLayout({ children, defaultTab = "dashboard" }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Update active tab based on current path
  useEffect(() => {
    if (pathname.startsWith("/dashboard")) {
      setActiveTab("dashboard")
    } else if (pathname.startsWith("/cars")) {
      setActiveTab("cars")
    } else if (pathname.startsWith("/profile")) {
      setActiveTab("profile")
    }
  }, [pathname])

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Navigate to the appropriate page
    switch (value) {
      case "dashboard":
        router.push("/dashboard")
        break
      case "cars":
        router.push("/cars")
        break
      case "profile":
        router.push("/profile")
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 to-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-lg border-0 h-14">
            <TabsTrigger
              value="dashboard"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white h-12 rounded-lg transition-all duration-300"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="cars"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white h-12 rounded-lg transition-all duration-300"
            >
              <Car className="w-5 h-5" />
              <span className="hidden sm:inline">Car Listing</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white h-12 rounded-lg transition-all duration-300"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>
          {children}
        </Tabs>
      </div>
    </div>
  )
}
