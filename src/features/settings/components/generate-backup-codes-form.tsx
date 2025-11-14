"use client";

import { LoaderIcon, RotateCcwIcon } from "lucide-react";

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
import { TypographyH4 } from "@/shared/components/ui/typography";

import { useGenerateBackupCodesForm } from "@/features/settings/hooks/use-generate-backup-codes-form";
import { useTranslation } from "react-i18next";

export const GenerateBackupCodesForm = () => {
  const { t: tSettings } = useTranslation("settings");

  const { form, onSubmit, isPending, isError, isTwoFactorEnabled } =
    useGenerateBackupCodesForm();

  return (
    isTwoFactorEnabled && (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <TypographyH4>
            {tSettings("generateBackupCodesForm.text.title")}
          </TypographyH4>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="generateBackupCodes"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center justify-start gap-4">
                    <FormLabel>
                      {tSettings("generateBackupCodesForm.text.label")}
                    </FormLabel>

                    <FormControl>
                      <Button
                        disabled={isPending}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => field.onChange(true)}
                      >
                        {tSettings("generateBackupCodesForm.actions.generate")}
                      </Button>
                    </FormControl>
                  </div>

                  <FormDescription>
                    {tSettings("generateBackupCodesForm.text.description")}
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {form.formState.isDirty && (
            <FormField
              disabled={isPending}
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="bg-destructive/40 flex flex-col items-start gap-4 rounded-lg p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {tSettings("generateBackupCodesForm.fields.password")}
                    </FormLabel>

                    <FormDescription>
                      {tSettings(
                        "generateBackupCodesForm.text.passwordDescription"
                      )}
                    </FormDescription>
                  </div>

                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />

                  <Button
                    disabled={isPending}
                    type="submit"
                    variant={isError ? "destructive" : "default"}
                  >
                    {isPending && <LoaderIcon className="animate-spin" />}
                    {isError && <RotateCcwIcon />}
                    {tSettings(
                      "generateBackupCodesForm.actions.generateBackupCodes"
                    )}
                  </Button>
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    )
  );
};
