interface BookingNotesProps {
  notes: string;
}

export function BookingNotes({ notes }: BookingNotesProps) {
  return (
    <div className="space-y-1 rounded bg-muted/50 p-2.5 text-xs">
      <span className="font-semibold text-muted-foreground">Notas:</span>
      <p className="italic">{notes}</p>
    </div>
  );
}
