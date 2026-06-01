"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthPageShell } from "@/src/features/auth/components/auth-page-shell";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchemaType,
} from "@/src/features/auth/schemas/forgot-password.schema";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { appToast } from "@/src/lib/toast";
import { authPublicApi, unwrapData } from "@/src/services/auth-public-api";

const RESET_EMAIL_KEY = "cms.reset.email";
const RESET_OTP_EXPIRES_KEY = "cms.reset.otpExpiresAt";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordSchemaType) => {
    setLoading(true);
    try {
      await authPublicApi.post("/auth/forgot-password", { email: values.email });
      sessionStorage.setItem(RESET_EMAIL_KEY, values.email.toLowerCase().trim());
      sessionStorage.setItem(
        RESET_OTP_EXPIRES_KEY,
        String(Date.now() + 10 * 60 * 1000),
      );
      setSubmitted(true);
      appToast.success("If the account exists, an OTP has been sent.");
      router.push("/verify-otp");
    } catch {
      appToast.error("Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Forgot Password"
      subtitle={
        submitted
          ? "If the account exists, an OTP has been sent."
          : "Enter your email and we will send a verification code if an account exists."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
        <Field id="email" label="Email Address" error={errors.email?.message} required>
          <Input
            type="email"
            {...register("email")}
            autoComplete="email"
            hasError={Boolean(errors.email)}
          />
        </Field>
        <Button type="submit" loading={loading} fullWidth>
          Send OTP
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-[var(--color-foreground)] underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthPageShell>
  );
}
