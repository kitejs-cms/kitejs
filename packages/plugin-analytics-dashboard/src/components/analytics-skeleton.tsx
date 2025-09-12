import { Skeleton, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@kitejs-cms/dashboard-core";
import type { ReactNode } from "react";

interface AnalyticsSkeletonProps {
  headers: ReactNode[];
}

export function AnalyticsSkeleton({ headers }: AnalyticsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:items-center gap-4">
      <Skeleton className="h-80 w-full" />
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, i) => (
              <TableHead key={i} className={i > 0 ? "text-right" : undefined}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {headers.map((_, j) => (
                <TableCell key={j} className={j > 0 ? "text-right" : undefined}>
                  <Skeleton className={`h-4 ${j === 0 ? "w-40" : "w-16 ml-auto"}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AnalyticsSkeleton;
