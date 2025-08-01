-- Add check constraints to ensure stats are non-negative
ALTER TABLE "decks" ADD CONSTRAINT "deck_wins_non_negative" CHECK ("wins" >= 0);
ALTER TABLE "decks" ADD CONSTRAINT "deck_losses_non_negative" CHECK ("losses" >= 0);
ALTER TABLE "decks" ADD CONSTRAINT "deck_ties_non_negative" CHECK ("ties" >= 0);

-- Also add constraints for TournamentDeckStats table
ALTER TABLE "tournament_deck_stats" ADD CONSTRAINT "tournament_stats_wins_non_negative" CHECK ("wins" >= 0);
ALTER TABLE "tournament_deck_stats" ADD CONSTRAINT "tournament_stats_losses_non_negative" CHECK ("losses" >= 0);
ALTER TABLE "tournament_deck_stats" ADD CONSTRAINT "tournament_stats_ties_non_negative" CHECK ("ties" >= 0);
ALTER TABLE "tournament_deck_stats" ADD CONSTRAINT "tournament_stats_final_rank_positive" CHECK ("finalRank" > 0);