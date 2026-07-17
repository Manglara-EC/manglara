"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";

import type {
  CreateServiceVariables,
  RentalConfig,
  AvailabilityRules,
} from "@/features/seller/types";

interface Props {
  form: UseFormReturn<CreateServiceVariables>;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "L", fullName: "Lunes" },
  { key: "tuesday", label: "M", fullName: "Martes" },
  { key: "wednesday", label: "M", fullName: "Miércoles" },
  { key: "thursday", label: "J", fullName: "Jueves" },
  { key: "friday", label: "V", fullName: "Viernes" },
  { key: "saturday", label: "S", fullName: "Sábado" },
  { key: "sunday", label: "D", fullName: "Domingo" },
] as const;

export function RentalConfigFields({ form }: Props) {
  const config = (form.watch("serviceConfig") as RentalConfig) || {};
  const rules = (form.watch("availabilityRules") as AvailabilityRules) || {};

  // 1. Estados locales para los campos visuales simplificados
  const [pricingMode, setPricingMode] = useState<"hourly" | "daily">(() => {
    // Si ya existe config.dailyPrice, seleccionamos daily, sino hourly
    return config.dailyPrice && Number(config.dailyPrice) > 0
      ? "daily"
      : "hourly";
  });

  const [hourlyPriceInput, setHourlyPriceInput] = useState(
    () => config.hourlyPrice || "",
  );
  const [dailyPriceInput, setDailyPriceInput] = useState(
    () => config.dailyPrice || "",
  );

  // Inicializar días de atención desde availabilityRules
  const [activeDays, setActiveDays] = useState<string[]>(() => {
    if (rules.schedule) {
      return Object.keys(rules.schedule).filter(
        (day) =>
          Array.isArray(rules.schedule?.[day as keyof typeof rules.schedule]) &&
          (rules.schedule?.[day as keyof typeof rules.schedule]?.length ?? 0) >
            0,
      );
    }
    return [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]; // Por defecto todos
  });

  // Inicializar horario de apertura/cierre
  const [openingTime, setOpeningTime] = useState(() => {
    if (rules.schedule) {
      for (const day of Object.keys(rules.schedule)) {
        const slots = rules.schedule[day as keyof typeof rules.schedule];
        if (slots && slots[0]?.start) {
          return slots[0].start;
        }
      }
    }
    return "08:00"; // Por defecto 8 AM
  });

  const [closingTime, setClosingTime] = useState(() => {
    if (rules.schedule) {
      for (const day of Object.keys(rules.schedule)) {
        const slots = rules.schedule[day as keyof typeof rules.schedule];
        if (slots && slots[0]?.end) {
          return slots[0].end;
        }
      }
    }
    return "18:00"; // Por defecto 6 PM
  });

  // 2. Helper para calcular horas de operación
  const getOperatingHours = (start: string, end: string): number => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    if (isNaN(startH) || isNaN(endH)) return 0;

    const startDecimal = startH + (startM || 0) / 60;
    const endDecimal = endH + (endM || 0) / 60;
    const diff = endDecimal - startDecimal;

    return diff > 0 ? diff : 24 + diff;
  };

  const operatingHours = getOperatingHours(openingTime, closingTime);

  // 3. Calcular precio por hora equivalente si es modalidad diaria
  const calculatedHourlyRate = (() => {
    if (pricingMode === "daily" && dailyPriceInput && operatingHours > 0) {
      const rate = Number(dailyPriceInput) / operatingHours;
      return isNaN(rate) || !isFinite(rate) ? "0.00" : rate.toFixed(2);
    }
    return "0.00";
  })();

  // 4. Sincronizar cambios de Horarios y Días con AvailabilityRules
  useEffect(() => {
    const schedule: Record<string, { start: string; end: string }[]> = {};
    activeDays.forEach((day) => {
      schedule[day] = [{ start: openingTime, end: closingTime }];
    });

    form.setValue("availabilityRules", { schedule }, { shouldDirty: true });
  }, [activeDays, openingTime, closingTime, form]);

  // 5. Sincronizar precios y configuración con el formulario general
  useEffect(() => {
    let finalPrice = "0.00";
    const serviceConfig: RentalConfig = {
      pricingMode,
    };

    if (pricingMode === "hourly") {
      finalPrice = hourlyPriceInput || "0.00";
      serviceConfig.hourlyPrice = hourlyPriceInput;
      serviceConfig.dailyPrice = "";
    } else {
      finalPrice = calculatedHourlyRate;
      serviceConfig.hourlyPrice = calculatedHourlyRate;
      serviceConfig.dailyPrice = dailyPriceInput;
    }

    form.setValue("price", finalPrice, { shouldDirty: true });
    form.setValue("priceUnit", "hour", { shouldDirty: true });
    form.setValue("serviceConfig", serviceConfig, { shouldDirty: true });
  }, [
    pricingMode,
    hourlyPriceInput,
    dailyPriceInput,
    calculatedHourlyRate,
    form,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de alquiler y horarios</CardTitle>
        <CardDescription>
          Indica cuántas hamacas tienes, tus días y horas de atención, y tus
          tarifas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cantidad disponible */}
        <FormItem>
          <FormLabel>
            ¿Cuántas hamacas tienes disponibles para alquilar en total? *
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={form.watch("maxCapacity")}
              onChange={(e) =>
                form.setValue("maxCapacity", parseInt(e.target.value) || 1, {
                  shouldDirty: true,
                })
              }
            />
          </FormControl>
          <FormDescription>
            Este es tu stock. Los clientes no podrán reservar más hamacas que
            esta cantidad a la misma hora.
          </FormDescription>
        </FormItem>

        {/* Días laborables */}
        <FormItem>
          <FormLabel>¿Qué días atiendes? *</FormLabel>
          <FormControl>
            <div className="flex flex-wrap gap-2 pt-1">
              <ToggleGroup
                type="multiple"
                value={activeDays}
                onValueChange={(val) => {
                  if (val.length > 0) setActiveDays(val);
                }}
                className="justify-start gap-2"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <ToggleGroupItem
                    key={day.key}
                    value={day.key}
                    aria-label={day.fullName}
                    className="h-10 w-10 rounded-full border border-input bg-background font-medium hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {day.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </FormControl>
          <FormDescription>
            Presiona los botones para activar o desactivar los días de atención.
          </FormDescription>
        </FormItem>

        {/* Rango de Horas */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormItem>
            <FormLabel>Hora de apertura *</FormLabel>
            <FormControl>
              <Input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
              />
            </FormControl>
            <FormDescription>Hora a la que abres tu puesto.</FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel>Hora de cierre *</FormLabel>
            <FormControl>
              <Input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
              />
            </FormControl>
            <FormDescription>
              Hora a la que recoges las hamacas.
            </FormDescription>
          </FormItem>
        </div>

        {/* Selector de Modalidad de Cobro */}
        <div className="rounded-lg border p-4 bg-muted/20 space-y-4">
          <FormLabel className="text-base font-semibold">
            ¿Cómo deseas configurar tu tarifa?
          </FormLabel>

          <RadioGroup
            value={pricingMode}
            onValueChange={(value: "hourly" | "daily") => setPricingMode(value)}
            className="grid gap-4 md:grid-cols-2 pt-2"
          >
            {/* Opción Por Hora */}
            <div className="flex items-start space-x-3 rounded-md border p-3 bg-background hover:bg-muted/10 cursor-pointer">
              <RadioGroupItem value="hourly" id="r-hourly" className="mt-1" />
              <div className="grid gap-1">
                <Label
                  htmlFor="r-hourly"
                  className="font-medium cursor-pointer"
                >
                  Cobrar por hora
                </Label>
                <span className="text-xs text-muted-foreground">
                  Cobras un monto fijo por cada hora que el cliente use la
                  hamaca.
                </span>
              </div>
            </div>

            {/* Opción Por Día Completo */}
            <div className="flex items-start space-x-3 rounded-md border p-3 bg-background hover:bg-muted/10 cursor-pointer">
              <RadioGroupItem value="daily" id="r-daily" className="mt-1" />
              <div className="grid gap-1">
                <Label htmlFor="r-daily" className="font-medium cursor-pointer">
                  Cobrar por día completo
                </Label>
                <span className="text-xs text-muted-foreground">
                  Ingresas tu meta de ganancia diaria y el sistema calcula la
                  tarifa por hora.
                </span>
              </div>
            </div>
          </RadioGroup>

          {/* Inputs de Precio dinámicos */}
          <div className="pt-2">
            {pricingMode === "hourly" ? (
              <FormItem className="max-w-xs">
                <FormLabel>Precio por hora (USD) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="1.50"
                      className="pl-7"
                      value={hourlyPriceInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d{0,2}$/.test(val))
                          setHourlyPriceInput(val);
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription>Ej: $1.50 por cada hora.</FormDescription>
              </FormItem>
            ) : (
              <div className="space-y-3">
                <FormItem className="max-w-xs">
                  <FormLabel>Monto a ganar por todo el día (USD) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="5.00"
                        className="pl-7"
                        value={dailyPriceInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*\.?\d{0,2}$/.test(val))
                            setDailyPriceInput(val);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Ej: $5.00 por usar la hamaca todo el día.
                  </FormDescription>
                </FormItem>

                {/* Nota del precio calculado por hora */}
                {dailyPriceInput &&
                  Number(dailyPriceInput) > 0 &&
                  operatingHours > 0 && (
                    <div className="text-sm font-medium text-primary bg-primary/10 p-3 rounded-md">
                      Calculando: Tu precio aproximado será de{" "}
                      <span className="font-bold underline">
                        ${calculatedHourlyRate}/hora
                      </span>{" "}
                      basado en tu horario de atención de{" "}
                      {operatingHours.toFixed(1)} horas.
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
