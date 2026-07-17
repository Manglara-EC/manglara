"use client";

import Link from "next/link";
import { LoaderIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

import { useEditServiceForm } from "@/features/seller/hooks/use-edit-service-form";
import {
  SERVICE_TYPES,
  PRICE_UNITS,
  CANCELLATION_POLICIES,
  SERVICE_TYPE_LABELS,
  PRICE_UNIT_LABELS,
  CANCELLATION_POLICY_LABELS,
  type ServiceWithOrg,
} from "@/features/seller/types";
import { AccommodationConfigFields } from "@/features/seller/components/accommodation-config-fields";
import { ActivityConfigFields } from "@/features/seller/components/activity-config-fields";
import { RentalConfigFields } from "@/features/seller/components/rental-config-fields";

interface Props {
  serviceId: string;
  service: ServiceWithOrg;
}

export function EditServiceForm({ serviceId, service }: Props) {
  const { form, onSubmit, isPending, serviceType } = useEditServiceForm({
    serviceId,
    service,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          onSubmit as unknown as Parameters<typeof form.handleSubmit>[0],
        )}
        className="space-y-8"
      >
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
            <CardDescription>
              Describe tu servicio para que los clientes sepan qué ofreces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de servicio */}
            <FormField
              control={
                form.control as unknown as React.ComponentProps<
                  typeof FormField
                >["control"]
              }
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de servicio *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {SERVICE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El tipo de servicio determina las opciones de configuración
                    disponibles
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre */}
            <FormField
              control={
                form.control as unknown as React.ComponentProps<
                  typeof FormField
                >["control"]
              }
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del servicio *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Tour en kayak por los manglares"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Un nombre descriptivo que atraiga a los clientes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={
                form.control as unknown as React.ComponentProps<
                  typeof FormField
                >["control"]
              }
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu servicio en detalle..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Incluye detalles importantes, qué incluye, qué esperar, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ubicación */}
            <FormField
              control={
                form.control as unknown as React.ComponentProps<
                  typeof FormField
                >["control"]
              }
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Ubicación
                    {serviceType === "accommodation" && " *"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Playa de Montañita, Ecuador"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Dirección o zona donde se realiza el servicio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Precios y capacidad */}
        {serviceType !== "rental" && (
          <Card>
            <CardHeader>
              <CardTitle>Precio y capacidad</CardTitle>
              <CardDescription>
                Define cuánto cobras y cuántas personas puedes atender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Precio */}
                <FormField
                  control={
                    form.control as unknown as React.ComponentProps<
                      typeof FormField
                    >["control"]
                  }
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio base *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unidad de precio */}
                <FormField
                  control={
                    form.control as unknown as React.ComponentProps<
                      typeof FormField
                    >["control"]
                  }
                  name="priceUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad de precio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRICE_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {PRICE_UNIT_LABELS[unit]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Capacidad máxima */}
                <FormField
                  control={
                    form.control as unknown as React.ComponentProps<
                      typeof FormField
                    >["control"]
                  }
                  name="maxCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {serviceType === "accommodation"
                          ? "Huéspedes máximos"
                          : serviceType === "activity"
                            ? "Participantes máximos"
                            : "Capacidad máxima"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duración (solo para actividades) */}
                {serviceType === "activity" && (
                  <FormField
                    control={
                      form.control as unknown as React.ComponentProps<
                        typeof FormField
                      >["control"]
                    }
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="60"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                parseInt(e.target.value) || undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Duración estimada del servicio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuración específica por tipo */}
        {serviceType === "accommodation" && (
          <AccommodationConfigFields
            form={
              form as unknown as React.ComponentProps<
                typeof AccommodationConfigFields
              >["form"]
            }
          />
        )}

        {serviceType === "activity" && (
          <ActivityConfigFields
            form={
              form as unknown as React.ComponentProps<
                typeof ActivityConfigFields
              >["form"]
            }
          />
        )}

        {serviceType === "rental" && (
          <RentalConfigFields
            form={
              form as unknown as React.ComponentProps<
                typeof RentalConfigFields
              >["form"]
            }
          />
        )}

        {/* Política de cancelación */}
        <Card>
          <CardHeader>
            <CardTitle>Política de cancelación</CardTitle>
            <CardDescription>
              Define las reglas de cancelación para tu servicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={
                form.control as unknown as React.ComponentProps<
                  typeof FormField
                >["control"]
              }
              name="cancellationPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Política</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una política" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CANCELLATION_POLICIES.map((policy) => (
                        <SelectItem key={policy} value={policy}>
                          {CANCELLATION_POLICY_LABELS[policy]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={
                form.control as unknown as React.ComponentProps<
                  typeof FormField
                >["control"]
              }
              name="cancellationWindowHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ventana de cancelación (horas)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Horas antes del servicio hasta cuando se puede cancelar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Botón de envío */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/seller/services">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}
