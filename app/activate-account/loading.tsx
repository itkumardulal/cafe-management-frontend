import { AuthPageShell } from "@/src/features/auth/components/auth-page-shell";
import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";

export default function ActivateAccountLoading() {
  return (
    <AuthPageShell compact title="Activate your account" subtitle="Loading…">
      <FormSkeleton />
    </AuthPageShell>
  );
}
