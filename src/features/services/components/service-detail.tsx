"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, Wrench } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/shared/components/ui/typography";

import type { PublicService } from "@/features/services/types";

interface Props {
  service: PublicService;
}

export function ServiceDetail({ service }: Props) {
  const price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(service.price));

  const imageUrl = service.images && service.images.length > 0 ? service.images[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="w-fit">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Volver a explorar
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={service.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Wrench className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TypographyH1>{service.name}</TypographyH1>
              <Badge variant="secondary">Servicio</Badge>
            </div>
            <TypographyMuted className="text-sm">
              Por {service.sellerName} · {service.organizationName}
            </TypographyMuted>
          </div>

          <div className="space-y-4">
            <div>
              <TypographyH3 className="text-3xl">{price}</TypographyH3>
              {service.priceUnit && (
                <TypographyMuted className="text-sm">
                  Por {service.priceUnit === "flat_rate" ? "tarifa fija" : service.priceUnit}
                </TypographyMuted>
              )}
            </div>

            {service.description && (
              <div className="space-y-2">
                <TypographyH3>Descripción</TypographyH3>
                <TypographyMuted className="whitespace-pre-wrap">
                  {service.description}
                </TypographyMuted>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
