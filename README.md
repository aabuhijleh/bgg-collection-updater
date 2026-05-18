# BGG Collection Updater

Bulk-add board games to your [BoardGameGeek](https://boardgamegeek.com) collection. Search games by name to find their BGG IDs, or paste IDs directly, then add them all to your collection in one go. Runs locally on your machine using browser automation (Playwright).

<https://github.com/user-attachments/assets/af0c9473-50da-4f61-9716-8f3491dbc8cd>

## Prerequisites

- [Bun](https://bun.sh)
- A BGG account

## Quick Start

```bash
bun install
bun start
```

Open `http://localhost:3000`. Click the gear icon to enter your BGG username and password.

## Example Files

Sample input files are in the `examples/` directory:

- `search-by-name.csv` -- game names for the "Search by Name" tab
- `add-by-ids.csv` -- BGG IDs for the "I Already Have IDs" tab

Upload these via the "Upload CSV" button or copy-paste the contents.

## Data Storage

Your BGG credentials (username and password) are stored locally in a JSON file in your home directory. Search queries are proxied through the [BGG Scan](https://bgg-scan.aabuhijleh.com/) API; credentials are only sent to BGG itself during collection upload.

| OS              | Path                                          |
| --------------- | --------------------------------------------- |
| macOS and Linux | `~/.bgg-collection-updater.json`              |
| Windows         | `C:\Users\<you>\.bgg-collection-updater.json` |

The file contains:

```json
{
  "username": "your-bgg-username",
  "password": "your-bgg-password"
}
```

No other data is persisted to disk. Search results and collection state exist only in the browser while the app is running.

## How It Works

1. **Enter games** -- paste names (semicolon, newline, or comma separated) or upload a CSV. If you already have BGG IDs, switch to the "I Already Have IDs" tab.
2. **Review search results** -- the app searches BGG for each name via the [BGG Scan](https://bgg-scan.aabuhijleh.com/) API. Ambiguous matches expand inline so you can pick the right game. Download results as CSV.
3. **Add to collection** -- the app launches a headless browser, logs into BGG with your username and password, checks what you already own, and adds the new games. Progress streams in real time.

## Related

**[BGG Scan](https://bgg-scan.aabuhijleh.com/)** ([source](https://github.com/aabuhijleh/bgg-scan)) -- scan board game barcodes with your phone camera to quickly look up games on BoardGameGeek. Useful for identifying games at a store or collection and getting their BGG IDs, which you can then bulk-add here.

## Credits

Based on the work by [@fenglisch](https://github.com/fenglisch):

- [translate-board-game-names-into-bgg-ids](https://github.com/fenglisch/translate-board-game-names-into-bgg-ids) -- name-to-ID search logic
- [bulk-upload-board-games-into-bgg-collection](https://github.com/fenglisch/bulk-upload-board-games-into-bgg-collection) -- Browser automation-based collection upload
