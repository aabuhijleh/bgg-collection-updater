export function parseInput(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const semicolons = (trimmed.match(/;/g) || []).length;
  const newlines = (trimmed.match(/\n/g) || []).length;
  const commas = (trimmed.match(/,/g) || []).length;

  let delimiter: string;
  if (semicolons >= newlines && semicolons >= commas) {
    delimiter = ";";
  } else if (newlines >= commas) {
    delimiter = "\n";
  } else {
    delimiter = ",";
  }

  const items = trimmed
    .split(delimiter)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  return [...new Set(items)];
}

export interface ParsedIdEntry {
  id: number;
  name: string | null;
}

export function parseIds(raw: string): ParsedIdEntry[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const headerColumns =
    lines.length > 0
      ? lines[0].split(/[,;]/).map((c) => c.trim().replace(/^["']|["']$/g, ""))
      : [];
  const idColumnIndex = headerColumns.findIndex((c) => /^bgg[_ ]?id$/i.test(c));
  const bggNameIndex = headerColumns.findIndex((c) =>
    /^bgg[_ ]?name$/i.test(c),
  );
  const genericNameIndex = headerColumns.findIndex((c) =>
    /^(name|product[_ ]?title)$/i.test(c),
  );
  const nameColumnIndex = bggNameIndex !== -1 ? bggNameIndex : genericNameIndex;
  const hasHeader =
    idColumnIndex !== -1 ||
    (lines.length > 0 && /bgg_id|bggid|id/i.test(lines[0]));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const seen = new Set<number>();
  const entries: ParsedIdEntry[] = [];
  for (const line of dataLines) {
    const parts = line
      .split(/[,;]/)
      .map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (idColumnIndex !== -1) {
      const val = parts[idColumnIndex];
      if (val) {
        const num = Number(val);
        if (
          !Number.isNaN(num) &&
          num > 0 &&
          Number.isInteger(num) &&
          !seen.has(num)
        ) {
          seen.add(num);
          const name =
            nameColumnIndex !== -1 ? parts[nameColumnIndex] || null : null;
          entries.push({ id: num, name });
        }
      }
    } else {
      for (const part of parts) {
        const num = Number(part);
        if (
          !Number.isNaN(num) &&
          num > 0 &&
          Number.isInteger(num) &&
          !seen.has(num)
        ) {
          seen.add(num);
          entries.push({ id: num, name: null });
        }
      }
    }
  }

  return entries;
}

export function generateCsv(rows: { name: string; bggId: number }[]): string {
  const header = "name,bgg_id";
  const lines = rows.map((r) => {
    const name = r.name.includes(",") ? `"${r.name}"` : r.name;
    return `${name},${r.bggId}`;
  });
  return [header, ...lines].join("\n");
}

export function generateCollectionCsv(
  rows: { name: string | null; bggId: number; status: string }[],
): string {
  const header = "name,bgg_id,status";
  const lines = rows.map((r) => {
    const name = r.name ? (r.name.includes(",") ? `"${r.name}"` : r.name) : "";
    return `${name},${r.bggId},${r.status}`;
  });
  return [header, ...lines].join("\n");
}
