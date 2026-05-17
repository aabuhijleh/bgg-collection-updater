import { useState } from "react";
import type { SearchResultEntry, SearchStreamEvent } from "./search.types";

type SearchPhase = "idle" | "searching" | "done";

export function useSearch() {
  const [results, setResults] = useState<SearchResultEntry[]>([]);
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const startSearch = async (
    names: string[],
    token: string,
    includeExpansions: boolean,
  ) => {
    setResults(
      names.map((name) => ({
        inputName: name,
        status: "pending" as const,
        bggId: null,
        matchedName: null,
        candidates: [],
      })),
    );
    setPhase("searching");
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names, token, includeExpansions }),
      });

      if (!response.ok || !response.body) {
        setError("Failed to start search");
        setPhase("done");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const dataLine = line.trim();
          if (!dataLine.startsWith("data: ")) continue;
          const json = dataLine.slice(6);

          try {
            const event: SearchStreamEvent = JSON.parse(json);

            if (
              event.type === "result" &&
              event.entry != null &&
              event.index != null
            ) {
              const { index, entry } = event;
              setResults((prev) => {
                const next = [...prev];
                next[index] = entry;
                return next;
              });
            } else if (event.type === "rate_limited" && event.retryIn) {
              setRateLimitCountdown(event.retryIn);
              let remaining = event.retryIn;
              const interval = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                  clearInterval(interval);
                  setRateLimitCountdown(null);
                } else {
                  setRateLimitCountdown(remaining);
                }
              }, 1000);
            } else if (event.type === "done") {
              setPhase("done");
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      setPhase("done");
    } catch {
      setError("Search connection failed");
      setPhase("done");
    }
  };

  const resolveAmbiguous = (index: number, bggId: number, name: string) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        status: "found",
        bggId,
        matchedName: name,
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

  const reset = () => {
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
    resolveAmbiguous,
    skipAmbiguous,
    reset,
  };
}
