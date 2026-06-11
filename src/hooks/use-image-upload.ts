"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "@/src/lib/image-upload/compress-image";
import { resolveCompressionPreset } from "@/src/lib/image-upload/compression-presets";
import { IMAGE_UPLOAD_MESSAGES } from "@/src/lib/image-upload/messages";
import {
  uploadImage,
  type UploadImageAssetType,
} from "@/src/lib/image-upload/upload-image.service";
import { validateImageFile } from "@/src/lib/image-upload/validation";

export type ImageUploadStatus =
  | "idle"
  | "validating"
  | "compressing"
  | "uploading"
  | "success"
  | "error";

export type UseImageUploadParams = {
  assetType: UploadImageAssetType;
  module?: string;
  entityId?: string;
  userId?: string;
  cafeId?: string;
  onSuccess: (fileUrl: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

function isUploadAborted(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof Error &&
      (error.name === "AbortError" || error.name === "CanceledError"))
  );
}

export function useImageUpload(params: UseImageUploadParams) {
  const [status, setStatus] = useState<ImageUploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastFileRef = useRef<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  const onSuccessRef = useRef(params.onSuccess);
  const onUploadingChangeRef = useRef(params.onUploadingChange);
  onSuccessRef.current = params.onSuccess;
  onUploadingChangeRef.current = params.onUploadingChange;

  const revokeLocalPreview = useCallback(() => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreviewUrl(null);
  }, []);

  const setLocalPreview = useCallback(
    (file: File) => {
      revokeLocalPreview();
      const url = URL.createObjectURL(file);
      localPreviewRef.current = url;
      setLocalPreviewUrl(url);
    },
    [revokeLocalPreview],
  );

  const setBusy = useCallback((busy: boolean) => {
    onUploadingChangeRef.current?.(busy);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setErrorMessage(null);
      setUploadProgress(0);
      setStatus("validating");
      setBusy(true);

      const validation = validateImageFile(file);
      if (!validation.ok) {
        setStatus("error");
        setErrorMessage(validation.error);
        setBusy(false);
        return;
      }

      if (
        params.assetType === "module" &&
        (!params.module || !params.entityId)
      ) {
        setStatus("error");
        setErrorMessage(IMAGE_UPLOAD_MESSAGES.sessionNotReady);
        setBusy(false);
        return;
      }

      lastFileRef.current = file;
      setLocalPreview(file);

      try {
        setStatus("compressing");
        const preset = resolveCompressionPreset({
          assetType: params.assetType,
          module: params.module,
        });
        const compressed = await compressImage(file, preset);
        if (!compressed.ok) {
          setStatus("error");
          setErrorMessage(compressed.error);
          return;
        }

        setStatus("uploading");
        const result = await uploadImage({
          file: compressed.file,
          assetType: params.assetType,
          module: params.module,
          entityId: params.entityId,
          userId: params.userId,
          cafeId: params.cafeId,
          signal: abortController.signal,
          onProgress: setUploadProgress,
        });

        revokeLocalPreview();
        setStatus("success");
        onSuccessRef.current(result.fileUrl);
      } catch (error) {
        if (isUploadAborted(error)) {
          setStatus("idle");
          return;
        }
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : IMAGE_UPLOAD_MESSAGES.uploadFailed,
        );
      } finally {
        setBusy(false);
        setUploadProgress(0);
      }
    },
    [
      params.assetType,
      params.cafeId,
      params.entityId,
      params.module,
      params.userId,
      revokeLocalPreview,
      setBusy,
      setLocalPreview,
    ],
  );

  const retry = useCallback(async () => {
    if (!lastFileRef.current) {
      return;
    }
    await processFile(lastFileRef.current);
  }, [processFile]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    revokeLocalPreview();
    lastFileRef.current = null;
    setStatus("idle");
    setUploadProgress(0);
    setErrorMessage(null);
    setBusy(false);
  }, [revokeLocalPreview, setBusy]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      revokeLocalPreview();
    };
  }, [revokeLocalPreview]);

  const isBusy =
    status === "validating" ||
    status === "compressing" ||
    status === "uploading";

  return {
    status,
    uploadProgress,
    localPreviewUrl,
    errorMessage,
    isBusy,
    processFile,
    retry,
    reset,
  };
}
