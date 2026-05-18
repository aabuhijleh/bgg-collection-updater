import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Dices } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "~/components/theme-toggle";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { CollectionProgress } from "~/features/collection/collection-progress";
import { useCollectionStream } from "~/features/collection/use-collection-stream";
import { SettingsSheet } from "~/features/config/settings-sheet";
import { configQueryOptions, useConfig } from "~/features/config/use-config";
import { InputSection } from "~/features/search/input-section";
import { SearchResultsTable } from "~/features/search/search-results-table";
import { useSearch } from "~/features/search/use-search";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(configQueryOptions),
  component: Home,
});

type AppPhase = "input" | "searching" | "search_results" | "adding" | "done";

function Home() {
  const { data: config } = useConfig();
  const search = useSearch();
  const collection = useCollectionStream();

  const hasCredentials = Boolean(config?.username && config?.password);
  const hasToken = Boolean(config?.apiToken);
  const isSearching = search.phase === "searching";

  const searchWarning = !hasToken
    ? "Set your XML API token in settings to search by name."
    : null;
  const idsWarning = !hasCredentials
    ? "Set your BGG username and password in settings to add games."
    : null;

  const phase: AppPhase =
    collection.phase !== "idle"
      ? collection.phase === "done" || collection.phase === "error"
        ? "done"
        : "adding"
      : search.phase === "searching"
        ? "searching"
        : search.phase === "done"
          ? "search_results"
          : "input";

  const handleSearchByName = (names: string[], includeExpansions: boolean) => {
    if (!config?.apiToken) {
      toast.error(
        "Please set your XML API token in settings to search by name",
      );
      return;
    }
    search.startSearch(names, config.apiToken, includeExpansions);
  };

  const handleAddByIds = (ids: number[]) => {
    if (!config?.username || !config?.password) {
      toast.error("Please set your BGG credentials in settings first");
      return;
    }
    const nameMap = new Map<number, string>();
    collection.startAddToCollection(
      ids,
      nameMap,
      config.username,
      config.password,
    );
  };

  const handleAddToCollection = () => {
    if (!config?.username || !config?.password) {
      toast.error("Please set your BGG credentials in settings first");
      return;
    }

    const resolved = search.resolvedResults;
    const ids = resolved
      .map((r) => r.bggId)
      .filter((id): id is number => id != null);
    const nameMap = new Map<number, string>();
    for (const r of resolved) {
      if (r.bggId != null) {
        nameMap.set(r.bggId, r.matchedName ?? r.inputName);
      }
    }

    collection.startAddToCollection(
      ids,
      nameMap,
      config.username,
      config.password,
    );
  };

  const handleRetryFailed = () => {
    if (!config?.username || !config?.password) return;
    const failedIds = collection.games
      .filter((g) => g.status === "failed")
      .map((g) => g.bggId);
    const nameMap = new Map<number, string>();
    for (const g of collection.games) {
      if (g.name) nameMap.set(g.bggId, g.name);
    }
    collection.startAddToCollection(
      failedIds,
      nameMap,
      config.username,
      config.password,
    );
  };

  const handleReset = () => {
    search.reset();
    collection.reset();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={handleReset}
        >
          <Dices className="h-8 w-8 shrink-0" />
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              BGG Collection Updater
            </h1>
            <p className="text-muted-foreground text-sm">
              Bulk search and add board games to your BoardGameGeek collection.
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SettingsSheet />
        </div>
      </header>

      <div className="space-y-8">
        {phase === "input" && (
          <InputSection
            onSearchByName={handleSearchByName}
            onAddByIds={handleAddByIds}
            isSearching={isSearching}
            searchWarning={searchWarning}
            idsWarning={idsWarning}
          />
        )}

        {search.rateLimitCountdown && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Rate limited by BGG. Retrying in{" "}
              <strong>{search.rateLimitCountdown}s</strong>...
            </AlertDescription>
          </Alert>
        )}

        {search.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{search.error}</AlertDescription>
          </Alert>
        )}

        {(phase === "searching" || phase === "search_results") &&
          search.results.length > 0 && (
            <>
              <Separator />
              <SearchResultsTable
                results={search.results}
                onResolve={search.resolveAmbiguous}
                onSkip={search.skipAmbiguous}
                onAddToCollection={handleAddToCollection}
                isSearching={isSearching}
              />
            </>
          )}

        {(phase === "adding" || phase === "done") && (
          <>
            <Separator />
            <CollectionProgress
              games={collection.games}
              phase={collection.phase}
              progress={collection.progress}
              error={collection.error}
              onRetryFailed={handleRetryFailed}
              onReset={handleReset}
            />
          </>
        )}
      </div>
    </div>
  );
}
