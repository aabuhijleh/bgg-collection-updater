import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { CollectionGameEntry } from "./collection.types";

interface CollectionProgressProps {
  games: CollectionGameEntry[];
  phase: string;
  progress: { current: number; total: number };
  error: string | null;
  summary: { added: number; failed: number } | null;
  onRetryFailed?: () => void;
  onReset?: () => void;
}

const statusDisplay: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
  adding: {
    label: "Adding...",
    variant: "secondary",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  added: {
    label: "Added",
    variant: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  already_owned: {
    label: "Already in Collection",
    variant: "outline",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  skipped: {
    label: "Skipped",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
};

function nameFilterFn(
  row: { original: CollectionGameEntry },
  _columnId: string,
  filterValue: string,
): boolean {
  const query = filterValue.toLowerCase();
  return (
    (row.original.name?.toLowerCase().includes(query) ?? false) ||
    String(row.original.bggId).includes(query)
  );
}

const columns: ColumnDef<CollectionGameEntry>[] = [
  {
    accessorKey: "bggId",
    header: "BGG ID",
    cell: ({ row }) => (
      <a
        href={`https://boardgamegeek.com/boardgame/${row.original.bggId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:underline"
      >
        {row.original.bggId}
      </a>
    ),
  },
  {
    accessorKey: "name",
    header: "Game",
    cell: ({ row }) => row.original.name ?? "—",
    filterFn: nameFilterFn,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = statusDisplay[row.original.status];
      return (
        <Badge variant={cfg?.variant ?? "outline"} className="gap-1">
          {cfg?.icon}
          {cfg?.label ?? row.original.status}
        </Badge>
      );
    },
  },
];

export function CollectionProgress({
  games,
  phase,
  progress,
  error,
  summary,
  onRetryFailed,
  onReset,
}: CollectionProgressProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: games,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    initialState: { pagination: { pageSize: 50 } },
  });

  const searchValue =
    (table.getColumn("name")?.getFilterValue() as string) ?? "";
  const statusValue =
    (table.getColumn("status")?.getFilterValue() as string) ?? "all";

  const progressPercent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const phaseLabel: Record<string, string> = {
    connecting: "Connecting to BGG...",
    scanning: "Scanning your existing collection...",
    adding: `Adding games (${progress.current}/${progress.total})`,
    done: "Complete",
    error: "Error",
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-2xl tracking-tight">
          {phase === "done" ? "Results" : "Adding to Collection"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {phase === "done"
            ? "Here's what happened."
            : "Logging into BGG and adding games in a browser window."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {phase !== "done" && phase !== "error" && phase !== "idle" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{phaseLabel[phase] ?? phase}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
      )}

      {summary && (
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 dark:text-green-400">
            <strong>{summary.added}</strong> added
          </span>
          {summary.failed > 0 && (
            <span className="text-red-600 dark:text-red-400">
              <strong>{summary.failed}</strong> failed
            </span>
          )}
          <span className="text-muted-foreground">
            <strong>
              {games.filter((g) => g.status === "already_owned").length}
            </strong>{" "}
            already in collection
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search games..."
          value={searchValue}
          onChange={(e) =>
            table.getColumn("name")?.setFilterValue(e.target.value || undefined)
          }
          className="max-w-xs"
        />
        <Select
          value={statusValue}
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="added">Added</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="already_owned">Already in Collection</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}

      {phase === "done" && (
        <div className="flex gap-2">
          {summary && summary.failed > 0 && onRetryFailed && (
            <Button variant="outline" onClick={onRetryFailed}>
              Retry Failed ({summary.failed})
            </Button>
          )}
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              Start Over
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
