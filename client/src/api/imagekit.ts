/**
 * ImageKit client-side upload utility.
 *
 * Strategy: browser calls our server's /api/imagekit/auth to get a
 * short-lived signature, then uploads the file DIRECTLY to ImageKit's
 * upload API. The private key never leaves the server.
 */

import { apiRequest, ApiError } from "./http";

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  filePath: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export const getImageKitAuth = () =>
  apiRequest<ImageKitAuthParams>(`/imagekit/auth?t=${Date.now()}`);

/**
 * Upload a single File object to ImageKit.
 *
 * @param file  The File from a file-input element or drag-drop event
 * @param folder  Target folder in ImageKit (e.g. "/products")
 * @param onProgress  Optional callback receiving 0-100 progress percentage
 */
export async function uploadToImageKit(
  file: File,
  folder = "/products",
  onProgress?: (pct: number) => void,
): Promise<ImageKitUploadResult> {
  // 1. Fetch auth params from our secured server endpoint
  let auth: ImageKitAuthParams;
  try {
    auth = await getImageKitAuth();
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) {
      throw new Error(
        "Image uploads are not available — ImageKit is not configured on the server. " +
          "Add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT to server/.env.",
      );
    }
    throw err;
  }

  // 2. Build multipart form data for ImageKit's upload API
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `${Date.now()}_${file.name.replace(/\s+/g, "_")}`);
  formData.append("folder", folder);
  formData.append("publicKey", auth.publicKey);
  formData.append("signature", auth.signature);
  formData.append("expire", String(auth.expire));
  formData.append("token", auth.token);

  // 3. Upload directly to ImageKit (bypasses our own server entirely)
  return new Promise<ImageKitUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ImageKitUploadResult);
        } catch {
          reject(new Error("ImageKit returned an unexpected response"));
        }
      } else {
        let errMsg = `ImageKit upload failed (HTTP ${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.message) errMsg = body.message;
        } catch { /* ignore */ }
        reject(new Error(errMsg));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during image upload")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Image upload was aborted")),
    );

    xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
    xhr.send(formData);
  });
}
