import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/shared/lib/better-auth/server";
import {
  uploadImage,
  buildImageKey,
  getPublicImageUrl,
} from "@/shared/constants";

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

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo válido." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = buildImageKey("products", file.name);

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
