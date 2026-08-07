import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BookingDateColumnProps {
  startDate: Date;
  showDate: boolean;
  showTime?: boolean;
}

export function BookingDateColumn({
  startDate,
  showDate,
  showTime = true,
}: BookingDateColumnProps) {
  return (
    <time
      dateTime={startDate.toISOString()}
      className="pt-1 text-right leading-none"
    >
      {showDate && (
        <>
          <span className="block text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {format(startDate, "MMM yyyy", { locale: es })}
          </span>
          <span className="mt-1 block text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {format(startDate, "dd")}
          </span>
        </>
      )}
      {showTime && (
        <span
          className={`block text-sm font-semibold text-primary ${
            showDate ? "mt-1" : "pt-3"
          }`}
        >
          {format(startDate, "HH:mm")}
        </span>
      )}
    </time>
  );
}
