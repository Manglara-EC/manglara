import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface ActivityBookingFieldsProps {
  startDate: string;
  startTime: string;
  minDate: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
}

export function ActivityBookingFields({
  startDate,
  startTime,
  minDate,
  onDateChange,
  onStartTimeChange,
}: ActivityBookingFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="actDate" className="text-xs font-semibold">
          Fecha de la Actividad
        </Label>
        <Input
          id="actDate"
          type="date"
          min={minDate}
          value={startDate}
          onChange={(event) => onDateChange(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="actTime" className="text-xs font-semibold">
          Hora de Inicio
        </Label>
        <Input
          id="actTime"
          type="time"
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
          required
        />
      </div>
    </div>
  );
}
