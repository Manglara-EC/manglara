import { Skeleton } from "@/shared/components/ui/skeleton";

export const OrganizationsListSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 md:w-60">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
};
