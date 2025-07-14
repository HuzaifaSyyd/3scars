"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Car, Home, LogOut, Menu, Settings, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useState } from "react"

const VendorSidebar = () => {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Only show on vendor routes
  if (!pathname.startsWith("/vendor")) {
    return null
  }

  // Simplified navigation - removed Documents and Profile tabs
  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/vendor/dashboard",
      active: pathname === "/vendor/dashboard",
    },
    {
      label: "Car Listings",
      icon: Car,
      href: "/vendor/listings",
      active: pathname.includes("/vendor/listings"),
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/vendor/settings",
      active: pathname === "/vendor/settings",
    },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col space-y-2 py-4 bg-card">
      <div className="px-3 py-2 flex items-center justify-between mb-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            3S-CARS
          </span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary">Vendor Portal</h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={route.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-all hover:bg-primary/10",
                route.active ? "bg-primary/10 text-primary border-r-2 border-primary" : "",
              )}
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link href={route.href}>
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2 space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-primary text-white hover:bg-primary/90">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Logo - Desktop */}
          <Link href="/vendor/dashboard" className="hidden md:flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              3S-CARS
            </span>
          </Link>

          {/* Logo - Mobile (centered) */}
          <Link
            href="/vendor/dashboard"
            className="md:hidden flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2"
          >
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              3S-CARS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  route.active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block text-sm text-muted-foreground">{user?.name}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </nav>
    </>
  )
}

export { VendorSidebar }
