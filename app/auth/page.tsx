import { AuthForms } from "@/components/auth/auth-forms"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthForms />
    </AuthGuard>
  )
}
