/*
  Warnings:

  - You are about to drop the `table_name` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."table_name";

-- CreateTable
CREATE TABLE "public"."decks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "archetypeId" INTEGER NOT NULL,
    "formatId" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournaments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "formatId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "link" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matches" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER,
    "deckAId" INTEGER NOT NULL,
    "deckBId" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "deckAScore" INTEGER NOT NULL,
    "deckBScore" INTEGER NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."archetypes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "archetypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."formats" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "formats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_deck_stats" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "deckId" INTEGER NOT NULL,
    "finalRank" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "ties" INTEGER NOT NULL,

    CONSTRAINT "tournament_deck_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "archetypes_name_key" ON "public"."archetypes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "formats_name_key" ON "public"."formats"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_deck_stats_tournamentId_deckId_key" ON "public"."tournament_deck_stats"("tournamentId", "deckId");

-- AddForeignKey
ALTER TABLE "public"."decks" ADD CONSTRAINT "decks_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "public"."archetypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."decks" ADD CONSTRAINT "decks_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "public"."formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournaments" ADD CONSTRAINT "tournaments_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "public"."formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_deckAId_fkey" FOREIGN KEY ("deckAId") REFERENCES "public"."decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_deckBId_fkey" FOREIGN KEY ("deckBId") REFERENCES "public"."decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matches" ADD CONSTRAINT "matches_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_deck_stats" ADD CONSTRAINT "tournament_deck_stats_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_deck_stats" ADD CONSTRAINT "tournament_deck_stats_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "public"."decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
