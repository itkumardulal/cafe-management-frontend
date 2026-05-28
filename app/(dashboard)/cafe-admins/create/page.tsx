"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Eye, EyeOff, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { appToast } from "@/src/lib/toast";
import { api } from "@/src/services/api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { createCafeThunk, fetchManagedCafesThunk } from "@/src/store/slices/cafe.slice";

type CreateCafeFormValues = {
  cafeName: string;
  email: string;
  password: string;
  logo?: string;
  slug?: string;
  address?: string;
  contactNumber?: string;
};

export default function CreateCafeAdminPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.cafe.loading);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateCafeFormValues>();

  if (user?.role !== "SUPER_ADMIN") {
    return <NotAuthorized description="Only Super Admin can create cafe admins." />;
  }

  const onSubmit = async (values: CreateCafeFormValues) => {
    const submitPromise = dispatch(createCafeThunk(values));
    appToast.promise(submitPromise.unwrap(), {
      loading: "Creating cafe admin...",
      success: "Cafe admin created successfully",
      error: "Failed to create cafe admin",
    });
    const result = await submitPromise;
    if (createCafeThunk.fulfilled.match(result)) {
      void dispatch(fetchManagedCafesThunk());
      router.push("/cafe-admins");
    }
  };

  const uploadLogoFile = async (file: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      appToast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      appToast.error("Image size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", "logo");

    setLogoUploading(true);
    try {
      const response = await api.post("/uploads/image", formData);
      const uploadedUrl = response.data.data.fileUrl as string;
      setValue("logo", uploadedUrl, { shouldDirty: true });
      setLogoPreview(uploadedUrl);
      appToast.success("Logo uploaded");
    } catch {
      appToast.error("Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await uploadLogoFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await uploadLogoFile(file);
  };

  const clearLogo = () => {
    setValue("logo", "", { shouldDirty: true });
    setLogoPreview(null);
  };

  return (
    <section className="page-shell page-content">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Create Cafe Admin</h1>
          <p className="text-muted">Create a cafe profile and initial cafe admin in one step.</p>
        </div>
        <Link href="/cafe-admins">
          <Button type="button" variant="secondary" size="sm">
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </span>
          </Button>
        </Link>
      </div>

      <Card density="comfortable" className="mx-auto w-full max-w-3xl rounded-2xl border border-(--color-border) shadow-(--shadow-sm)">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Cafe Profile</h2>
            <p className="text-sm text-muted">Basic cafe identity shown in admin views.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field id="cafeName" label="Cafe name" error={errors.cafeName?.message} required>
              <Input
                {...register("cafeName", { required: "Cafe name is required" })}
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
                placeholder="+977 ..."
              />
            </Field>
            <Field id="address" label="Address" error={errors.address?.message}>
              <Input {...register("address")} placeholder="Street, city" />
            </Field>
            <Field
              id="logoUpload"
              label="Cafe logo"
              error={errors.logo?.message}
              hint="Upload PNG/JPG up to 5MB"
              className="md:col-span-2"
            >
              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(event) => void handleDrop(event)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`cursor-pointer rounded-xl border border-dashed p-4 text-center transition ${
                    isDragActive
                      ? "border-primary bg-primary-soft"
                      : "border-(--color-border) bg-surface-muted hover:border-primary/60"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">Drag & drop logo here</p>
                  <p className="mt-1 text-xs text-muted">or click to browse files</p>
                  <p className="mt-2 text-[11px] text-subtle">Recommended size: 512x512px (square)</p>
                </div>
                <Input
                  ref={fileInputRef}
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoUpload(event)}
                  className="hidden"
                />
                <input type="hidden" {...register("logo")} />
                {logoPreview ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2">
                    <div className="inline-flex items-center gap-3">
                      <img src={logoPreview} alt="Cafe logo preview" className="h-10 w-10 rounded-md object-cover" />
                      <p className="text-xs text-muted">Logo uploaded</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <RefreshCw size={14} aria-hidden="true" />
                          Replace
                        </span>
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={clearLogo}>
                        <span className="inline-flex items-center gap-1.5">
                          <Trash2 size={14} aria-hidden="true" />
                          Remove
                        </span>
                      </Button>
                    </div>
                  </div>
                ) : null}
                {logoUploading ? <p className="text-xs text-muted">Uploading logo...</p> : null}
              </div>
            </Field>
          </div>

          <div className="space-y-1 border-t border-(--color-border) pt-5">
            <h2 className="text-base font-semibold text-foreground">Cafe Admin Account</h2>
            <p className="text-sm text-muted">This account will be created as the primary manager for this cafe.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field id="email" label="Admin email" error={errors.email?.message} required>
              <Input
                type="email"
                {...register("email", { required: "Admin email is required" })}
                autoComplete="email"
                placeholder="admin@cafe.com"
              />
            </Field>
            <Field
              id="password"
              label="Admin password"
              error={errors.password?.message}
              hint="Use uppercase, lowercase, number and special character"
              required
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                  })}
                  autoComplete="new-password"
                  placeholder="Strong temporary password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:rounded-r-xl"
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-(--color-border) pt-4">
            <Link href="/cafe-admins">
              <Button type="button" variant="secondary" size="sm">
                <span className="inline-flex items-center gap-1.5">
                  <X size={14} aria-hidden="true" />
                  Cancel
                </span>
              </Button>
            </Link>
            <Button type="submit" size="sm" loading={loading}>
              <span className="inline-flex items-center gap-1.5">
                {!loading ? <Plus size={14} aria-hidden="true" /> : null}
                {loading ? "Creating..." : "Create Cafe Admin"}
              </span>
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
