import { ExternalLink, Image } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { BggGameDetail } from "~/lib/bgg-api";

interface DisambiguationRowProps {
  candidates: BggGameDetail[];
  searchName: string;
  onSelect: (bggId: number, name: string) => void;
  onSkip: () => void;
}

export function DisambiguationRow({
  candidates,
  searchName,
  onSelect,
  onSkip,
}: DisambiguationRowProps) {
  return (
    <div className="space-y-3 py-3">
      <p className="text-muted-foreground text-sm">
        Multiple matches for <strong>"{searchName}"</strong>. Pick the correct
        game:
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {candidates.map((game) => {
          const matchingAltName = game.alternateNames.find(
            (alt) => alt.toLowerCase() === searchName.toLowerCase(),
          );
          return (
            <Card
              key={game.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => onSelect(game.id, game.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelect(game.id, game.name);
                }
              }}
            >
              <CardContent className="p-3">
                {game.thumbnail ? (
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="mb-2 aspect-square w-full rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="mb-2 flex aspect-square w-full items-center justify-center rounded bg-muted">
                    <Image className="size-8 text-muted-foreground" />
                  </div>
                )}
                <p className="line-clamp-2 font-medium text-sm">{game.name}</p>
                {game.yearPublished && (
                  <p className="text-muted-foreground text-xs">
                    {game.yearPublished}
                  </p>
                )}
                {matchingAltName && (
                  <p className="text-muted-foreground text-xs italic">
                    aka "{matchingAltName}"
                  </p>
                )}
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-foreground text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  BGG <ExternalLink className="size-3" />
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button variant="outline" size="sm" onClick={onSkip}>
        None of these
      </Button>
    </div>
  );
}
