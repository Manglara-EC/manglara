"use client";

import { useState } from "react";
import Link from "next/link";
import { LoaderIcon, X } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

import { useCreateProductMutation } from "@/features/seller/hooks/use-create-product-mutation";
import { authClient } from "@/shared/lib/better-auth/client";

import { uploadImageAction } from "@/shared/actions/upload-image";
import { toast } from "sonner";

interface Props {
  organizationId: string;
  onSuccess?: () => void;
}

export function CreateProductForm({ organizationId, onSuccess }: Props) {
  const { data: session } = authClient.useSession();
  const mutation = useCreateProductMutation();
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: 0,
    images: [] as File[],
  });

  const handleChange =
    (field: keyof Omit<typeof form, "images">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = field === "stock" ? Number(e.target.value) : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const uploadImagesToR2 = async (images: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    for (const file of images) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadImageAction(formData);
      if (result.error) {
        throw new Error(result.error || "Error al subir la imagen");
      }
      if (result.url) {
        imageUrls.push(result.url);
      }
    }
    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      return;
    }

    let imageUrls: string[] = [];

    if (form.images.length > 0) {
      setIsUploading(true);
      try {
        imageUrls = await uploadImagesToR2(form.images);
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Error al subir las imágenes");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    mutation.mutate({
      name: form.name,
      description: form.description || undefined,
      price: form.price,
      stock: form.stock,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      organizationId,
    });
  };

  const isLoading = mutation.isPending || isUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información del producto */}
      <Card>
        <CardHeader>
          <CardTitle>Información del producto</CardTitle>
          <CardDescription>
            Describe tu producto para que los clientes sepan qué ofreces
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Ej. Artesanía de madera"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Describe tu producto en detalle..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Precio y stock */}
      <Card>
        <CardHeader>
          <CardTitle>Precio y disponibilidad</CardTitle>
          <CardDescription>
            Define el precio y cantidad disponible de tu producto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Precio ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange("price")}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={handleChange("stock")}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imágenes */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
          <CardDescription>
            Sube fotos de tu producto (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="cursor-pointer"
          />
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((image, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 p-2 border rounded-md bg-muted"
                >
                  <span className="text-sm truncate max-w-[200px]">
                    {image.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Puedes seleccionar múltiples imágenes.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/seller/products">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
          Crear producto
        </Button>
      </div>
    </form>
  );
}
