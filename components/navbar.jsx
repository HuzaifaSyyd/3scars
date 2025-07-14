"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Car, Home, FileText, Settings, User, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Don't show navbar on auth pages
  if (pathname.startsWith("/auth")) {
    return null
  }

  const isVendorRoute = pathname.startsWith("/vendor")
  const isAdminRoute = pathname.startsWith("/admin")

  const vendorRoutes = [
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
      label: "Documents",
      icon: FileText,
      href: "/vendor/documents",
      active: pathname.includes("/vendor/documents"),
    },
    {
      label: "Profile",
      icon: User,
      href: "/vendor/profile",
      active: pathname === "/vendor/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/vendor/settings",
      active: pathname === "/vendor/settings",
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href={user ? (user.role === "admin" ? "/admin/dashboard" : "/vendor/dashboard") : "/"}
          className="flex items-center gap-2"
        >
          <Car className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            3S-CARS
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        {user && (isVendorRoute || isAdminRoute) && (
          <div className="hidden md:flex items-center gap-6">
            {isVendorRoute &&
              vendorRoutes.map((route) => (
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
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
