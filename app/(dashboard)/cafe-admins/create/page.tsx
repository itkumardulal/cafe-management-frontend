"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Eye, EyeOff, Plus, X } from "lucide-react";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { appToast } from "@/src/lib/toast";
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
  const [logoPreview, setLogoPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <ImageUploadField
              id="logoUpload"
              label="Cafe logo"
              error={errors.logo?.message}
              hint="Upload PNG, JPG, or JPEG up to 5MB"
              className="md:col-span-2"
              value={logoPreview}
              onChange={(url) => {
                setValue("logo", url, { shouldDirty: true });
                setLogoPreview(url);
              }}
              assetType="logo"
              dropTitle="Drag & drop logo here"
              previewAlt="Cafe logo preview"
              uploadedLabel="Logo uploaded"
            />
            <input type="hidden" {...register("logo")} />
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
