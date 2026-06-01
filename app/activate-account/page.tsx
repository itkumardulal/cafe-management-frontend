"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthPageShell, authPasswordToggleClass } from "@/src/features/auth/components/auth-page-shell";
import { PasswordChecklist } from "@/src/features/auth/components/password-checklist";
import {
  activateSchema,
  type ActivateSchemaType,
} from "@/src/features/auth/schemas/activate.schema";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";
import { appToast } from "@/src/lib/toast";
import { authPublicApi, clearAuthSession, unwrapData } from "@/src/services/auth-public-api";

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ActivateSchemaType>({
    resolver: zodResolver(activateSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const password = watch("password") ?? "";

  useEffect(() => {
    setValue("token", token);
  }, [token, setValue]);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      setValidating(false);
      return;
    }
    void (async () => {
      try {
        const response = await authPublicApi.get("/auth/invitation/validate", {
          params: { token },
        });
        const data = unwrapData<{ email: string }>(response);
        setEmail(data.email);
      } catch {
        setInvalidToken(true);
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  const onSubmit = async (values: ActivateSchemaType) => {
    setLoading(true);
    try {
      await authPublicApi.post("/auth/activate-account", {
        token: values.token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      await clearAuthSession();
      const loginUrl = `/login?activated=1&email=${encodeURIComponent(email)}`;
      router.push(loginUrl);
    } catch {
      appToast.error("Activation failed");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <AuthPageShell compact title="Activate your account" subtitle="Checking your invitation link…">
        <FormSkeleton />
      </AuthPageShell>
    );
  }

  if (invalidToken) {
    return (
      <AuthPageShell
        compact
        title="Link unavailable"
        subtitle="This activation link is invalid or has expired. Ask your administrator to send a new invitation."
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] text-[var(--color-muted)]">
            <AlertCircle size={20} strokeWidth={1.75} aria-hidden />
          </div>
          <Button type="button" fullWidth onClick={() => router.push("/login")}>
            Back to sign in
          </Button>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      compact
      title="Create your password"
      subtitle={
        <>
          Finish setup for{" "}
          <span className="font-medium text-[var(--color-foreground)]">{email}</span>.
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <input type="hidden" {...register("token")} />

        <Field
          id="password"
          label="Create password"
          error={errors.password?.message}
          required
          reserveErrorSpace={false}
          className="space-y-1"
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              autoComplete="new-password"
              hasError={Boolean(errors.password)}
              className="pr-11"
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

        <PasswordChecklist password={password} compact />

        <Field
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
          required
          reserveErrorSpace={false}
          className="space-y-1"
        >
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword")}
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              className="pr-11"
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

        <div className="space-y-2 pt-0.5">
          <Button type="submit" loading={loading} fullWidth>
            Activate account
          </Button>
          <p className="text-center text-xs text-muted">
            Already activated?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--color-foreground)] underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthPageShell>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell compact title="Activate your account" subtitle="Loading…">
          <FormSkeleton />
        </AuthPageShell>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
