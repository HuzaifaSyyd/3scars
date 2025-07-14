import ProtectedRoute from "@/components/protected-route"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"

export default function SettingsLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="vendor">
      <div className="min-h-screen">
        <VendorSidebar />
        <main className="pt-0">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
