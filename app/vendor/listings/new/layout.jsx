import ProtectedRoute from "@/components/protected-route"

export default function NewListingLayout({ children }) {
  return <ProtectedRoute requiredRole="vendor">{children}</ProtectedRoute>
}
