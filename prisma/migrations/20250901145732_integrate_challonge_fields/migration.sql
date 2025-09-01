-- AlterTable
ALTER TABLE "public"."matches" ADD COLUMN     "challongeMatchId" INTEGER;

-- AlterTable
ALTER TABLE "public"."tournaments" ADD COLUMN     "challongeTournamentURL" TEXT;
