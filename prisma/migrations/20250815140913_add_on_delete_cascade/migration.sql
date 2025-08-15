-- FIXME: this migration scirpt is manually created, make it automatic

-- Drop old constraints
ALTER TABLE "public"."Bracket" DROP CONSTRAINT IF EXISTS "Bracket_tournamentId_fkey";
ALTER TABLE "public"."BracketNode" DROP CONSTRAINT IF EXISTS "BracketNode_bracketId_fkey";
ALTER TABLE "public"."BracketNodeConnection" DROP CONSTRAINT IF EXISTS "BracketNodeConnection_fromNodeId_fkey";
ALTER TABLE "public"."BracketNodeConnection" DROP CONSTRAINT IF EXISTS "BracketNodeConnection_toNodeId_fkey";
ALTER TABLE "public"."GroupStage" DROP CONSTRAINT IF EXISTS "GroupStage_tournamentId_fkey";
ALTER TABLE "public"."GroupStageNode" DROP CONSTRAINT IF EXISTS "GroupStageNode_bracketId_fkey";
ALTER TABLE "public"."GroupStageNodeConnection" DROP CONSTRAINT IF EXISTS "GroupStageNodeConnection_fromNodeId_fkey";
ALTER TABLE "public"."GroupStageNodeConnection" DROP CONSTRAINT IF EXISTS "GroupStageNodeConnection_toNodeId_fkey";

-- Add new constraints with cascading
ALTER TABLE "public"."Bracket"
  ADD CONSTRAINT "Bracket_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BracketNode"
  ADD CONSTRAINT "BracketNode_bracketId_fkey"
  FOREIGN KEY ("bracketId") REFERENCES "public"."Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BracketNodeConnection"
  ADD CONSTRAINT "BracketNodeConnection_fromNodeId_fkey"
  FOREIGN KEY ("fromNodeId") REFERENCES "public"."BracketNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."BracketNodeConnection"
  ADD CONSTRAINT "BracketNodeConnection_toNodeId_fkey"
  FOREIGN KEY ("toNodeId") REFERENCES "public"."BracketNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."GroupStage"
  ADD CONSTRAINT "GroupStage_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."GroupStageNode"
  ADD CONSTRAINT "GroupStageNode_bracketId_fkey"
  FOREIGN KEY ("groupStageId") REFERENCES "public"."GroupStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."GroupStageNodeConnection"
  ADD CONSTRAINT "GroupStageNodeConnection_fromNodeId_fkey"
  FOREIGN KEY ("fromNodeId") REFERENCES "public"."GroupStageNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."GroupStageNodeConnection"
  ADD CONSTRAINT "GroupStageNodeConnection_toNodeId_fkey"
  FOREIGN KEY ("toNodeId") REFERENCES "public"."GroupStageNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "public"."Bracket" RENAME TO "brackets";
ALTER TABLE "public"."BracketNode" RENAME TO "bracket_nodes";
ALTER TABLE "public"."BracketNodeConnection" RENAME TO "bracket_node_connections";
ALTER TABLE "public"."GroupStage" RENAME TO "group_stages";
ALTER TABLE "public"."GroupStageNode" RENAME TO "group_stage_nodes";
ALTER TABLE "public"."GroupStageNodeConnection" RENAME TO "group_stage_node_connections";

ALTER TABLE "public"."brackets" RENAME CONSTRAINT "Bracket_pkey" TO "brackets_pkey";
ALTER TABLE "public"."bracket_nodes" RENAME CONSTRAINT "BracketNode_pkey" TO "bracket_nodes_pkey";
ALTER TABLE "public"."bracket_node_connections" RENAME CONSTRAINT "BracketNodeConnection_pkey" TO "bracket_node_connections_pkey";
ALTER TABLE "public"."group_stages" RENAME CONSTRAINT "GroupStage_pkey" TO "group_stages_pkey";
ALTER TABLE "public"."group_stage_nodes" RENAME CONSTRAINT "GroupStageNode_pkey" TO "group_stage_nodes_pkey";
ALTER TABLE "public"."group_stage_node_connections" RENAME CONSTRAINT "GroupStageNodeConnection_pkey" TO "group_stage_node_connections_pkey";

-- Update table names in foreign key constraints
ALTER TABLE "public"."brackets" RENAME CONSTRAINT "Bracket_tournamentId_fkey" TO "brackets_tournamentId_fkey";
ALTER TABLE "public"."group_stages" RENAME CONSTRAINT "GroupStage_tournamentId_fkey" TO "group_stages_tournamentId_fkey";
ALTER TABLE "public"."bracket_node_connections" RENAME CONSTRAINT "BracketNodeConnection_fromNodeId_fkey" TO "bracket_node_connections_fromNodeId_fkey";
ALTER TABLE "public"."bracket_node_connections" RENAME CONSTRAINT "BracketNodeConnection_toNodeId_fkey" TO "bracket_node_connections_toNodeId_fkey";
ALTER TABLE "public"."group_stage_node_connections" RENAME CONSTRAINT "GroupStageNodeConnection_fromNodeId_fkey" TO "group_stage_node_connections_fromNodeId_fkey";
ALTER TABLE "public"."group_stage_node_connections" RENAME CONSTRAINT "GroupStageNodeConnection_toNodeId_fkey" TO "group_stage_node_connections_toNodeId_fkey";
ALTER TABLE "public"."bracket_nodes" RENAME CONSTRAINT "BracketNode_bracketId_fkey" TO "bracket_nodes_bracketId_fkey";
ALTER TABLE "public"."group_stage_nodes" RENAME CONSTRAINT "GroupStageNode_bracketId_fkey" TO "group_stage_nodes_groupStageId_fkey";