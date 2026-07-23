"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { LocationPicker } from "@/shared/components/location-picker";
import type { LatLng } from "@/shared/components/leaflet-map";

import { useUpdateProductMutation } from "@/features/seller/hooks/use-update-product-mutation";
import type { ProductWithOrg, UpdateProductVariables } from "@/features/seller/types";

interface Props {
    productId: string;
    product: ProductWithOrg;
}

export function EditProductForm({ productId, product }: Props) {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        stock: product.stock,
        location: product.location || "",
        organizationId: product.organizationId,
    });
    const [coords, setCoords] = useState<LatLng | null>(
        product.latitude !== null && product.latitude !== undefined &&
        product.longitude !== null && product.longitude !== undefined
            ? { lat: Number(product.latitude), lng: Number(product.longitude) }
            : null,
    );

    const updateMutation = useUpdateProductMutation({
        productId,
    });

    const handleChange = (field: keyof typeof formData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = field === "stock" ? Number(e.target.value) : e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const variables: UpdateProductVariables = {
            productId,
            name: formData.name,
            description: formData.description || undefined,
            price: formData.price,
            stock: formData.stock,
            location: formData.location || undefined,
            latitude: coords?.lat,
            longitude: coords?.lng,
            organizationId: formData.organizationId,
        };

        updateMutation.mutate(variables);
    };

    const getStatusBadge = () => {
        switch (product.status) {
            case "approved":
                return <Badge variant="default">Aprobado</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rechazado</Badge>;
            default:
                return <Badge variant="secondary">Pendiente</Badge>;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header con estado */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Editando: {product.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        Organización: {product.organizationName}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge()}
                    {product.status === "rejected" && product.rejectionReason && (
                        <span className="text-sm text-destructive">
                            Razón: {product.rejectionReason}
                        </span>
                    )}
                </div>
            </div>

            {/* Información del producto */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del producto</CardTitle>
                    <CardDescription>
                        Modifica los detalles de tu producto. Al guardar, volverá a estado pendiente para revisión.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={handleChange("name")}
                            placeholder="Nombre del producto"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={handleChange("description")}
                            placeholder="Describe tu producto..."
                            rows={4}
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio ($) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
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
                                min="0"
                                value={formData.stock}
                                onChange={handleChange("stock")}
                                placeholder="0"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
                <CardHeader>
                    <CardTitle>Ubicación</CardTitle>
                    <CardDescription>
                        Marca en el mapa dónde puede recogerse o dónde se ofrece el producto (opcional)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LocationPicker value={coords} onChange={setCoords} />
                    <div className="space-y-2">
                        <Label htmlFor="location">Etiqueta de la ubicación (opcional)</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={handleChange("location")}
                            placeholder="Ej: Restaurante El Manglar, planta baja"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-between">
                <Button type="button" variant="outline" asChild>
                    <Link href="/seller/products">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Cancelar
                    </Link>
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar cambios
                </Button>
            </div>
        </form>
    );
}
