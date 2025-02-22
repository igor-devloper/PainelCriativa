import { Skeleton } from "@/app/_components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </CardContent>
    </Card>
  );
}
