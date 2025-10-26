import { Skeleton } from "@/shared/components/ui/skeleton";

export const OrganizationPageHeaderSkeleton = () => (
  <div className="sticky top-0 flex items-center justify-between pb-2 backdrop-blur-sm md:static md:pb-0 md:backdrop-blur-none">
    <div>
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className="h-7 w-40" />
      </div>
      <Skeleton className="mt-2 h-4 w-32" />
    </div>
    <div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </div>
);
