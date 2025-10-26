"use client";

import { LoaderIcon, MailIcon } from "lucide-react";

import { DialogClose, DialogFooter } from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";

import { useSendOrganizationInvitationForm } from "@/features/organizations/hooks/use-send-organization-invitation-form";

interface Props {
  organizationId: string;
}

export function SendOrganizationInvitationForm({ organizationId }: Props) {
  const { form, onSubmit, isPending, dialogCloseRef } =
    useSendOrganizationInvitationForm({ organizationId });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>

              <div className="relative">
                <FormControl>
                  <Input
                    type="email"
                    className="peer aria-invalid:text-destructive-foreground ps-9 shadow-none not-aria-invalid:border-none"
                    disabled={isPending}
                    placeholder={
                      fieldState.invalid ? undefined : "david@aragundy.com"
                    }
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
                  <MailIcon size={16} aria-hidden="true" />
                </div>
              </div>

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
            Enviar invitación
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
