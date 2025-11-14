"use client";

import Link from "next/link";
import { LoaderIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t: tAuth } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");

  const { form, onSubmit, isPending } = useRecoveryForm();

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-background border-none shadow-none">
        <CardHeader className="text-center">
          <CardTitle>
            <TypographyH1>{tAuth("recoveryCode.title")}</TypographyH1>
          </CardTitle>

          <CardDescription>
            <TypographyP className="leading-normal">
              {tAuth("recoveryCode.text.instructions")}
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
                {tCommon("actions.verify")}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            {tAuth("recoveryCode.text.rememberCredentials")}{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              {tCommon("actions.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
