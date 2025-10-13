-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "public"."matches" DROP CONSTRAINT "matches_tournamentId_fkey";

-- AlterTable
ALTER TABLE "public"."tournaments" ADD COLUMN     "status" "public"."TournamentStatus" NOT NULL DEFAULT 'UPCOMING';

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
