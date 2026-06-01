"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthPageShell, authPasswordToggleClass } from "@/src/features/auth/components/auth-page-shell";
import { PasswordChecklist } from "@/src/features/auth/components/password-checklist";
import {
  resetPasswordSchema,
  type ResetPasswordSchemaType,
} from "@/src/features/auth/schemas/reset-password.schema";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { appToast } from "@/src/lib/toast";
import { authPublicApi } from "@/src/services/auth-public-api";

const RESET_TOKEN_KEY = "cms.reset.token";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", resetToken: "" },
  });

  const password = watch("password") ?? "";

  useEffect(() => {
    const token = sessionStorage.getItem(RESET_TOKEN_KEY);
    if (!token) {
      router.replace("/forgot-password");
      return;
    }
    setResetToken(token);
    setValue("resetToken", token);
  }, [router, setValue]);

  const onSubmit = async (values: ResetPasswordSchemaType) => {
    setLoading(true);
    try {
      await authPublicApi.post("/auth/reset-password", {
        resetToken: values.resetToken,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      sessionStorage.removeItem(RESET_TOKEN_KEY);
      sessionStorage.removeItem("cms.reset.email");
      sessionStorage.removeItem("cms.reset.otpExpiresAt");
      appToast.success("Password reset successful.");
      router.replace("/login");
    } catch {
      appToast.error("Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell title="Reset Password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
        <input type="hidden" {...register("resetToken")} value={resetToken} />
        <Field id="password" label="New Password" error={errors.password?.message} required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              autoComplete="new-password"
              hasError={Boolean(errors.password)}
              className="pr-12"
            />
            <button
              type="button"
              className={authPasswordToggleClass}
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
        </Field>
        <PasswordChecklist password={password} />
        <Field
          id="confirmPassword"
          label="Confirm Password"
          error={errors.confirmPassword?.message}
          required
        >
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword")}
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              className="pr-12"
            />
            <button
              type="button"
              className={authPasswordToggleClass}
              onClick={() => setShowConfirm((p) => !p)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              aria-pressed={showConfirm}
            >
              {showConfirm ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
        </Field>
        <Button type="submit" loading={loading} fullWidth>
          Reset Password
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-medium underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
