-- DropForeignKey
ALTER TABLE "public"."bracket_node_connections" DROP CONSTRAINT "BracketNodeConnection_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bracket_node_connections" DROP CONSTRAINT "BracketNodeConnection_toNodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bracket_nodes" DROP CONSTRAINT "BracketNode_bracketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_stage_node_connections" DROP CONSTRAINT "GroupStageNodeConnection_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_stage_node_connections" DROP CONSTRAINT "GroupStageNodeConnection_toNodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_stage_nodes" DROP CONSTRAINT "GroupStageNode_bracketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_stages" DROP CONSTRAINT "GroupStage_tournamentId_fkey";

-- AlterTable
ALTER TABLE "public"."bracket_node_connections" RENAME CONSTRAINT "BracketNodeConnection_pkey" TO "bracket_node_connections_pkey",
ALTER COLUMN "toNodeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."bracket_nodes" RENAME CONSTRAINT "BracketNode_pkey" TO "bracket_nodes_pkey";

-- AlterTable
ALTER TABLE "public"."brackets" RENAME CONSTRAINT "Bracket_pkey" TO "brackets_pkey";

-- AlterTable
ALTER TABLE "public"."group_stage_node_connections" RENAME CONSTRAINT "GroupStageNodeConnection_pkey" TO "group_stage_node_connections_pkey";

-- AlterTable
ALTER TABLE "public"."group_stage_nodes" RENAME CONSTRAINT "GroupStageNode_pkey" TO "group_stage_nodes_pkey";

-- AlterTable
ALTER TABLE "public"."group_stages" RENAME CONSTRAINT "GroupStage_pkey" TO "group_stages_pkey";

-- RenameForeignKey
ALTER TABLE "public"."brackets" RENAME CONSTRAINT "Bracket_tournamentId_fkey" TO "brackets_tournamentId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."group_stage_nodes" RENAME CONSTRAINT "GroupStageNode_groupStageId_fkey" TO "group_stage_nodes_groupStageId_fkey";

-- AddForeignKey
ALTER TABLE "public"."bracket_nodes" ADD CONSTRAINT "bracket_nodes_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "public"."brackets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bracket_node_connections" ADD CONSTRAINT "bracket_node_connections_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."bracket_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bracket_node_connections" ADD CONSTRAINT "bracket_node_connections_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."bracket_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stages" ADD CONSTRAINT "group_stages_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stage_node_connections" ADD CONSTRAINT "group_stage_node_connections_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "public"."group_stage_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_stage_node_connections" ADD CONSTRAINT "group_stage_node_connections_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "public"."group_stage_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."Bracket_tournamentId_key" RENAME TO "brackets_tournamentId_key";

-- RenameIndex
ALTER INDEX "public"."GroupStage_tournamentId_key" RENAME TO "group_stages_tournamentId_key";
