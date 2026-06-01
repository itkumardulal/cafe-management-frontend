"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AuthPageShell,
  authPasswordToggleClass,
} from "@/src/features/auth/components/auth-page-shell";
import { loginSchema, type LoginSchemaType } from "@/src/features/auth/schemas/login.schema";
import { FormSkeleton } from "@/src/components/skeletons/form-skeleton";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { appToast } from "@/src/lib/toast";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { loginThunk, logoutThunk } from "@/src/store/slices/auth.slice";

function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loading = useAppSelector((state) => state.auth.loading);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const activated = searchParams.get("activated") === "1";
  const emailFromQuery = searchParams.get("email") ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      rememberMe: true,
      csrfToken:
        typeof window !== "undefined" ? window.crypto.randomUUID() : "csrf-seed",
    },
  });

  useEffect(() => {
    if (emailFromQuery) {
      setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, setValue]);

  useEffect(() => {
    if (activated) {
      void dispatch(logoutThunk());
    }
  }, [activated, dispatch]);

  const onSubmit = async (values: LoginSchemaType) => {
    setApiError("");
    const result = await dispatch(
      loginThunk({
        email: values.email,
        password: values.password,
        csrfToken: values.csrfToken,
      }),
    );
    if (loginThunk.fulfilled.match(result)) {
      const authUser = result.payload;
      router.replace(
        authUser.mustChangePassword ? "/change-password-first" : "/dashboard",
      );
      return;
    }
    appToast.error("Failed to login");
    setApiError("Unable to login. Please verify your credentials.");
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(onSubmit)(event);
  };

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to manage your cafe operations."
      banner={
        activated ? (
          <p
            role="status"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2.5 text-sm text-[var(--color-foreground)]"
          >
            Your account is activated. Sign in with the password you just created.
          </p>
        ) : undefined
      }
    >
      <form
        method="post"
        action="/login"
        onSubmit={handleFormSubmit}
        className="space-y-3.5 sm:space-y-4"
        aria-live="polite"
      >
        <input type="hidden" {...register("csrfToken")} />
        <Field id="email" label="Email" error={errors.email?.message} required>
          <Input
            type="email"
            {...register("email")}
            autoComplete="username"
            hasError={Boolean(errors.email)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password?.message} required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              autoComplete="current-password"
              hasError={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pr-12"
            />
            <button
              type="button"
              className={authPasswordToggleClass}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={16} className="pointer-events-none" aria-hidden />
              ) : (
                <Eye size={16} className="pointer-events-none" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="touch-target inline-flex items-center gap-2 rounded-lg px-1 text-sm text-[var(--color-muted)]">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-[var(--color-input)]"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="touch-target inline-flex items-center text-sm font-medium text-[var(--color-foreground)] underline-offset-2 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {apiError ? (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {apiError}
          </motion.p>
        ) : null}

        <Button
          type="submit"
          loading={loading}
          fullWidth
          aria-label="Sign in to your account"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell title="Welcome back" subtitle="Sign in to manage your cafe operations.">
          <FormSkeleton />
        </AuthPageShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
