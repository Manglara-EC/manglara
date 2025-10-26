"use client";

import { Dispatch, SetStateAction } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { LoaderIcon, RotateCcwIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/shared/components/ui/button";
import { CopyToClipboard } from "@/shared/components/ui/copy-to-clipboard";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/ui/input-otp";

import { useQrCodeDialog } from "@/features/settings/hooks/use-qr-code-dialog";

interface Props {
  URI: string;
  setTotpURI: Dispatch<SetStateAction<string>>;
  backupCodes: string[];
  setBackupCodes: Dispatch<SetStateAction<string[]>>;
  isOpen?: boolean;
  dialogTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

export const QRCodeDialog = ({
  URI,
  setTotpURI,
  dialogTriggerRef,
  backupCodes,
  setBackupCodes,
}: Props) => {
  const {
    form,
    onSubmit,
    isPending,
    isError,
    key,
    showBackupCodes,
    handleDownloadBackupCodes,
    dialogCloseRef,
  } = useQrCodeDialog({
    URI,
    setTotpURI,
    backupCodes,
    setBackupCodes,
  });

  return (
    <Dialog modal>
      <DialogTrigger hidden ref={dialogTriggerRef} />
      <DialogClose hidden ref={dialogCloseRef} />
      <DialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="flex flex-col gap-8"
      >
        <DialogHeader>
          <DialogTitle>
            {showBackupCodes
              ? "Descargar códigos de respaldo"
              : "Escanea el QR en tu aplicación de autenticación"}
          </DialogTitle>
          <DialogDescription>
            {showBackupCodes
              ? "Por favor descarga tus códigos de respaldo y guárdalos en un lugar seguro."
              : "O ingresa tu clave secreta manualmente:"}
          </DialogDescription>

          {!showBackupCodes && (
            <CopyToClipboard
              value={key}
              showLabel={false}
              className="text-muted-foreground"
            />
          )}
        </DialogHeader>

        {URI && !showBackupCodes && (
          <QRCodeSVG
            className="mx-auto"
            size={256}
            bgColor="#0b0809"
            fgColor="#ffffff"
            value={URI}
          />
        )}

        {showBackupCodes ? (
          <Button onClick={handleDownloadBackupCodes} className="mx-auto">
            Descargar códigos de respaldo
          </Button>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Contraseña de un solo uso</FormLabel>
                    <FormDescription>
                      Por favor ingresa la contraseña de un solo uso de tu
                      aplicación de autenticación.
                    </FormDescription>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <InputOTP
                          pattern={REGEXP_ONLY_DIGITS}
                          maxLength={6}
                          onComplete={form.handleSubmit(onSubmit)}
                          {...field}
                        >
                          <InputOTPGroup className="gap-1.5">
                            <InputOTPSlot index={0} className="rounded-md" />
                            <InputOTPSlot index={1} className="rounded-md" />
                            <InputOTPSlot index={2} className="rounded-md" />
                            <InputOTPSlot index={3} className="rounded-md" />
                            <InputOTPSlot index={4} className="rounded-md" />
                            <InputOTPSlot index={5} className="rounded-md" />
                          </InputOTPGroup>
                        </InputOTP>

                        <Button
                          variant={isError ? "destructive" : "default"}
                          disabled={isPending}
                          type="submit"
                        >
                          {isPending && <LoaderIcon className="animate-spin" />}
                          {isError && <RotateCcwIcon />}
                          Verificar
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
