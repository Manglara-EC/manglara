"use client";

import { useState } from "react";
import Image from "next/image";
import { LoaderIcon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

const MAX_IMAGES = 5;

interface Props {
  value: string[];
  onChange: (images: string[]) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

export function ServiceImageUpload({
  value,
  onChange,
  onUploadingChange,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    const availableSlots = MAX_IMAGES - value.length;
    if (availableSlots <= 0) {
      toast.error(`Puedes subir un máximo de ${MAX_IMAGES} imágenes.`);
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (filesToUpload.length < files.length) {
      toast.info(`Solo se añadieron ${availableSlots} imágenes.`);
    }

    setIsUploading(true);
    onUploadingChange(true);
    try {
      const results = await Promise.allSettled(
        filesToUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "services");

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await response.json().catch(() => ({}));

          if (!response.ok || !data.url) {
            throw new Error(data.error || "Error al subir la imagen.");
          }

          return data.url as string;
        }),
      );

      const urls = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (urls.length > 0) onChange([...value, ...urls]);

      const failedUpload = results.find(
        (result) => result.status === "rejected",
      );
      if (failedUpload?.status === "rejected") {
        toast.error(
          failedUpload.reason instanceof Error
            ? failedUpload.reason.message
            : "No se pudieron subir todas las imágenes.",
        );
      }
    } finally {
      setIsUploading(false);
      onUploadingChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-4 text-center transition-colors hover:border-primary/60 hover:bg-muted">
        {isUploading ? (
          <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <UploadIcon className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">
          {isUploading ? "Subiendo imágenes..." : "Seleccionar imágenes"}
        </span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG o WebP. Máximo {MAX_IMAGES} imágenes de 5 MB cada una.
        </span>
        <Input
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={uploadImages}
          disabled={isUploading || value.length >= MAX_IMAGES}
        />
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((url, index) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
              <Image
                src={url}
                alt={`Imagen ${index + 1} del servicio`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                aria-label={`Eliminar imagen ${index + 1}`}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-0 left-0 bg-black/65 px-2 py-1 text-xs text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_IMAGES} imágenes seleccionadas. La primera se mostrará como portada.
      </p>
    </div>
  );
}
