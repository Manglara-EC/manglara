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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { TypographyH4 } from "@/shared/components/ui/typography";

import { QRCodeDialog } from "@/features/settings/components/qr-code-dialog";
import { useUpdateTwoFactorForm } from "@/features/settings/hooks/use-update-two-factor-form";
import { useTranslation } from "react-i18next";

export const UpdateTwoFactorForm = () => {
  const { t: tSettings } = useTranslation("settings");

  const {
    form,
    onSubmit,
    isPending,
    isError,
    isSessionSuccess,
    isSessionLoading,
    isSessionError,
    refetchSession,
    isSessionRefetching,
    totpURI,
    setTotpURI,
    backupCodes,
    setBackupCodes,
    dialogTriggerRef,
  } = useUpdateTwoFactorForm();

  return (
    <>
      <QRCodeDialog
        URI={totpURI}
        setTotpURI={setTotpURI}
        isOpen={!!totpURI}
        backupCodes={backupCodes}
        setBackupCodes={setBackupCodes}
        dialogTriggerRef={dialogTriggerRef}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <TypographyH4>
            {tSettings("updateTwoFactorForm.text.title")}
          </TypographyH4>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="enable2FA"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {tSettings("updateTwoFactorForm.fields.enable2FA")}
                    </FormLabel>
                    <FormDescription>
                      {tSettings("updateTwoFactorForm.text.description")}
                    </FormDescription>
                  </div>

                  {isSessionLoading && (
                    <Skeleton className="h-5 w-10 rounded-full" />
                  )}

                  {isSessionError && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => refetchSession()}
                    >
                      {tSettings("updateTwoFactorForm.text.retry")}{" "}
                      {isSessionRefetching ? (
                        <LoaderIcon className="animate-spin" />
                      ) : (
                        <RotateCcwIcon />
                      )}
                    </Button>
                  )}

                  {isSessionSuccess && (
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  )}
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
                <FormItem className="flex flex-col items-start gap-4 rounded-lg border-2 border-dotted p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {tSettings("updateTwoFactorForm.fields.password")}
                    </FormLabel>

                    <FormDescription>
                      {tSettings(
                        "updateTwoFactorForm.text.passwordDescription",
                        {
                          action: form.getValues("enable2FA")
                            ? tSettings("updateTwoFactorForm.text.enable")
                            : tSettings("updateTwoFactorForm.text.disable"),
                        }
                      )}
                    </FormDescription>
                  </div>

                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />

                  <Button
                    variant={isError ? "destructive" : "default"}
                    disabled={isPending}
                    type="submit"
                  >
                    {isPending && <LoaderIcon className="animate-spin" />}
                    {isError && <RotateCcwIcon />}
                    {form.getValues("enable2FA")
                      ? tSettings("updateTwoFactorForm.actions.enable2FA")
                      : tSettings("updateTwoFactorForm.actions.disable2FA")}
                  </Button>
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </>
  );
};
