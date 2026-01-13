import { TypographyLarge } from "@/shared/components/ui/typography";

export default function OrganizationsPage() {
  return (
    <div className="grid h-full w-full place-content-center">
      <TypographyLarge className="text-muted-foreground mt-30 text-center font-normal">
        Selecciona una organización para administrarla.
      </TypographyLarge>
    </div>
  );
}
