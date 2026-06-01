"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthPageShell } from "@/src/features/auth/components/auth-page-shell";
import { OtpInput } from "@/src/features/auth/components/otp-input";
import { Button } from "@/src/components/ui/button";
import { appToast } from "@/src/lib/toast";
import { authPublicApi, unwrapData } from "@/src/services/auth-public-api";

const RESET_EMAIL_KEY = "cms.reset.email";
const RESET_TOKEN_KEY = "cms.reset.token";
const RESET_OTP_EXPIRES_KEY = "cms.reset.otpExpiresAt";

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [remainingMs, setRemainingMs] = useState(10 * 60 * 1000);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESET_EMAIL_KEY);
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(stored);
    const expires = Number(sessionStorage.getItem(RESET_OTP_EXPIRES_KEY) ?? 0);
    if (expires) {
      setRemainingMs(Math.max(0, expires - Date.now()));
    }
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const expires = Number(sessionStorage.getItem(RESET_OTP_EXPIRES_KEY) ?? 0);
      if (expires) {
        setRemainingMs(Math.max(0, expires - Date.now()));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      appToast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const response = await authPublicApi.post("/auth/verify-otp", { email, otp });
      const data = unwrapData<{ resetToken: string; expiresAt: string }>(response);
      sessionStorage.setItem(RESET_TOKEN_KEY, data.resetToken);
      appToast.success("OTP verified");
      router.push("/reset-password");
    } catch {
      appToast.error("Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  }, [email, otp, router]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authPublicApi.post("/auth/resend-otp", { email });
      sessionStorage.setItem(
        RESET_OTP_EXPIRES_KEY,
        String(Date.now() + 10 * 60 * 1000),
      );
      setRemainingMs(10 * 60 * 1000);
      appToast.success("If the account exists, an OTP has been sent.");
    } catch {
      appToast.error("Unable to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Verify OTP"
      subtitle="Enter the 6-digit code sent to your email."
    >
      <div className="space-y-3.5 sm:space-y-4">
        <p className="text-center text-sm text-muted">
          OTP expires in:{" "}
          <span className="font-mono font-semibold text-[var(--color-foreground)]">
            {formatCountdown(remainingMs)}
          </span>
        </p>
        <OtpInput value={otp} onChange={setOtp} disabled={loading || remainingMs <= 0} />
        <Button
          type="button"
          fullWidth
          loading={loading}
          disabled={remainingMs <= 0}
          onClick={() => void handleVerify()}
        >
          Verify OTP
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          loading={resendLoading}
          onClick={() => void handleResend()}
        >
          Resend OTP
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/forgot-password" className="font-medium underline">
            Use a different email
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
