-- DropForeignKey
ALTER TABLE "public"."matches" DROP CONSTRAINT "matches_tournamentId_fkey";

-- AlterTable
ALTER TABLE "public"."tournaments" ALTER COLUMN "structure" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
