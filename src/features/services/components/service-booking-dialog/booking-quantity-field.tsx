import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export interface BookingAvailability {
  availableCapacity: number;
  maxCapacity: number;
  canBook: boolean;
  message?: string;
  loading?: boolean;
}

interface BookingQuantityFieldProps {
  isAccommodation: boolean;
  isActivity: boolean;
  maxCapacity: number;
  quantity: number | "";
  availability: BookingAvailability | null;
  onQuantityChange: (value: number | "") => void;
  onQuantityBlur: () => void;
}

export function BookingQuantityField({
  isAccommodation,
  isActivity,
  maxCapacity,
  quantity,
  availability,
  onQuantityChange,
  onQuantityBlur,
}: BookingQuantityFieldProps) {
  const label = isAccommodation
    ? "Número de huéspedes"
    : isActivity
      ? "Número de participantes"
      : "Cantidad / Cupos";
  const availabilityMessage = availability?.loading
    ? "Consultando disponibilidad..."
    : availability?.message
      ? availability.message
      : availability
        ? `Plazas disponibles : ${availability.availableCapacity} de ${availability.maxCapacity}`
        : "Selecciona las fechas para consultar disponibilidad";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="quantity" className="text-sm font-semibold">
          {label}
        </Label>
        <span className="text-sm text-muted-foreground">
          {availabilityMessage}
        </span>
      </div>
      <Input
        id="quantity"
        type="number"
        min={1}
        max={availability ? availability.availableCapacity : maxCapacity || 99}
        disabled={
          availability?.loading ||
          (availability?.availableCapacity === 0 &&
            availability.canBook === false)
        }
        value={quantity}
        onChange={(event) => {
          const value = event.target.value;
          onQuantityChange(value === "" ? "" : Number.parseInt(value, 10));
        }}
        onBlur={onQuantityBlur}
        required
      />
    </div>
  );
}
