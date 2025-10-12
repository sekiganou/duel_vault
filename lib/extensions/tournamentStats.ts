import { Match, Tournament, TournamentDeckStats } from "@/generated/prisma";
import { TournamentWithRelations } from "@/types";

export function sortByPosition(
  deckStats: TournamentDeckStats[],
  matches: Match[]
): any[] {
  return deckStats
    .sortByWinsAndLosses(
      (deckStat) => deckStat.wins,
      (deckStat) => deckStat.losses
    )
    .sort((a, b) => {
      // If wins and losses are the same, use last match date as tiebreaker
      if (a.wins === b.wins && a.losses === b.losses) {
        // Find each deck's last match (their elimination match or final match)
        const aDeckMatches = matches
          .filter(
            (match) => match.deckAId === a.deckId || match.deckBId === a.deckId
          )
          .sort(
            (m1, m2) =>
              new Date(m2.date).getTime() - new Date(m1.date).getTime()
          );

        const bDeckMatches = matches
          .filter(
            (match) => match.deckAId === b.deckId || match.deckBId === b.deckId
          )
          .sort(
            (m1, m2) =>
              new Date(m2.date).getTime() - new Date(m1.date).getTime()
          );

        // Deck with later final match gets better placement (lower index)
        const aLastMatch = aDeckMatches[0]?.date;
        const bLastMatch = bDeckMatches[0]?.date;

        if (aLastMatch && bLastMatch) {
          return (
            new Date(bLastMatch).getTime() - new Date(aLastMatch).getTime()
          );
        }
      }
      return 0; // No change if not tied or no match data
    });
}
