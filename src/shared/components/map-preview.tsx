import { MapPinIcon } from "lucide-react";

import { TypographyH3, TypographyMuted } from "@/shared/components/ui/typography";
import { LeafletMap } from "@/shared/components/leaflet-map";

interface MapPreviewProps {
  latitude: number | string | null | undefined;
  longitude: number | string | null | undefined;
  /** Etiqueta de texto opcional para mostrar junto al mapa (ej: nombre del lugar). */
  label?: string | null;
}

export function MapPreview({ latitude, longitude, label }: MapPreviewProps) {
  const lat = latitude !== null && latitude !== undefined ? Number(latitude) : null;
  const lng = longitude !== null && longitude !== undefined ? Number(longitude) : null;

  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <MapPinIcon className="h-4 w-4 text-primary" />
        <TypographyH3 className="text-lg">Ubicación</TypographyH3>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <LeafletMap value={{ lat, lng }} interactive={false} />
      </div>
      {label && <TypographyMuted className="text-sm">{label}</TypographyMuted>}
      <TypographyMuted className="text-xs">
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Abrir en un mapa más grande
        </a>
      </TypographyMuted>
    </div>
  );
}
