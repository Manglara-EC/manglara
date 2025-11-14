import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t: tAdmin } = useTranslation("admin");

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent h-8"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp />
            ) : (
              <ChevronsUpDown />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="text-muted-foreground/70 h-3.5 w-3.5" />
            {tAdmin("dataTableColumnHeader.text.asc")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="text-muted-foreground/70 h-3.5 w-3.5" />
            {tAdmin("dataTableColumnHeader.text.desc")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="text-muted-foreground/70 h-3.5 w-3.5" />
            {tAdmin("dataTableColumnHeader.actions.hide")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
