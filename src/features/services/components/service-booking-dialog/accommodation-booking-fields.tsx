import { Calendar } from "@/shared/components/ui/calendar";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2Icon } from "lucide-react";

interface AccommodationBookingFieldsProps {
  startDate: string;
  endDate: string;
  minDate: string;
  calendarMonth: Date;
  occupiedDays: Date[];
  isCalendarLoading: boolean;
  calendarError: string | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onMonthChange: (month: Date) => void;
}

export function AccommodationBookingFields({
  startDate,
  endDate,
  minDate,
  calendarMonth,
  occupiedDays,
  isCalendarLoading,
  calendarError,
  onStartDateChange,
  onEndDateChange,
  onMonthChange,
}: AccommodationBookingFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="checkIn" className="text-xs font-semibold">
            Fecha de Check-in
          </Label>
          <Input
            id="checkIn"
            type="date"
            min={minDate}
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkOut" className="text-xs font-semibold">
            Fecha de Check-out
          </Label>
          <Input
            id="checkOut"
            type="date"
            min={startDate}
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Disponibilidad</p>
            <p className="text-xs text-muted-foreground">
              Las fechas en rojo ya están ocupadas o bloqueadas.
            </p>
          </div>
          {isCalendarLoading && (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>

        {calendarError ? (
          <p className="text-sm text-destructive">{calendarError}</p>
        ) : (
          <Calendar
            month={calendarMonth}
            onMonthChange={onMonthChange}
            showOutsideDays={false}
            modifiers={{ occupied: occupiedDays }}
            modifiersClassNames={{
              occupied:
                "bg-destructive/10 text-destructive line-through hover:bg-destructive/15",
            }}
            className="w-full rounded-md bg-background p-2"
          />
        )}
      </div>
    </div>
  );
}
