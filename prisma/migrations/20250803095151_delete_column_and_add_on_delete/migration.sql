/*
  Warnings:

  - You are about to drop the column `finalRank` on the `tournament_deck_stats` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tournament_deck_stats" DROP CONSTRAINT "tournament_deck_stats_tournamentId_fkey";

-- AlterTable
ALTER TABLE "public"."tournament_deck_stats" DROP COLUMN "finalRank";

-- AddForeignKey
ALTER TABLE "public"."tournament_deck_stats" ADD CONSTRAINT "tournament_deck_stats_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
