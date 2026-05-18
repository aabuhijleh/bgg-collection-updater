import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { Fragment, useState } from "react";
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
import { generateCsv } from "~/lib/csv";
import { DisambiguationRow } from "./disambiguation-row";
import type { SearchResultEntry } from "./search.types";

interface SearchResultsTableProps {
  results: SearchResultEntry[];
  onResolve: (index: number, bggId: number, name: string) => void;
  onSkip: (index: number) => void;
  onAddToCollection: () => void;
  isSearching: boolean;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  searching: { label: "Searching...", variant: "secondary" },
  found: { label: "Found", variant: "success" },
  ambiguous: { label: "Ambiguous", variant: "secondary" },
  not_found: { label: "Not Found", variant: "destructive" },
  skipped: { label: "Skipped", variant: "outline" },
};

function searchFilterFn(
  row: { original: SearchResultEntry },
  _columnId: string,
  filterValue: string,
): boolean {
  const query = filterValue.toLowerCase();
  return (
    row.original.inputName.toLowerCase().includes(query) ||
    (row.original.matchedName?.toLowerCase().includes(query) ?? false)
  );
}

const columns: ColumnDef<SearchResultEntry>[] = [
  {
    id: "expander",
    size: 40,
    cell: ({ row }) => {
      if (row.original.status !== "ambiguous") return null;
      return (
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          <span className="sr-only">Toggle disambiguation options</span>
        </Button>
      );
    },
  },
  {
    accessorKey: "inputName",
    header: "Name",
    filterFn: searchFilterFn,
  },
  {
    accessorKey: "matchedName",
    header: "Match",
    cell: ({ row }) => row.original.matchedName ?? "—",
  },
  {
    accessorKey: "bggId",
    header: "BGG ID",
    cell: ({ row }) =>
      row.original.bggId ? (
        <a
          href={`https://boardgamegeek.com/boardgame/${row.original.bggId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground hover:underline"
        >
          {row.original.bggId}
          <ExternalLink className="size-3" />
        </a>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = statusConfig[row.original.status];
      return (
        <Badge variant={cfg?.variant ?? "outline"}>
          {row.original.status === "searching" && (
            <Loader2 className="mr-1 size-3 animate-spin" />
          )}
          {cfg?.label ?? row.original.status}
        </Badge>
      );
    },
  },
];

export function SearchResultsTable({
  results,
  onResolve,
  onSkip,
  onAddToCollection,
  isSearching,
}: SearchResultsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const table = useReactTable({
    data: results,
    columns,
    state: { expanded, columnFilters, pagination },
    onExpandedChange: setExpanded,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getRowCanExpand: (row) => row.original.status === "ambiguous",
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const searchValue =
    (table.getColumn("inputName")?.getFilterValue() as string) ?? "";
  const statusValue =
    (table.getColumn("status")?.getFilterValue() as string) ?? "all";

  const foundCount = results.filter((r) => r.status === "found").length;
  const notFoundCount = results.filter((r) => r.status === "not_found").length;
  const ambiguousCount = results.filter((r) => r.status === "ambiguous").length;

  const completedCount = results.filter(
    (r) => r.status !== "pending" && r.status !== "searching",
  ).length;
  const progressPercent =
    results.length > 0
      ? Math.round((completedCount / results.length) * 100)
      : 0;

  const handleDownloadCsv = () => {
    const csvRows = results
      .filter(
        (r): r is SearchResultEntry & { bggId: number } =>
          r.status === "found" && r.bggId != null,
      )
      .map((r) => ({ name: r.matchedName ?? r.inputName, bggId: r.bggId }));
    const csv = generateCsv(csvRows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bgg-search-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-2xl tracking-tight">
          Search Results
        </h2>
        <p className="text-muted-foreground text-sm">
          Review matches. Click to resolve ambiguous results, then add to your
          collection.
        </p>
      </div>

      {isSearching && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Search className="size-4 animate-pulse" />
              Searching ({completedCount}/{results.length})
            </span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">
          <span className="text-green-600 dark:text-green-400">
            <strong>{foundCount}</strong> found
          </span>
          {" · "}
          <strong>{ambiguousCount}</strong> ambiguous
          {" · "}
          <strong>{notFoundCount}</strong> not found
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            disabled={foundCount === 0}
          >
            <Download />
            Download CSV
          </Button>
          <Button
            size="sm"
            onClick={onAddToCollection}
            disabled={isSearching || foundCount === 0}
          >
            Add to Collection ({foundCount})
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search games..."
          value={searchValue}
          onChange={(e) =>
            table
              .getColumn("inputName")
              ?.setFilterValue(e.target.value || undefined)
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
            <SelectItem value="found">Found</SelectItem>
            <SelectItem value="ambiguous">Ambiguous</SelectItem>
            <SelectItem value="not_found">Not Found</SelectItem>
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
                <Fragment key={row.id}>
                  <TableRow>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <DisambiguationRow
                          candidates={row.original.candidates}
                          searchName={row.original.inputName}
                          onSelect={(bggId, name) => {
                            onResolve(row.index, bggId, name);
                            row.toggleExpanded(false);
                          }}
                          onSkip={() => {
                            onSkip(row.index);
                            row.toggleExpanded(false);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
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
    </section>
  );
}
