"use client";

import { BuildingIcon, HashIcon, LoaderIcon } from "lucide-react";
import slugify from "slugify";

import { DialogClose, DialogFooter } from "@/shared/components/ui/dialog";
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
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import { TypographySmall } from "@/shared/components/ui/typography";

import { useUpdateOrganizationForm } from "@/features/organizations/hooks/use-update-organization-form";
import type { Organization } from "@/features/organizations/types";

interface Props {
  organization: Organization;
}

export function UpdateOrganizationForm({ organization }: Props) {
  const { form, onSubmit, isPending, dialogCloseRef } =
    useUpdateOrganizationForm({ organization });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>

              <div className="relative">
                <FormControl>
                  <Input
                    className="peer aria-invalid:text-destructive-foreground ps-9 shadow-none not-aria-invalid:border-none"
                    disabled={isPending}
                    placeholder={fieldState.invalid ? undefined : "Manglaralto"}
                    {...field}
                  />
                </FormControl>

                <div
                  className={cn(
                    "text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50",
                    fieldState.invalid && "text-destructive-foreground",
                    fieldState.isDirty &&
                      !fieldState.invalid &&
                      "text-foreground",
                  )}
                >
                  <BuildingIcon size={16} aria-hidden="true" />
                </div>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormDescription>
                El slug es la URL de la organización.
              </FormDescription>

              <div className="relative">
                <FormControl>
                  <Input
                    className="peer aria-invalid:text-destructive-foreground ps-9 shadow-none not-aria-invalid:border-none"
                    disabled={isPending}
                    type="text"
                    placeholder={fieldState.invalid ? undefined : "manglaralto"}
                    {...field}
                  />
                </FormControl>

                <div
                  className={cn(
                    "text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50",
                    fieldState.invalid && "text-destructive-foreground",
                    fieldState.isDirty &&
                      !fieldState.invalid &&
                      "text-foreground",
                  )}
                >
                  <HashIcon size={16} aria-hidden="true" />
                </div>
              </div>

              {fieldState.isDirty && !fieldState.invalid && (
                <TypographySmall className="text-muted-foreground mt-2 ml-2">
                  <b>El resultado será:</b>{" "}
                  {slugify(field.value, {
                    lower: true,
                    strict: true,
                    trim: true,
                  })}
                </TypographySmall>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild ref={dialogCloseRef}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>

          <Button disabled={isPending} type="submit">
            {isPending && <LoaderIcon className="animate-spin" />}
            Actualizar organización
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
