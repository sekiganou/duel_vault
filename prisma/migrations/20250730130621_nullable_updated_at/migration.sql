-- AlterTable
ALTER TABLE "public"."decks" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."matches" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."tournaments" ALTER COLUMN "updatedAt" DROP NOT NULL;
