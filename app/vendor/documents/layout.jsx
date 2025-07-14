import ProtectedRoute from "@/components/protected-route"

export default function DocumentsLayout({ children }) {
  return <ProtectedRoute requiredRole="vendor">{children}</ProtectedRoute>
}
