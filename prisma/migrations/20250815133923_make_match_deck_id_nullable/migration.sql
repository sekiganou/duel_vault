-- DropForeignKey
ALTER TABLE "public"."matches" DROP CONSTRAINT "matches_deckAId_fkey";

-- DropForeignKey
ALTER TABLE "public"."matches" DROP CONSTRAINT "matches_deckBId_fkey";

-- AlterTable
ALTER TABLE "public"."matches" ALTER COLUMN "deckAId" DROP NOT NULL,
ALTER COLUMN "deckBId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_deckAId_fkey" FOREIGN KEY ("deckAId") REFERENCES "public"."decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_deckBId_fkey" FOREIGN KEY ("deckBId") REFERENCES "public"."decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
