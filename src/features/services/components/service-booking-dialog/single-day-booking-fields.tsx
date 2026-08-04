import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface SingleDayBookingFieldsProps {
  startDate: string;
  startTime: string;
  endTime: string;
  minDate: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function SingleDayBookingFields({
  startDate,
  startTime,
  endTime,
  minDate,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: SingleDayBookingFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="singleDate" className="text-sm font-semibold">
          Fecha del Servicio / Uso
        </Label>
        <Input
          id="singleDate"
          type="date"
          min={minDate}
          value={startDate}
          onChange={(event) => onDateChange(event.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="text-sm font-semibold">
            Hora de Entrada / Inicio
          </Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(event) => onStartTimeChange(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime" className="text-sm font-semibold">
            Hora de Salida / Fin
          </Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(event) => onEndTimeChange(event.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
