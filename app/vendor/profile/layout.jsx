import ProtectedRoute from "@/components/protected-route"

export default function ProfileLayout({ children }) {
  return <ProtectedRoute requiredRole="vendor">{children}</ProtectedRoute>
}
