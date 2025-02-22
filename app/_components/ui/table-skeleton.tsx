import { Skeleton } from "@/app/_components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows: number;
  showFooter?: boolean;
}

export function TableSkeleton({
  columns,
  rows,
  showFooter,
}: TableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-[100px]" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-[100px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {showFooter && (
        <TableRow>
          <TableCell colSpan={columns - 2}>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
        </TableRow>
      )}
    </Table>
  );
}
