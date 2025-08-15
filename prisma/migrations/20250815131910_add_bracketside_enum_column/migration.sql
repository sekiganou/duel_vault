/*
  Warnings:

  - You are about to drop the column `side` on the `BracketNode` table. All the data in the column will be lost.
  - You are about to drop the column `qualifier` on the `BracketNodeConnection` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."BracketSide" AS ENUM ('WINNER', 'LOSER');

-- AlterTable
ALTER TABLE "public"."Bracket" ADD COLUMN     "side" "public"."BracketSide" NOT NULL DEFAULT 'WINNER';

-- AlterTable
ALTER TABLE "public"."BracketNode" DROP COLUMN "side";

-- AlterTable
ALTER TABLE "public"."BracketNodeConnection" DROP COLUMN "qualifier";
