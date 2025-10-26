"use client";

import Link from "next/link";
import { LoaderIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/ui/form";
import { TypographyH1, TypographyP } from "@/shared/components/ui/typography";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

import { useRecoveryForm } from "@/features/auth/hooks/use-recovery-form";

export function RecoveryForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { form, onSubmit, isPending } = useRecoveryForm();

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center">
          <CardTitle>
            <TypographyH1>Código de recuperación</TypographyH1>
          </CardTitle>

          <CardDescription>
            <TypographyP className="leading-normal">
              Ingresa el código de tu lista de códigos de recuperación. Recuerda
              que cada código solo se puede usar una vez 🌴
            </TypographyP>
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="abcde-fghij"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={isPending} type="submit" className="w-full">
                {isPending && <LoaderIcon className="animate-spin" />}
                Verificar
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            ¿Recordaste tus credenciales?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
