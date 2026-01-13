"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import type { CreateServiceVariables, TimeBasedConfig, DurationOption } from "@/features/seller/types";

interface Props {
  form: UseFormReturn<CreateServiceVariables>;
}

export function TimeBasedConfigFields({ form }: Props) {
  const config = (form.watch("serviceConfig") as TimeBasedConfig) || {};
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>(
    config.durationOptions || []
  );

  // Helper para actualizar serviceConfig
  const updateConfig = (key: keyof TimeBasedConfig, value: unknown) => {
    const currentConfig = (form.getValues("serviceConfig") as TimeBasedConfig) ?? {};
    form.setValue("serviceConfig", { ...currentConfig, [key]: value }, { shouldDirty: true });
  };

  // Agregar opción de duración
  const addDurationOption = () => {
    const newOptions = [
      ...durationOptions,
      { minutes: 60, price: "", label: "" },
    ];
    setDurationOptions(newOptions);
    updateConfig("durationOptions", newOptions);
  };

  // Actualizar opción de duración
  const updateDurationOption = (
    index: number,
    field: keyof DurationOption,
    value: string | number
  ) => {
    const newOptions = [...durationOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setDurationOptions(newOptions);
    updateConfig("durationOptions", newOptions);
  };

  // Eliminar opción de duración
  const removeDurationOption = (index: number) => {
    const newOptions = durationOptions.filter((_, i) => i !== index);
    setDurationOptions(newOptions);
    updateConfig("durationOptions", newOptions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de servicio por tiempo</CardTitle>
        <CardDescription>
          Define las opciones de duración y precios para tu servicio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tiempo buffer entre citas */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormItem>
            <FormLabel>Tiempo entre citas (minutos)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                value={config.bufferMinutes || 0}
                onChange={(e) => updateConfig("bufferMinutes", parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              Tiempo de descanso entre una cita y otra
            </FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel>Reservas simultáneas</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                value={config.simultaneousBookings || 1}
                onChange={(e) => updateConfig("simultaneousBookings", parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormDescription>
              Cuántas reservas puedes atender al mismo tiempo
            </FormDescription>
          </FormItem>
        </div>

        {/* Opciones de duración */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Opciones de duración y precio</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDurationOption}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar opción
            </Button>
          </div>

          <FormDescription>
            Define diferentes duraciones con sus respectivos precios (opcional).
            Si no agregas opciones, se usará el precio y duración base.
          </FormDescription>

          {durationOptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              No hay opciones de duración configuradas.
              <br />
              Se usará el precio base para todas las reservas.
            </div>
          ) : (
            <div className="space-y-4">
              {durationOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-end gap-4 rounded-lg border p-4"
                >
                  <FormItem className="flex-1">
                    <FormLabel>Duración (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={option.minutes}
                        onChange={(e) =>
                          updateDurationOption(
                            index,
                            "minutes",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem className="flex-1">
                    <FormLabel>Precio ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={option.price}
                        onChange={(e) =>
                          updateDurationOption(index, "price", e.target.value)
                        }
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem className="flex-1">
                    <FormLabel>Etiqueta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Sesión corta"
                        value={option.label || ""}
                        onChange={(e) =>
                          updateDurationOption(index, "label", e.target.value)
                        }
                      />
                    </FormControl>
                  </FormItem>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeDurationOption(index)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
