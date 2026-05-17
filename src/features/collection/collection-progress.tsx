import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
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
  const table = useReactTable({
    data: games,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

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
            : "Logging into BGG and adding games. This runs a browser in the background."}
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
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
