import { AuthPageShell } from "@/src/features/auth/components/auth-page-shell";
import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";

export default function ResetPasswordLoading() {
  return (
    <AuthPageShell title="Reset Password" subtitle="Loading…">
      <FormSkeleton />
    </AuthPageShell>
  );
}
