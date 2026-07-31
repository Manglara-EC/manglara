import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import {
  uploadImage,
  buildImageKey,
  getPublicImageUrl,
} from "@/shared/constants";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = formData.get("folder");
    const folder = requestedFolder === "services" ? "services" : "products";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo válido." },
        { status: 400 },
      );
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "La imagen debe ser JPG, PNG o WebP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5 MB." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = buildImageKey(folder, file.name);

    await uploadImage(key, buffer, file.type);
    const url = getPublicImageUrl(key);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error en POST /api/upload:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen al almacenamiento." },
      { status: 500 },
    );
  }
}
