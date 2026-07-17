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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Separator } from "@/shared/components/ui/separator";

import type {
  CreateServiceVariables,
  ParkingConfig,
  AvailabilityRules,
  PriceUnit,
} from "@/features/seller/types";

interface Props {
  form: UseFormReturn<CreateServiceVariables>;
}

const VEHICLE_TYPES = [
  { id: "car", label: "Automóvil / SUV", icon: "🚗" },
  { id: "motorcycle", label: "Motocicleta", icon: "🏍️" },
  { id: "bicycle", label: "Bicicleta", icon: "🚲" },
  { id: "bus", label: "Autobús / Camión", icon: "🚌" },
] as const;

const DAYS_OF_WEEK = [
  { key: "monday", label: "L", fullName: "Lunes" },
  { key: "tuesday", label: "M", fullName: "Martes" },
  { key: "wednesday", label: "M", fullName: "Miércoles" },
  { key: "thursday", label: "J", fullName: "Jueves" },
  { key: "friday", label: "V", fullName: "Viernes" },
  { key: "saturday", label: "S", fullName: "Sábado" },
  { key: "sunday", label: "D", fullName: "Domingo" },
] as const;

export function ParkingConfigFields({ form }: Props) {
  const config = (form.watch("serviceConfig") as ParkingConfig) || {};
  const rules = (form.watch("availabilityRules") as AvailabilityRules) || {};

  // 1. Días y horarios de atención
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
    ];
  });

  const [openingTime, setOpeningTime] = useState(() => {
    if (rules.schedule) {
      for (const day of Object.keys(rules.schedule)) {
        const slots = rules.schedule[day as keyof typeof rules.schedule];
        if (slots && slots[0]?.start) return slots[0].start;
      }
    }
    return "07:00";
  });

  const [closingTime, setClosingTime] = useState(() => {
    if (rules.schedule) {
      for (const day of Object.keys(rules.schedule)) {
        const slots = rules.schedule[day as keyof typeof rules.schedule];
        if (slots && slots[0]?.end) return slots[0].end;
      }
    }
    return "20:00";
  });

  // 2. Vehículos permitidos
  const [allowedVehicles, setAllowedVehicles] = useState<
    ("car" | "motorcycle" | "bicycle" | "bus")[]
  >(() => {
    return config.allowedVehicles || ["car"];
  });

  // 3. Características de seguridad y terreno
  const [isRoofed, setIsRoofed] = useState(() => !!config.isRoofed);
  const [hasSecurity, setHasSecurity] = useState(() => !!config.hasSecurity);
  const [hasCameras, setHasCameras] = useState(() => !!config.hasCameras);
  const [isGated, setIsGated] = useState(() => !!config.isGated);
  const [surfaceType, setSurfaceType] = useState<"paved" | "dirt" | "sand">(
    () => {
      return config.surfaceType || "dirt";
    },
  );

  // 4. Tarifas
  const [enableHourly, setEnableHourly] = useState(() => {
    return config.hourlyPrice ? Number(config.hourlyPrice) > 0 : true;
  });
  const [enableDaily, setEnableDaily] = useState(() => {
    return !!config.dailyPrice && Number(config.dailyPrice) > 0;
  });

  const [hourlyPriceInput, setHourlyPriceInput] = useState(
    () => config.hourlyPrice || "",
  );
  const [dailyPriceInput, setDailyPriceInput] = useState(
    () => config.dailyPrice || "",
  );

  // Toggles de vehículos
  const toggleVehicle = (id: "car" | "motorcycle" | "bicycle" | "bus") => {
    if (allowedVehicles.includes(id)) {
      if (allowedVehicles.length > 1) {
        setAllowedVehicles(allowedVehicles.filter((v) => v !== id));
      }
    } else {
      setAllowedVehicles([...allowedVehicles, id]);
    }
  };

  // Sincronizar Horarios y Días con AvailabilityRules
  useEffect(() => {
    const schedule: Record<string, { start: string; end: string }[]> = {};
    activeDays.forEach((day) => {
      schedule[day] = [{ start: openingTime, end: closingTime }];
    });
    form.setValue("availabilityRules", { schedule }, { shouldDirty: true });
  }, [activeDays, openingTime, closingTime, form]);

  // Sincronizar configuración general y precios
  useEffect(() => {
    const serviceConfig: ParkingConfig = {
      hourlyPrice: enableHourly ? hourlyPriceInput : "",
      dailyPrice: enableDaily ? dailyPriceInput : "",
      allowedVehicles,
      isRoofed,
      hasSecurity,
      hasCameras,
      isGated,
      surfaceType,
    };

    // Sincronizar precio principal para listados y filtros
    let primaryPrice = "0.00";
    let primaryUnit = "hour";

    if (enableHourly && hourlyPriceInput) {
      primaryPrice = hourlyPriceInput;
      primaryUnit = "hour";
    } else if (enableDaily && dailyPriceInput) {
      primaryPrice = dailyPriceInput;
      primaryUnit = "day";
    }

    form.setValue("price", primaryPrice, { shouldDirty: true });
    form.setValue("priceUnit", primaryUnit as PriceUnit, { shouldDirty: true });
    form.setValue("serviceConfig", serviceConfig, { shouldDirty: true });
  }, [
    enableHourly,
    enableDaily,
    hourlyPriceInput,
    dailyPriceInput,
    allowedVehicles,
    isRoofed,
    hasSecurity,
    hasCameras,
    isGated,
    surfaceType,
    form,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Estacionamiento</CardTitle>
        <CardDescription>
          Establece la cantidad de plazas, tipos de vehículos, tarifas de cobro
          y seguridad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plazas Totales */}
        <FormItem>
          <FormLabel>
            ¿Cuántas plazas o cajones de estacionamiento tienes en total? *
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
            Representa la capacidad total del lote. Evita sobreventas.
          </FormDescription>
        </FormItem>

        {/* Tipos de vehículos */}
        <FormItem>
          <FormLabel>
            Vehículos permitidos (Selecciona al menos uno) *
          </FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {VEHICLE_TYPES.map((v) => {
              const active = allowedVehicles.includes(v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => toggleVehicle(v.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    active
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-input bg-background hover:bg-muted/10 text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl mb-1">{v.icon}</span>
                  <span className="text-xs text-center">{v.label}</span>
                </div>
              );
            })}
          </div>
        </FormItem>

        {/* Días laborables */}
        <FormItem>
          <FormLabel>¿Qué días opera el estacionamiento? *</FormLabel>
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
                    className="h-10 w-10 rounded-full border border-input bg-background font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {day.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </FormControl>
        </FormItem>

        {/* Horario de atención */}
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
          </FormItem>
        </div>

        {/* Características del lote (Seguridad y Suelo) */}
        <div className="rounded-lg border p-4 bg-muted/20 space-y-4">
          <FormLabel className="text-base font-semibold">
            Infraestructura y Seguridad
          </FormLabel>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isRoofed"
                checked={isRoofed}
                onCheckedChange={(checked) => setIsRoofed(!!checked)}
              />
              <Label htmlFor="isRoofed" className="font-medium cursor-pointer">
                Techado o con Sombra 🏖️
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="hasSecurity"
                checked={hasSecurity}
                onCheckedChange={(checked) => setHasSecurity(!!checked)}
              />
              <Label
                htmlFor="hasSecurity"
                className="font-medium cursor-pointer"
              >
                Seguridad física / Vigilante 👮
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="hasCameras"
                checked={hasCameras}
                onCheckedChange={(checked) => setHasCameras(!!checked)}
              />
              <Label
                htmlFor="hasCameras"
                className="font-medium cursor-pointer"
              >
                Cámaras de vigilancia (CCTV) 📹
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="isGated"
                checked={isGated}
                onCheckedChange={(checked) => setIsGated(!!checked)}
              />
              <Label htmlFor="isGated" className="font-medium cursor-pointer">
                Lote cerrado con portón / Enrejado 🚧
              </Label>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Suelo del Lote */}
          <div className="space-y-2">
            <FormLabel>Tipo de superficie o suelo:</FormLabel>
            <RadioGroup
              value={surfaceType}
              onValueChange={(val: "paved" | "dirt" | "sand") =>
                setSurfaceType(val)
              }
              className="flex flex-col md:flex-row gap-4 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paved" id="s-paved" />
                <Label htmlFor="s-paved" className="cursor-pointer">
                  Pavimentado o Asfalto
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dirt" id="s-dirt" />
                <Label htmlFor="s-dirt" className="cursor-pointer">
                  Tierra compacta o Piedra
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sand" id="s-sand" />
                <Label htmlFor="s-sand" className="cursor-pointer">
                  Arena o Tierra suelta
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Tarifas del Estacionamiento */}
        <div className="rounded-lg border p-4 bg-muted/20 space-y-4">
          <FormLabel className="text-base font-semibold">
            Configuración de Tarifas (Cobros)
          </FormLabel>
          <p className="text-xs text-muted-foreground">
            Puedes configurar una o ambas opciones. Si activas ambas, el cliente
            podrá verlas en la ficha del servicio.
          </p>

          <div className="space-y-4 pt-2">
            {/* Cobro por Hora */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="enableHourly"
                  checked={enableHourly}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    if (!isChecked && !enableDaily) {
                      setEnableDaily(true); // Evitar desactivar ambos
                    }
                    setEnableHourly(isChecked);
                  }}
                />
                <Label
                  htmlFor="enableHourly"
                  className="font-semibold text-sm cursor-pointer"
                >
                  Habilitar cobro por hora
                </Label>
              </div>

              {enableHourly && (
                <FormItem className="max-w-xs pl-7">
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="1.00"
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
                  <FormDescription>
                    Ej: $1.00 por cada hora de estancia.
                  </FormDescription>
                </FormItem>
              )}
            </div>

            <Separator className="my-1" />

            {/* Tarifa Plana Diaria */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="enableDaily"
                  checked={enableDaily}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    if (!isChecked && !enableHourly) {
                      setEnableHourly(true); // Evitar desactivar ambos
                    }
                    setEnableDaily(isChecked);
                  }}
                />
                <Label
                  htmlFor="enableDaily"
                  className="font-semibold text-sm cursor-pointer"
                >
                  Habilitar tarifa plana por día completo
                </Label>
              </div>

              {enableDaily && (
                <FormItem className="max-w-xs pl-7">
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="8.00"
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
                    Ej: $8.00 por el uso del cajón todo el día.
                  </FormDescription>
                </FormItem>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
