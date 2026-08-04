import type { Metadata } from "next";
import {
  TypographyH1,
  TypographyMuted,
} from "@/shared/components/ui/typography";
import { CustomerBookingsList } from "@/features/services/components/customer-bookings-list";

export const metadata: Metadata = {
  title: "Manglara | Mis Reservas",
  description: "Consulta y gestiona tus reservas de servicios en Manglara",
};

export default function ReservationsPage() {
  return (
    <main className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      <div className="space-y-1">
        <TypographyH1>Mis Reservas</TypographyH1>
        <TypographyMuted>
          Revisa el historial y estado de todas tus reservas de servicios.
        </TypographyMuted>
      </div>

      <CustomerBookingsList />
    </main>
  );
}
