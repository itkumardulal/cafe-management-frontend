"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthPageShell, authPasswordToggleClass } from "@/src/features/auth/components/auth-page-shell";
import { PasswordChecklist } from "@/src/features/auth/components/password-checklist";
import { passwordWithConfirmSchema } from "@/src/features/auth/schemas/password.schema";
import { z } from "zod";
import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { appToast } from "@/src/lib/toast";
import { api } from "@/src/services/api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { meThunk } from "@/src/store/slices/auth.slice";

const schema = passwordWithConfirmSchema;

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordFirstPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password") ?? "";

  useEffect(() => {
    if (!initialized) {
      void dispatch(meThunk());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
      return;
    }
    if (initialized && user && !user.mustChangePassword) {
      router.replace("/dashboard");
    }
  }, [initialized, router, user]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await api.post("/auth/change-required-password", {
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      await dispatch(meThunk());
      appToast.success("Password updated. Welcome!");
      router.replace("/dashboard");
    } catch {
      appToast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !user?.mustChangePassword) {
    return (
      <AuthPageShell title="Set a new password" subtitle="Loading your account…">
        <FormSkeleton />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Set a new password"
      subtitle="Your administrator created your account with a temporary password. Choose a new password to continue."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
        <Field id="password" label="New password" error={errors.password?.message} required>
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
          label="Confirm password"
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
          Save and continue
        </Button>
      </form>
    </AuthPageShell>
  );
}
