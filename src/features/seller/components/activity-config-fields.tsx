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

import type {
  CreateServiceVariables,
  ActivityConfig,
} from "@/features/seller/types";

interface Props {
  form: UseFormReturn<CreateServiceVariables>;
}

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Fácil - Para todos los niveles" },
  { value: "moderate", label: "Moderado - Requiere condición física básica" },
  { value: "challenging", label: "Desafiante - Requiere experiencia previa" },
  { value: "expert", label: "Experto - Solo para profesionales" },
] as const;

export function ActivityConfigFields({ form }: Props) {
  const config = (form.watch("serviceConfig") as ActivityConfig) || {};

  // Estados locales para campos de texto libre
  const [requirementsText, setRequirementsText] = useState(() => {
    const cfg = form.getValues("serviceConfig") as ActivityConfig;
    return (cfg?.requirements || []).join(", ");
  });

  const [inclusionsText, setInclusionsText] = useState(() => {
    const cfg = form.getValues("serviceConfig") as ActivityConfig;
    return (cfg?.inclusions || []).join(", ");
  });

  const [exclusionsText, setExclusionsText] = useState(() => {
    const cfg = form.getValues("serviceConfig") as ActivityConfig;
    return (cfg?.exclusions || []).join(", ");
  });

  // Helper para actualizar serviceConfig
  const updateConfig = (key: keyof ActivityConfig, value: unknown) => {
    const currentConfig =
      (form.getValues("serviceConfig") as ActivityConfig) ?? {};
    form.setValue(
      "serviceConfig",
      { ...currentConfig, [key]: value },
      { shouldDirty: true },
    );
  };

  // Procesar texto a array
  const processTextToArray = (text: string): string[] => {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de actividad</CardTitle>
        <CardDescription>
          Define los detalles de tu actividad o experiencia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dificultad y participantes mínimos */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormItem>
            <FormLabel>Nivel de dificultad</FormLabel>
            <Select
              value={config.difficulty || "easy"}
              onValueChange={(value) => updateConfig("difficulty", value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona dificultad" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Ayuda a los clientes a saber si la actividad es para ellos
            </FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel>Participantes mínimos</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                value={config.minParticipants || 1}
                onChange={(e) =>
                  updateConfig("minParticipants", parseInt(e.target.value) || 1)
                }
              />
            </FormControl>
            <FormDescription>
              Mínimo de personas para que la actividad se realice
            </FormDescription>
          </FormItem>
        </div>

        {/* Punto de encuentro */}
        <FormItem>
          <FormLabel>Punto de encuentro</FormLabel>
          <FormControl>
            <Input
              placeholder="Ej: Entrada principal de la playa, junto al quiosco azul"
              value={config.meetingPoint || ""}
              onChange={(e) => updateConfig("meetingPoint", e.target.value)}
            />
          </FormControl>
          <FormDescription>
            Indica dónde deben reunirse los participantes
          </FormDescription>
        </FormItem>

        {/* Requisitos */}
        <FormItem>
          <FormLabel>Requisitos</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Saber nadar, Traer ropa cómoda, Tener seguro médico... (separa con comas)"
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              onBlur={() => {
                const requirements = processTextToArray(requirementsText);
                updateConfig("requirements", requirements);
              }}
            />
          </FormControl>
          <FormDescription>
            Qué necesitan los participantes antes de la actividad
          </FormDescription>
        </FormItem>

        {/* Qué incluye */}
        <FormItem>
          <FormLabel>¿Qué incluye?</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Equipo de snorkel, Guía bilingüe, Refrigerios... (separa con comas)"
              value={inclusionsText}
              onChange={(e) => setInclusionsText(e.target.value)}
              onBlur={() => {
                const inclusions = processTextToArray(inclusionsText);
                updateConfig("inclusions", inclusions);
              }}
            />
          </FormControl>
          <FormDescription>
            Lista todo lo que está incluido en el precio
          </FormDescription>
        </FormItem>

        {/* Qué NO incluye */}
        <FormItem>
          <FormLabel>¿Qué NO incluye?</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Transporte al punto de encuentro, Propinas, Fotos profesionales... (separa con comas)"
              value={exclusionsText}
              onChange={(e) => setExclusionsText(e.target.value)}
              onBlur={() => {
                const exclusions = processTextToArray(exclusionsText);
                updateConfig("exclusions", exclusions);
              }}
            />
          </FormControl>
          <FormDescription>
            Aclara lo que los participantes deben traer o pagar aparte
          </FormDescription>
        </FormItem>
      </CardContent>
    </Card>
  );
}
