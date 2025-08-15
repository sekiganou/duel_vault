/*
  Warnings:

  - Added the required column `structure` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TournamentStructure" AS ENUM ('SINGLE', 'DOUBLE', 'GROUP_SINGLE', 'GROUP_DOUBLE', 'DOUBLE_WITH_RESET');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."matches" ADD COLUMN     "status" "public"."MatchStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "public"."tournaments" ADD COLUMN     "structure" "public"."TournamentStructure" NOT NULL;

-- CreateTable
CREATE TABLE "public"."Bracket" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,

    CONSTRAINT "Bracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BracketNode" (
    "id" SERIAL NOT NULL,
    "bracketId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "side" TEXT NOT NULL,

    CONSTRAINT "BracketNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BracketNodeConnection" (
    "id" SERIAL NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,
    "qualifier" TEXT NOT NULL,

    CONSTRAINT "BracketNodeConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupStage" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "participantsPerGroup" INTEGER NOT NULL,
    "advancePerGroup" INTEGER NOT NULL,

    CONSTRAINT "GroupStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupStageNode" (
    "id" SERIAL NOT NULL,
    "groupStageId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "groupNumber" INTEGER NOT NULL,

    CONSTRAINT "GroupStageNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupStageNodeConnection" (
    "id" SERIAL NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,

    CONSTRAINT "GroupStageNodeConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bracket_tournamentId_key" ON "public"."Bracket"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupStage_tournamentId_key" ON "public"."GroupStage"("tournamentId");

-- AddForeignKey
ALTER TABLE "public"."Bracket" ADD CONSTRAINT "Bracket_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BracketNode" ADD CONSTRAINT "BracketNode_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "public"."Bracket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BracketNodeConnection" ADD CONSTRAINT "BracketNodeConnection_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."BracketNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BracketNodeConnection" ADD CONSTRAINT "BracketNodeConnection_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."BracketNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupStage" ADD CONSTRAINT "GroupStage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupStageNode" ADD CONSTRAINT "GroupStageNode_groupStageId_fkey" FOREIGN KEY ("groupStageId") REFERENCES "public"."GroupStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupStageNodeConnection" ADD CONSTRAINT "GroupStageNodeConnection_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."GroupStageNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupStageNodeConnection" ADD CONSTRAINT "GroupStageNodeConnection_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."GroupStageNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
