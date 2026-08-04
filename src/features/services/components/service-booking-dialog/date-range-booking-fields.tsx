import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface DateRangeBookingFieldsProps {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  minDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function DateRangeBookingFields({
  startDate,
  endDate,
  startTime,
  endTime,
  minDate,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: DateRangeBookingFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-xs font-semibold">
            Fecha de Inicio
          </Label>
          <Input
            id="startDate"
            type="date"
            min={minDate}
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="text-xs font-semibold">
            Hora de Inicio
          </Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(event) => onStartTimeChange(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="endDate" className="text-xs font-semibold">
            Fecha de Fin
          </Label>
          <Input
            id="endDate"
            type="date"
            min={startDate}
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime" className="text-xs font-semibold">
            Hora de Fin
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
