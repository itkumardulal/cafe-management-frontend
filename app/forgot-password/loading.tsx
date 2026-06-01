import { AuthPageShell } from "@/src/features/auth/components/auth-page-shell";
import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";

export default function ForgotPasswordLoading() {
  return (
    <AuthPageShell title="Forgot Password" subtitle="Loading…">
      <FormSkeleton />
    </AuthPageShell>
  );
}
