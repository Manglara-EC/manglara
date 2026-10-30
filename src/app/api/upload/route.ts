import { NextRequest, NextResponse } from "next/server";

import { getViewer } from "@/shared/lib/authz/server";
import {
  uploadImage,
  buildImageKey,
  getPublicImageUrl,
} from "@/shared/constants";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Comprueba la firma real del archivo (el tipo MIME lo declara el cliente). */
const matchesSignature = (bytes: Uint8Array, type: string) => {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  switch (type) {
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return (
        startsWith([0x52, 0x49, 0x46, 0x46]) &&
        startsWith([0x57, 0x45, 0x42, 0x50], 8)
      );
    default:
      return false;
  }
};

export async function POST(req: NextRequest) {
  try {
    const viewer = await getViewer();

    if (!viewer) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 },
      );
    }

    // Solo quien vende en alguna comuna sube imágenes de productos/servicios
    if (!viewer.access.canSell) {
      return NextResponse.json(
        { error: "Necesitas ser vendedor de una comuna para subir imágenes." },
        { status: 403 },
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

    if (!matchesSignature(new Uint8Array(arrayBuffer), file.type)) {
      return NextResponse.json(
        { error: "El archivo no es una imagen JPG, PNG o WebP válida." },
        { status: 400 },
      );
    }
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
