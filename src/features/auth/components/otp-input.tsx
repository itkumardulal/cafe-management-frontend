"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@/src/components/ui/input";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
};

const OTP_LENGTH = 6;

export function OtpInput({ value, onChange, disabled, hasError }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? ""),
  );
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? ""));
  }, [value]);

  const emit = useCallback(
    (next: string[]) => {
      onChange(next.join("").slice(0, OTP_LENGTH));
    },
    [onChange],
  );

  const updateDigit = (index: number, char: string) => {
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    emit(next);
    if (char && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? "");
    setDigits(next);
    emit(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <div
      className="mx-auto grid w-full max-w-xs grid-cols-6 gap-1.5 sm:max-w-sm sm:gap-2"
      role="group"
      aria-label="Verification code"
    >
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          hasError={hasError}
          className="h-11 min-h-11 w-full min-w-0 text-center text-base font-semibold tracking-widest sm:h-12 sm:text-lg"
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            updateDigit(index, v);
          }}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
