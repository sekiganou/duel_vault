/*
  Warnings:

  - Added the required column `partecipants` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."tournaments" ADD COLUMN     "partecipants" INTEGER NOT NULL;
