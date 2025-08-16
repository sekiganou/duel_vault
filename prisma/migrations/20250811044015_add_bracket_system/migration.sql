/*
  Warnings:

  - You are about to drop the `Bracket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BracketNode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BracketNodeConnection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupStage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupStageNode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupStageNodeConnection` table. If the table is not empty, all the data it contains will be lost.
*/
-- CreateEnum
CREATE TYPE "public"."TournamentStructure" AS ENUM ('SINGLE','DOUBLE','GROUP_SINGLE','GROUP_DOUBLE','DOUBLE_WITH_RESET');
ALTER TABLE "public"."tournaments" ADD COLUMN "structure" "public"."TournamentStructure" NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "public"."tournaments" ADD COLUMN "partecipants" INTEGER NOT NULL;

CREATE TYPE "public"."MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED');
ALTER TABLE "public"."matches" ADD COLUMN "status" "public"."MatchStatus" NOT NULL DEFAULT 'SCHEDULED';

CREATE TYPE "public"."BracketSide" AS ENUM ('WINNER', 'LOSER');
-- CreateTable
CREATE TABLE "public"."brackets" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "side" "public"."BracketSide" NOT NULL DEFAULT 'WINNER',

    CONSTRAINT "brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bracket_nodes" (
    "id" SERIAL NOT NULL,
    "bracketId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,

    CONSTRAINT "bracket_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bracket_node_connections" (
    "id" SERIAL NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER,

    CONSTRAINT "bracket_node_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_stages" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "participantsPerGroup" INTEGER NOT NULL,
    "advancePerGroup" INTEGER NOT NULL,

    CONSTRAINT "group_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_stage_nodes" (
    "id" SERIAL NOT NULL,
    "groupStageId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "groupNumber" INTEGER NOT NULL,

    CONSTRAINT "group_stage_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_stage_node_connections" (
    "id" SERIAL NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,

    CONSTRAINT "group_stage_node_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brackets_tournamentId_key" ON "public"."brackets"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "group_stages_tournamentId_key" ON "public"."group_stages"("tournamentId");

-- AddForeignKey
ALTER TABLE "public"."brackets" ADD CONSTRAINT "brackets_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bracket_nodes" ADD CONSTRAINT "bracket_nodes_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "public"."brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bracket_node_connections" ADD CONSTRAINT "bracket_node_connections_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."bracket_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bracket_node_connections" ADD CONSTRAINT "bracket_node_connections_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."bracket_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stages" ADD CONSTRAINT "group_stages_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stage_nodes" ADD CONSTRAINT "group_stage_nodes_groupStageId_fkey" FOREIGN KEY ("groupStageId") REFERENCES "public"."group_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stage_node_connections" ADD CONSTRAINT "group_stage_node_connections_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."group_stage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stage_node_connections" ADD CONSTRAINT "group_stage_node_connections_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."group_stage_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

