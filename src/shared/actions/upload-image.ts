"use server";

import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import {
  uploadImage,
  buildImageKey,
  getPublicImageUrl,
} from "@/shared/constants";

const uploadImageAction = async (
  formData: FormData,
): Promise<{ url?: string; error?: string }> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new Error("No file provided");
    }

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const key = buildImageKey("products", file.name);

    await uploadImage(key, buffer, file.type);

    const url = getPublicImageUrl(key);
    return { url };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { error: "Failed to upload image" };
  }
};

export { uploadImageAction };
