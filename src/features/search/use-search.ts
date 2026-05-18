import { useRef, useState } from "react";
import { delay } from "~/lib/bgg-api";
import { searchSingleGame } from "./search.api";
import type { SearchResultEntry } from "./search.types";

type SearchPhase = "idle" | "searching" | "done";

export function useSearch() {
  const [results, setResults] = useState<SearchResultEntry[]>([]);
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startSearch = async (names: string[]) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setResults(
      names.map((name) => ({
        inputName: name,
        status: "pending" as const,
        bggId: null,
        matchedName: null,
        thumbnail: null,
        yearPublished: null,
        candidates: [],
      })),
    );
    setPhase("searching");
    setError(null);

    let wasRateLimited = false;

    for (let i = 0; i < names.length; i++) {
      if (abort.signal.aborted) break;

      setResults((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: "searching" };
        return next;
      });

      let entry: SearchResultEntry | null = null;

      for (let attempt = 0; attempt <= 3; attempt++) {
        if (abort.signal.aborted) break;

        try {
          entry = await searchSingleGame({ data: { name: names[i] } });
          break;
        } catch {
          if (attempt < 3) {
            const backoffMs = 10_000 * 2 ** attempt;
            const seconds = Math.round(backoffMs / 1000);
            setRateLimitCountdown(seconds);

            let remaining = seconds;
            const interval = setInterval(() => {
              remaining--;
              if (remaining <= 0) {
                clearInterval(interval);
                setRateLimitCountdown(null);
              } else {
                setRateLimitCountdown(remaining);
              }
            }, 1000);

            await delay(backoffMs);
            clearInterval(interval);
            setRateLimitCountdown(null);
            wasRateLimited = true;
          } else {
            entry = {
              inputName: names[i],
              status: "not_found",
              bggId: null,
              matchedName: null,
              thumbnail: null,
              yearPublished: null,
              candidates: [],
            };
          }
        }
      }

      if (abort.signal.aborted) break;

      if (entry) {
        const captured = entry;
        setResults((prev) => {
          const next = [...prev];
          next[i] = captured;
          return next;
        });
      }

      if (i < names.length - 1) {
        await delay(wasRateLimited ? 15_000 : 2_000);
      }
    }

    setRateLimitCountdown(null);
    setPhase("done");
  };

  const cancelSearch = () => {
    abortRef.current?.abort();
    setRateLimitCountdown(null);
    setResults((prev) =>
      prev.map((r) =>
        r.status === "pending" || r.status === "searching"
          ? { ...r, status: "skipped" }
          : r,
      ),
    );
    setPhase("done");
  };

  const resolveAmbiguous = (
    index: number,
    bggId: number,
    name: string,
    yearPublished: number | null,
    thumbnail: string | null,
  ) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        status: "found",
        bggId,
        matchedName: name,
        thumbnail,
        yearPublished,
        candidates: [],
      };
      return next;
    });
  };

  const skipAmbiguous = (index: number) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        status: "skipped",
        candidates: [],
      };
      return next;
    });
  };

  const removeResult = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    abortRef.current?.abort();
    setResults([]);
    setPhase("idle");
    setError(null);
    setRateLimitCountdown(null);
  };

  const resolvedResults = results.filter(
    (r) => r.status === "found" && r.bggId != null,
  );

  const hasUnresolvedAmbiguous = results.some((r) => r.status === "ambiguous");

  return {
    results,
    phase,
    rateLimitCountdown,
    error,
    resolvedResults,
    hasUnresolvedAmbiguous,
    startSearch,
    cancelSearch,
    resolveAmbiguous,
    skipAmbiguous,
    removeResult,
    reset,
  };
}
