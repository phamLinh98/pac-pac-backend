import { imageServiceConfig } from "../configs/imageServiceConfig.js";

const request = async (path, options = {}) => {
  const response = await fetch(`${imageServiceConfig.baseUrl}${path}`, {
    ...options,
    headers: {
      "x-internal-token": imageServiceConfig.internalToken,
      ...(options.headers ?? {}),
    },
    signal: AbortSignal.timeout(imageServiceConfig.timeoutMs),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.detail ?? data.message ?? "Image service request failed"), {
      statusCode: response.status,
    });
  }
  return data;
};

export const uploadImages = async ({ files, category, ownerId, resourceId, imageType }) => {
  const form = new FormData();
  form.set("category", category);
  form.set("owner_id", String(ownerId));
  if (resourceId != null) form.set("resource_id", String(resourceId));
  if (imageType) form.set("image_type", imageType);
  for (const file of files) {
    form.append("files", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "image");
  }
  return (await request("/api/v1/images/upload", { method: "POST", body: form })).keys;
};

export const createSignedUrls = async (keys, expiresIn) => {
  const payload = { keys };
  if (expiresIn) payload.expires_in = expiresIn;
  return (await request("/api/v1/images/signed-urls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })).urls;
};

export const deleteImages = async (keys) => {
  if (!keys.length) return [];
  return (await request("/api/v1/images/objects", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keys }),
  })).deleted;
};
