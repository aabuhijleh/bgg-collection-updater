import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGameDetails, RateLimitError, searchGame } from "~/lib/bgg-api";

const fetchMock = vi.fn();
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  fetchMock.mockReset();
});

describe("searchGame", () => {
  it("returns found result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "found", id: 13, name: "Catan" }),
    });

    const result = await searchGame("Catan");
    expect(result).toEqual({ status: "found", id: 13, name: "Catan" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/search?name=Catan"),
    );
  });

  it("returns not_found result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "not_found" }),
    });

    const result = await searchGame("xyznonexistent");
    expect(result).toEqual({ status: "not_found" });
  });

  it("returns ambiguous result with candidate IDs", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          status: "ambiguous",
          candidateIds: [13, 27710, 926],
        }),
    });

    const result = await searchGame("Catan");
    expect(result).toEqual({
      status: "ambiguous",
      candidateIds: [13, 27710, 926],
    });
  });

  it("throws RateLimitError on 429", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 });

    await expect(searchGame("Catan")).rejects.toThrow(RateLimitError);
  });

  it("throws on non-OK response", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(searchGame("Catan")).rejects.toThrow("BGG search failed: 500");
  });
});

describe("fetchGameDetails", () => {
  it("returns game details", async () => {
    const details = [
      {
        id: 13,
        name: "Catan",
        thumbnail: "https://example.com/thumb.jpg",
        yearPublished: 1995,
        alternateNames: ["Settlers of Catan"],
        totalVotes: 2345,
      },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(details),
    });

    const result = await fetchGameDetails([13]);
    expect(result).toEqual(details);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/details?ids=13"),
    );
  });

  it("joins multiple IDs with commas", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await fetchGameDetails([13, 27710]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/details?ids=13%2C27710"),
    );
  });

  it("throws RateLimitError on 429", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 });

    await expect(fetchGameDetails([13])).rejects.toThrow(RateLimitError);
  });
});
