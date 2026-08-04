import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { formatCurrency } from "@/shared/utils/currency";

interface BookingPriceSummaryProps {
  basePrice: number;
  isAccommodation: boolean;
  quantity: number | "";
  units: number;
  unitLabel: string;
  totalAmount: number;
}

export function BookingPriceSummary({
  basePrice,
  isAccommodation,
  quantity,
  units,
  unitLabel,
  totalAmount,
}: BookingPriceSummaryProps) {
  return (
    <Card className="border-dashed bg-muted/50">
      <CardContent className="space-y-2 p-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tarifa base:</span>
          <span>{formatCurrency(basePrice)}</span>
        </div>

        {isAccommodation && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Duración:</span>
            <span>
              {units} {unitLabel}
            </span>
          </div>
        )}

        {typeof quantity === "number" && quantity > 1 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cantidad / Personas:</span>
            <span>x {quantity}</span>
          </div>
        )}

        <Separator className="my-1" />

        <div className="flex items-center justify-between pt-1 text-base font-bold">
          <span>Total a pagar:</span>
          <span className="text-lg text-primary">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
