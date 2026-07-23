"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import type {
  CreateServiceVariables,
  AccommodationConfig,
} from "@/features/seller/types";

interface Props {
  form: UseFormReturn<CreateServiceVariables>;
}

export function AccommodationConfigFields({ form }: Props) {
  // Estados locales para los campos de texto libre
  const [amenitiesText, setAmenitiesText] = useState(() => {
    const config = form.getValues("serviceConfig") as AccommodationConfig;
    return (config?.amenities || []).join(", ");
  });

  const [houseRulesText, setHouseRulesText] = useState(() => {
    const config = form.getValues("serviceConfig") as AccommodationConfig;
    return (config?.houseRules || []).join(", ");
  });

  // Helper para actualizar serviceConfig
  const updateConfig = (key: keyof AccommodationConfig, value: unknown) => {
    const currentConfig =
      (form.getValues("serviceConfig") as AccommodationConfig) ?? {};
    form.setValue(
      "serviceConfig",
      { ...currentConfig, [key]: value },
      { shouldDirty: true },
    );
  };

  // Procesar texto a array (solo cuando pierde el foco)
  const processTextToArray = (text: string): string[] => {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const config = (form.watch("serviceConfig") as AccommodationConfig) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de alojamiento</CardTitle>
        <CardDescription>
          Define las reglas y características de tu alojamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horarios de check-in/check-out */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormItem>
            <FormLabel>Hora de check-in</FormLabel>
            <FormControl>
              <Input
                type="time"
                value={config.checkInTime || "15:00"}
                onChange={(e) => updateConfig("checkInTime", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Hora a partir de la cual los huéspedes pueden entrar
            </FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel>Hora de check-out</FormLabel>
            <FormControl>
              <Input
                type="time"
                value={config.checkOutTime || "11:00"}
                onChange={(e) => updateConfig("checkOutTime", e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Hora límite para que los huéspedes desocupen
            </FormDescription>
          </FormItem>
        </div>

        {/* Noches mínimas/máximas */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormItem>
            <FormLabel>Noches mínimas</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                value={config.minNights || 1}
                onChange={(e) =>
                  updateConfig("minNights", parseInt(e.target.value) || 1)
                }
              />
            </FormControl>
            <FormDescription>Estancia mínima requerida</FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel>Noches máximas</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                value={config.maxNights || 30}
                onChange={(e) =>
                  updateConfig("maxNights", parseInt(e.target.value) || 30)
                }
              />
            </FormControl>
            <FormDescription>Estancia máxima permitida</FormDescription>
          </FormItem>
        </div>

        {/* Características del alojamiento */}
        <div className="grid gap-6 md:grid-cols-3">
          <FormItem>
            <FormLabel>Habitaciones</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                value={config.bedrooms || 1}
                onChange={(e) =>
                  updateConfig("bedrooms", parseInt(e.target.value) || 1)
                }
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Baños</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={config.bathrooms || 1}
                onChange={(e) =>
                  updateConfig("bathrooms", parseFloat(e.target.value) || 1)
                }
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Camas</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                value={config.beds || 1}
                onChange={(e) =>
                  updateConfig("beds", parseInt(e.target.value) || 1)
                }
              />
            </FormControl>
          </FormItem>
        </div>

        {/* Amenidades */}
        <FormItem>
          <FormLabel>Amenidades</FormLabel>
          <FormControl>
            <Textarea
              placeholder="WiFi, Aire acondicionado, Cocina, Piscina... (separa con comas)"
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              onBlur={() => {
                const amenities = processTextToArray(amenitiesText);
                updateConfig("amenities", amenities);
              }}
            />
          </FormControl>
          <FormDescription>
            Lista las comodidades que ofrece tu alojamiento
          </FormDescription>
        </FormItem>

        {/* Reglas de la casa */}
        <FormItem>
          <FormLabel>Reglas de la casa</FormLabel>
          <FormControl>
            <Textarea
              placeholder="No fumar, No mascotas, Silencio después de las 10pm... (separa con comas)"
              value={houseRulesText}
              onChange={(e) => setHouseRulesText(e.target.value)}
              onBlur={() => {
                const rules = processTextToArray(houseRulesText);
                updateConfig("houseRules", rules);
              }}
            />
          </FormControl>
          <FormDescription>
            Normas que los huéspedes deben seguir
          </FormDescription>
        </FormItem>
      </CardContent>
    </Card>
  );
}
