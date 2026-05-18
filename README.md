# BGG Collection Updater

Bulk-add board games to your [BoardGameGeek](https://boardgamegeek.com) collection. Search games by name to find their BGG IDs, or paste IDs directly, then add them all to your collection in one go. Runs locally on your machine using browser automation (Playwright).

<https://github.com/user-attachments/assets/af0c9473-50da-4f61-9716-8f3491dbc8cd>

## Prerequisites

- [Bun](https://bun.sh)
- A BGG account
- A BGG [XML API](https://boardgamegeek.com/using_the_xml_api)) token
  - [Register an application to get a token here](https://boardgamegeek.com/applications)

## Quick Start

```bash
bun install
bun dev
```

Open `http://localhost:3000`. Click the gear icon to enter your BGG username, password, and API token.

## Example Files

Sample input files are in the `examples/` directory:

- `search-by-name.csv` -- game names for the "Search by Name" tab
- `add-by-ids.csv` -- BGG IDs for the "I Already Have IDs" tab

Upload these via the "Upload CSV" button or copy-paste the contents.

## Data Storage

Your BGG credentials (username, password, API token) are stored locally in a JSON file in your home directory. Nothing is sent to any server other than BGG itself.

| OS              | Path                                          |
| --------------- | --------------------------------------------- |
| macOS and Linux | `~/.bgg-collection-updater.json`              |
| Windows         | `C:\Users\<you>\.bgg-collection-updater.json` |

The file contains:

```json
{
  "username": "your-bgg-username",
  "password": "your-bgg-password",
  "apiToken": "your-bgg-api-token"
}
```

No other data is persisted to disk. Search results and collection state exist only in the browser while the app is running.

## How It Works

1. **Enter games** -- paste names (semicolon, newline, or comma separated) or upload a CSV. If you already have BGG IDs, switch to the "I Already Have IDs" tab.
2. **Review search results** -- the app searches the BGG API for each name. Ambiguous matches expand inline so you can pick the right game. Download results as CSV.
3. **Add to collection** -- the app launches a headless browser, logs into BGG with your credentials, checks what you already own, and adds the new games. Progress streams in real time.
