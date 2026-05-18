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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  ExternalLink,
  Image,
  Loader2,
  Trash2,
  X,
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
  onResolve: (
    index: number,
    bggId: number,
    name: string,
    yearPublished: number | null,
    thumbnail: string | null,
  ) => void;
  onSkip: (index: number) => void;
  onRemove: (index: number) => void;
  onAddToCollection: () => void;
  onCancelSearch: () => void;
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
  searching: { label: "Searching", variant: "secondary" },
  found: { label: "Found", variant: "success" },
  ambiguous: { label: "Ambiguous", variant: "default" },
  not_found: { label: "Not Found", variant: "destructive" },
  skipped: { label: "Skipped", variant: "outline" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status];
  if (!config) return null;
  return (
    <Badge variant={config.variant}>
      {status === "searching" && <Loader2 className="size-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}

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

export function SearchResultsTable({
  results,
  onResolve,
  onSkip,
  onRemove,
  onAddToCollection,
  onCancelSearch,
  isSearching,
}: SearchResultsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const columns: ColumnDef<SearchResultEntry>[] = [
    {
      id: "expander",
      size: 40,
      header: () => null,
      cell: ({ row }) => {
        if (row.original.status !== "ambiguous") return null;
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => row.toggleExpanded()}
            aria-expanded={row.getIsExpanded()}
          >
            <ChevronDown
              className={`size-4 transition-transform ${row.getIsExpanded() ? "rotate-180" : ""}`}
            />
            <span className="sr-only">Toggle disambiguation options</span>
          </Button>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return row.original.status === filterValue;
      },
    },
    {
      accessorKey: "inputName",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          {row.original.thumbnail ? (
            <img
              src={row.original.thumbnail}
              alt=""
              className="size-8 shrink-0 rounded object-cover"
              loading="lazy"
            />
          ) : (
            row.original.status === "found" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                <Image className="size-4 text-muted-foreground" />
              </div>
            )
          )}
          <span className="truncate">{row.original.inputName}</span>
        </div>
      ),
    },
    {
      accessorKey: "matchedName",
      header: "BGG Match",
      cell: ({ row }) => {
        const { bggId, matchedName } = row.original;
        if (!matchedName || !bggId) return null;
        return (
          <a
            href={`https://boardgamegeek.com/boardgame/${bggId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 text-sm hover:underline"
          >
            <span className="truncate">{matchedName}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
        );
      },
    },
    {
      accessorKey: "yearPublished",
      header: "Year",
      cell: ({ row }) => row.original.yearPublished ?? "",
    },
    {
      id: "actions",
      size: 40,
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(row.index)}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Remove</span>
        </Button>
      ),
    },
  ];

  const resetPagination = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const table = useReactTable({
    data: results,
    columns,
    state: { expanded, columnFilters, globalFilter, pagination },
    onExpandedChange: setExpanded,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      resetPagination();
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      resetPagination();
    },
    onPaginationChange: setPagination,
    globalFilterFn: searchFilterFn,
    getRowCanExpand: (row) => row.original.status === "ambiguous",
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const totalCount = results.length;
  const foundCount = results.filter((r) => r.status === "found").length;
  const notFoundCount = results.filter((r) => r.status === "not_found").length;
  const ambiguousCount = results.filter((r) => r.status === "ambiguous").length;
  const pendingCount = results.filter(
    (r) => r.status === "pending" || r.status === "searching",
  ).length;

  const completedCount = totalCount - pendingCount;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

  const paginatedRows = table.getRowModel().rows;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-2xl tracking-tight">
          Search Results
        </h2>
        <Button
          size="sm"
          onClick={onAddToCollection}
          disabled={isSearching || foundCount === 0}
        >
          Add to Collection ({foundCount})
        </Button>
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="default" className="tabular-nums">
          {totalCount} scanned
        </Badge>
        {foundCount > 0 && (
          <Badge variant="success" className="tabular-nums">
            {foundCount} found
          </Badge>
        )}
        {ambiguousCount > 0 && (
          <Badge variant="default" className="tabular-nums">
            {ambiguousCount} ambiguous
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="tabular-nums">
            <Loader2 className="size-3 animate-spin" />
            {pendingCount} pending
          </Badge>
        )}
        {notFoundCount > 0 && (
          <Badge variant="destructive" className="tabular-nums">
            {notFoundCount} not found
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      {isSearching && (
        <div className="flex items-center gap-2">
          <Progress value={progressPercent} className="flex-1" />
          <span className="text-muted-foreground text-sm tabular-nums">
            {progressPercent}%
          </span>
          <Button variant="outline" size="sm" onClick={onCancelSearch}>
            <X />
            Cancel
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Search names, BGG matches..."
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            resetPagination();
          }}
        />
        <div className="flex gap-2">
          <Select
            value={
              (table.getColumn("status")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-28 shrink-0">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="found">Found</SelectItem>
              <SelectItem value="ambiguous">Ambiguous</SelectItem>
              <SelectItem value="not_found">Not Found</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={handleDownloadCsv}
              disabled={foundCount === 0}
            >
              <Download />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
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
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    aria-expanded={row.getIsExpanded() ? "true" : undefined}
                  >
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
                          onSelect={(bggId, name, yearPublished, thumbnail) => {
                            onResolve(
                              row.index,
                              bggId,
                              name,
                              yearPublished,
                              thumbnail,
                            );
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

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-3.5" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-3.5" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-3.5" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-3.5" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
