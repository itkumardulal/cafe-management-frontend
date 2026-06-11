import { getApiErrorMessage } from "@/src/lib/api-error";
import { api } from "@/src/services/api";
import { IMAGE_UPLOAD_MESSAGES } from "./messages";

export type UploadImageAssetType = "logo" | "module" | "profile";

export type UploadImageParams = {
  file: File;
  assetType: UploadImageAssetType;
  module?: string;
  entityId?: string;
  userId?: string;
  cafeId?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export type UploadImageResult = {
  fileUrl: string;
  key: string;
  cafeId: string;
};

export async function uploadImage(
  params: UploadImageParams,
): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("assetType", params.assetType);

  if (params.assetType === "module") {
    if (!params.module || !params.entityId) {
      throw new Error(IMAGE_UPLOAD_MESSAGES.sessionNotReady);
    }
    formData.append("module", params.module);
    formData.append("entityId", params.entityId);
  }

  if (params.assetType === "profile" && params.userId) {
    formData.append("userId", params.userId);
  }

  if (params.cafeId) {
    formData.append("cafeId", params.cafeId);
  }

  try {
    const response = await api.post("/uploads/image", formData, {
      signal: params.signal,
      onUploadProgress: (event) => {
        if (!params.onProgress || !event.total) {
          return;
        }
        const percent = Math.round((event.loaded / event.total) * 100);
        params.onProgress(Math.min(100, percent));
      },
    });

    const data = response.data.data as UploadImageResult;
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, IMAGE_UPLOAD_MESSAGES.uploadFailed),
    );
  }
}
