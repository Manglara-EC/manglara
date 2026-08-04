"use client";

import { MapPinIcon, LocateFixedIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { TypographyMuted } from "@/shared/components/ui/typography";
import { LeafletMap, type LatLng } from "@/shared/components/leaflet-map";

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  className,
}: LocationPickerProps) {
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Si el usuario niega el permiso o falla, no hacemos nada más:
        // simplemente puede seguir eligiendo el punto manualmente en el mapa.
      },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPinIcon className="h-4 w-4" />
          Ubicación en el mapa
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUseCurrentLocation}
        >
          <LocateFixedIcon className="mr-1 h-4 w-4" />
          Usar mi ubicación
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <LeafletMap
          value={value}
          interactive
          onChange={onChange}
          className={className}
        />
      </div>

      <TypographyMuted className="text-xs">
        {value
          ? `Punto elegido: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}. Haz click en otro lugar del mapa o arrastra el marcador para cambiarlo.`
          : "Haz click en el mapa para marcar dónde se encuentra o se ofrece esto."}
      </TypographyMuted>
    </div>
  );
}
