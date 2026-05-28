"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { loginSchema, type LoginSchemaType } from "@/src/features/auth/schemas/login.schema";
import { appToast } from "@/src/lib/toast";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { loginThunk } from "@/src/store/slices/auth.slice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const loading = useAppSelector((state) => state.auth.loading);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true,
      csrfToken:
        typeof window !== "undefined" ? window.crypto.randomUUID() : "csrf-seed",
    },
  });

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
      appToast.success("Login successful");
      router.replace("/dashboard");
      return;
    }
    appToast.error("Failed to login");
    setApiError("Unable to login. Please verify your credentials.");
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(onSubmit)(event);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--color-background)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/logo.jpeg"
          alt="Cafe interior"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-black/20 to-transparent" />
      </div>
      <div className="relative z-10 flex items-center justify-center px-3 py-6 sm:px-8 sm:py-8">
        <Card className="w-full max-w-md rounded-2xl sm:rounded-3xl">
          <h1 className="heading-display text-[var(--color-foreground)]">Welcome back</h1>
          <p className="mt-2 text-muted">
            Sign in to manage your cafe operations.
          </p>

          <form
            method="post"
            action="/login"
            onSubmit={handleFormSubmit}
            className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4"
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
                  className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-cream-100)]"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="pointer-events-none" />
                  ) : (
                    <Eye size={16} className="pointer-events-none" />
                  )}
                </button>
              </div>
            </Field>

            <label className="touch-target inline-flex items-center gap-2 rounded-lg px-1 text-sm text-[var(--color-muted)]">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 rounded border-[var(--color-input)]"
              />
              Remember me
            </label>

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
        </Card>
      </div>
    </div>
  );
}
