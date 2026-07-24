"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapInstance, Marker as LeafletMarker } from "leaflet";
import { cn } from "@/shared/utils/cn";

export interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  /** Coordenadas del marcador. Si es null, no se muestra ningún marcador. */
  value: LatLng | null;
  /** Si es true, el mapa es interactivo: se puede hacer click/arrastrar para elegir ubicación. */
  interactive?: boolean;
  /** Se llama con las nuevas coordenadas cuando el usuario hace click o arrastra el marcador (solo si interactive=true). */
  onChange?: (value: LatLng) => void;
  /** Centro inicial del mapa cuando no hay `value` todavía. Por defecto: Manglaralto, Ecuador. */
  defaultCenter?: LatLng;
  defaultZoom?: number;
  className?: string;
}

// Manglaralto, Santa Elena, Ecuador — centro por defecto del mapa mientras
// no haya una ubicación elegida, ya que es la zona donde opera el proyecto.
const DEFAULT_CENTER: LatLng = { lat: -1.8181, lng: -80.7434 };

export function LeafletMap({
  value,
  interactive = false,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = 13,
  className = "",
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  // Evita reaccionar al cambio de `value` que nosotros mismos disparamos al arrastrar el marcador.
  const isInternalUpdate = useRef(false);

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Arreglo conocido: los íconos por defecto de Leaflet no se resuelven
      // bien con bundlers como Webpack/Turbopack, así que apuntamos a los
      // assets servidos desde un CDN.
      delete (
        L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown }
      )._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialCenter = value ?? defaultCenter;

      const map = L.map(containerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: defaultZoom,
        scrollWheelZoom: interactive,
        dragging: true,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (value) {
        const marker = L.marker([value.lat, value.lng], {
          draggable: interactive,
        }).addTo(map);

        if (interactive) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            isInternalUpdate.current = true;
            onChange?.({ lat: pos.lat, lng: pos.lng });
          });
        }

        markerRef.current = marker;
      }

      if (interactive) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              isInternalUpdate.current = true;
              onChange?.({ lat: pos.lat, lng: pos.lng });
            });
            markerRef.current = marker;
          }

          isInternalUpdate.current = true;
          onChange?.({ lat, lng });
        });
      }

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reaccionar a cambios externos de `value` (ej: el usuario tipeó
  // coordenadas manualmente, o el componente se re-renderiza con datos
  // distintos), sin reiniciar todo el mapa.
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      if (value) {
        if (markerRef.current) {
          markerRef.current.setLatLng([value.lat, value.lng]);
        } else {
          const marker = L.marker([value.lat, value.lng], {
            draggable: interactive,
          }).addTo(mapRef.current);

          if (interactive) {
            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              isInternalUpdate.current = true;
              onChange?.({ lat: pos.lat, lng: pos.lng });
            });
          }

          markerRef.current = marker;
        }
        mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  return (
    <div
      ref={containerRef}
      className={cn("h-64 w-full rounded-lg", className)}
      style={{ zIndex: 0 }}
    />
  );
}
