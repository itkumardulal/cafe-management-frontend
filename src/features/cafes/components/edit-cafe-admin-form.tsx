"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormFooter } from "@/src/components/shared/form-footer";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export type EditCafeAdminFormValues = {
  cafeName: string;
  adminName: string;
  email: string;
  slug?: string;
  address?: string;
  contactNumber?: string;
  logo?: string;
};

export type EditCafeAdminRecord = {
  cafeId: string;
  cafeName: string;
  adminName: string;
  adminEmail: string;
  slug?: string;
  address?: string | null;
  contactNumber?: string | null;
  logo?: string | null;
};

type EditCafeAdminFormProps = {
  record: EditCafeAdminRecord;
  onSuccess: () => void;
  onCancel: () => void;
};

export function EditCafeAdminForm({ record, onSuccess, onCancel }: EditCafeAdminFormProps) {
  const [logoPreview, setLogoPreview] = useState(record.logo ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditCafeAdminFormValues>({
    defaultValues: {
      cafeName: record.cafeName,
      adminName: record.adminName,
      email: record.adminEmail,
      slug: record.slug ?? "",
      address: record.address ?? "",
      contactNumber: record.contactNumber ?? "",
      logo: record.logo ?? "",
    },
  });

  useEffect(() => {
    reset({
      cafeName: record.cafeName,
      adminName: record.adminName,
      email: record.adminEmail,
      slug: record.slug ?? "",
      address: record.address ?? "",
      contactNumber: record.contactNumber ?? "",
      logo: record.logo ?? "",
    });
    setLogoPreview(record.logo ?? "");
  }, [record, reset]);

  const onSubmit = async (values: EditCafeAdminFormValues) => {
    setSubmitting(true);
    try {
      await operationsApi.cafes.update(record.cafeId, {
        cafeName: values.cafeName.trim(),
        adminName: values.adminName.trim(),
        email: values.email.trim(),
        slug: values.slug?.trim() || undefined,
        address: values.address?.trim() || undefined,
        contactNumber: values.contactNumber?.trim() || undefined,
        logo: values.logo || undefined,
      });
      appToast.success("Cafe admin updated");
      onSuccess();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to update cafe admin"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Cafe profile</h3>
        <p className="text-xs text-muted">Update cafe identity and contact details.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="cafeName"
          label="Cafe name"
          error={errors.cafeName?.message}
          required
        >
          <Input
            {...register("cafeName", { required: "Cafe name is required" })}
            hasError={Boolean(errors.cafeName)}
          />
        </Field>
        <Field id="slug" label="Slug" error={errors.slug?.message}>
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
        <p className="text-xs text-muted">Update the primary manager for this cafe.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="adminName" label="Admin name" error={errors.adminName?.message} required>
          <Input
            {...register("adminName", { required: "Admin name is required" })}
            hasError={Boolean(errors.adminName)}
          />
        </Field>
        <Field id="email" label="Admin email" error={errors.email?.message} required>
          <Input
            type="email"
            {...register("email", { required: "Admin email is required" })}
            autoComplete="email"
            hasError={Boolean(errors.email)}
          />
        </Field>
      </div>

      <FormFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting || logoUploading}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={logoUploading}>
          Save changes
        </Button>
      </FormFooter>
    </form>
  );
}
