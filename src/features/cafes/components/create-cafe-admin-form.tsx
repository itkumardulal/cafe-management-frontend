"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { authPasswordToggleClass } from "@/src/features/auth/components/auth-page-shell";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { appToast } from "@/src/lib/toast";
import { useAppDispatch } from "@/src/store/hooks";
import { createCafeThunk } from "@/src/store/slices/cafe.slice";

export type CreateCafeAdminFormValues = {
  cafeName: string;
  email: string;
  password?: string;
  logo?: string;
  slug?: string;
  address?: string;
  contactNumber?: string;
};

type CreateCafeAdminFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function CreateCafeAdminForm({ onSuccess, onCancel }: CreateCafeAdminFormProps) {
  const dispatch = useAppDispatch();
  const [logoPreview, setLogoPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateCafeAdminFormValues>();

  const closeAndReset = () => {
    setShowPassword(false);
    setLogoPreview("");
    reset();
    onCancel();
  };

  const onSubmit = async (values: CreateCafeAdminFormValues) => {
    const hasPassword = Boolean(values.password?.trim());
    setSubmitting(true);
    try {
      const result = await dispatch(
        createCafeThunk({
          cafeName: values.cafeName,
          email: values.email,
          slug: values.slug,
          address: values.address,
          contactNumber: values.contactNumber,
          logo: values.logo,
          ...(hasPassword ? { password: values.password!.trim() } : {}),
        }),
      );
      if (createCafeThunk.fulfilled.match(result)) {
        appToast.success(
          hasPassword ? "Cafe admin created and credentials email sent" : "Invitation sent",
        );
        reset();
        setLogoPreview("");
        setShowPassword(false);
        onSuccess();
      } else if (createCafeThunk.rejected.match(result)) {
        appToast.error(result.payload ?? "Failed to create cafe admin");
      } else {
        appToast.error("Failed to create cafe admin");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-body">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Cafe profile</h3>
        <p className="text-xs text-muted">Basic cafe identity shown in admin views.</p>
      </div>

      <div className="form-grid">
        <Field
          id="cafeName"
          label="Cafe name"
          error={errors.cafeName?.message}
          hint="Used as the cafe admin display name in invitation emails"
          required
        >
          <Input
            {...register("cafeName", { required: "Cafe name is required" })}
            hasError={Boolean(errors.cafeName)}
            placeholder="Downtown Cafe"
          />
        </Field>
        <Field id="slug" label="Slug" error={errors.slug?.message} hint="Optional, auto-generated if blank">
          <Input {...register("slug")} placeholder="downtown-cafe" />
        </Field>
        <Field id="contactNumber" label="Contact number" error={errors.contactNumber?.message}>
          <Input
            {...register("contactNumber", {
              pattern: {
                value: /^[0-9+\-\s]{7,20}$/,
                message: "Enter a valid contact number",
              },
            })}
            hasError={Boolean(errors.contactNumber)}
            placeholder="+977 ..."
          />
        </Field>
        <Field id="address" label="Address" error={errors.address?.message}>
          <Input {...register("address")} placeholder="Street, city" />
        </Field>
        <ImageUploadField
          id="logoUpload"
          label="Cafe logo"
          error={errors.logo?.message}
          className="sm:col-span-2"
          value={logoPreview}
          onChange={(url) => {
            setValue("logo", url, { shouldDirty: true });
            setLogoPreview(url);
          }}
          assetType="logo"
          dropTitle="Drag & drop logo here"
          previewAlt="Cafe logo preview"
          uploadedLabel="Logo uploaded"
          onUploadingChange={setLogoUploading}
        />
        <input type="hidden" {...register("logo")} />
      </div>

      <div className="space-y-1 border-t border-(--color-border) pt-4">
        <h3 className="text-sm font-semibold text-foreground">Cafe admin account</h3>
        <p className="text-xs text-muted">Primary manager for this cafe.</p>
      </div>

      <div className="form-grid">
        <Field id="email" label="Admin email" error={errors.email?.message} required>
          <Input
            type="email"
            {...register("email", { required: "Admin email is required" })}
            autoComplete="email"
            hasError={Boolean(errors.email)}
            placeholder="admin@cafe.com"
          />
        </Field>
        <Field
          id="password"
          label="Password (optional)"
          hint="Empty = invitation link. Set = credentials emailed; admin changes password on first login."
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              autoComplete="new-password"
              placeholder="Leave empty to invite"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className={authPasswordToggleClass}
            >
              {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
        </Field>
      </div>

      <FormFooter>
        <Button type="button" variant="secondary" onClick={closeAndReset} disabled={submitting || logoUploading}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={logoUploading}>
          Create cafe admin
        </Button>
      </FormFooter>
    </form>
  );
}
