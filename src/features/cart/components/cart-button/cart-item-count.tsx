import { Badge } from "@/shared/components/ui/badge";

interface CartItemCountProps {
  totalItems: number;
}

export function CartItemCount({ totalItems }: CartItemCountProps) {
  return (
    <Badge
      variant="destructive"
      className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
    >
      {totalItems}
    </Badge>
  );
}
